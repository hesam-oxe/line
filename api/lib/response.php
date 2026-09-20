<?php
/* ═══ لاین نوری استار — پاسخ‌های استاندارد JSON ═══ */
declare(strict_types=1);

function lns_json(array $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function lns_ok(array $data = [], int $code = 200): void
{
    lns_json(['ok' => true] + $data, $code);
}

function lns_err(string $msg, int $code = 400, array $extra = []): void
{
    lns_json(['ok' => false, 'error' => $msg] + $extra, $code);
}

/* ورودی یکپارچه: فرم + JSON */
function lns_input(): array
{
    $in = [];
    foreach ($_POST as $k => $v) {
        $in[$k] = is_string($v) ? $v : '';
    }
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    $raw = file_get_contents('php://input');
    if (is_string($raw) && $raw !== '' && (str_contains($ct, 'json') || str_starts_with(ltrim($raw), '{'))) {
        $j = json_decode($raw, true);
        if (is_array($j)) {
            foreach ($j as $k => $v) {
                if (is_string($k) && (is_string($v) || is_numeric($v))) {
                    $in[$k] = (string) $v;
                }
            }
        }
    }
    return $in;
}

function lns_method(array $allowed): string
{
    $m = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (!in_array($m, $allowed, true)) {
        lns_err('متد مجاز نیست.', 405, ['allowed' => $allowed]);
    }
    return $m;
}
