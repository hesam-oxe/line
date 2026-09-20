<?php
/* ═══ لاین نوری استار — محدودیت نرخ فایل‌محور ═══
   بدون نیاز به جدول دیتابیس؛ امن برای ۲ گیگ رم و تک‌پردازه.
   کلیدها در دایرکتوری موقت سیستم با قفل flock ذخیره می‌شوند. */
declare(strict_types=1);

function lns_client_ip(): string
{
    $fwd = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if (is_string($fwd) && $fwd !== '') {
        $first = trim(explode(',', $fwd)[0]);
        if (filter_var($first, FILTER_VALIDATE_IP)) {
            return $first;
        }
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    return is_string($ip) ? $ip : '127.0.0.1';
}

function lns_rl_dir(): string
{
    $d = rtrim(sys_get_temp_dir(), '/') . '/lns_rl';
    if (!is_dir($d)) {
        @mkdir($d, 0700, true);
    }
    return $d;
}

/* بررسی و ثبت یک تلاش؛ ['allowed'=>bool,'remaining'=>int,'retry_after'=>int] */
function lns_rl_check(string $key, int $max, int $windowSec): array
{
    $file = lns_rl_dir() . '/rl_' . sha1($key) . '.json';
    $now = time();
    $fp = @fopen($file, 'c+');
    if ($fp === false) {
        return ['allowed' => true, 'remaining' => $max, 'retry_after' => 0];
    }
    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $st = $raw !== false && $raw !== '' ? json_decode($raw, true) : null;
    if (!is_array($st) || !isset($st['start'], $st['count']) || ($now - (int) $st['start']) >= $windowSec) {
        $st = ['start' => $now, 'count' => 0];
    }
    $st['count'] = (int) $st['count'] + 1;
    $allowed = $st['count'] <= $max;
    $remaining = max(0, $max - $st['count']);
    $retry = $allowed ? 0 : (int) ($st['start'] + $windowSec - $now);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($st));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['allowed' => $allowed, 'remaining' => $remaining, 'retry_after' => max(0, $retry)];
}

function lns_rl_reset(string $key): void
{
    @unlink(lns_rl_dir() . '/rl_' . sha1($key) . '.json');
}
