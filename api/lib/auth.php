<?php
/* ═══ لاین نوری استار — نشست، CSRF، گذرواژه، JWT ═══
   نشست: توکن opaque در جدول sessions + کوکی HttpOnly/SameSite=Strict.
   CSRF: دابل‌سابمیت — توکن = HMAC(session|anon)؛ همه POSTها الزامی.
   گذرواژه: Argon2id. JWT: HS256 حداقلی برای refresh. */
declare(strict_types=1);

require_once __DIR__ . '/db.php';

const LNS_SESSION_COOKIE = 'lns_session';
const LNS_CSRF_COOKIE = 'lns_csrf';
const LNS_SESSION_TTL = 7 * 24 * 60 * 60;

function lns_secrets(): array
{
    $sess = 'DEV_ONLY_SESSION_SECRET__local-testing';
    $csrf = 'DEV_ONLY_CSRF_SECRET__local-testing';
    if (defined('SESSION_SECRET') && !str_starts_with((string) SESSION_SECRET, 'TODO_')) {
        $sess = (string) SESSION_SECRET;
    }
    if (defined('CSRF_SECRET') && !str_starts_with((string) CSRF_SECRET, 'TODO_')) {
        $csrf = (string) CSRF_SECRET;
    }
    return [$sess, $csrf];
}

function lns_is_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }
    return ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

function lns_cookie_params(bool $httpOnly): array
{
    return [
        'expires' => time() + LNS_SESSION_TTL,
        'path' => '/',
        'secure' => lns_is_https(),
        'httponly' => $httpOnly,
        'samesite' => 'Strict',
    ];
}

function lns_set_session_cookie(string $token): void
{
    setcookie(LNS_SESSION_COOKIE, $token, lns_cookie_params(true));
}

function lns_clear_cookies(): void
{
    setcookie(LNS_SESSION_COOKIE, '', ['expires' => 1, 'path' => '/', 'samesite' => 'Strict']);
    setcookie(LNS_CSRF_COOKIE, '', ['expires' => 1, 'path' => '/', 'samesite' => 'Strict']);
}

function lns_csrf_for(string $scope): string
{
    [, $csrf] = lns_secrets();
    return hash_hmac('sha256', $scope, $csrf);
}

function lns_set_csrf_cookie(string $scope): string
{
    $t = lns_csrf_for($scope);
    setcookie(LNS_CSRF_COOKIE, $t, lns_cookie_params(false));
    return $t;
}

/* نشست جاری از روی کوکی؛ null = ناشناس/منقضی */
function lns_session_row(): ?array
{
    $tok = $_COOKIE[LNS_SESSION_COOKIE] ?? '';
    if (!is_string($tok) || $tok === '') {
        return null;
    }
    try {
        $pdo = lns_pdo();
        $st = $pdo->prepare('SELECT * FROM sessions WHERE token = ? LIMIT 1');
        $st->execute([$tok]);
        $s = $st->fetch();
        if (!$s || (int) $s['expires_at'] < lns_now_ms()) {
            return null;
        }
        return $s;
    } catch (Throwable) {
        return null;
    }
}

/* کاربر جاری بدون password_hash؛ null = ورود لازم */
function lns_user(): ?array
{
    $s = lns_session_row();
    if ($s === null) {
        return null;
    }
    try {
        $pdo = lns_pdo();
        $st = $pdo->prepare('SELECT id,name,phone,email,role,status,created_at,last_login FROM users WHERE id = ? LIMIT 1');
        $st->execute([$s['user_id']]);
        $u = $st->fetch();
        if (!$u || ($u['status'] ?? '') === 'blocked') {
            return null;
        }
        return $u;
    } catch (Throwable) {
        return null;
    }
}

function lns_require_auth(): array
{
    $u = lns_user();
    if ($u === null) {
        require_once __DIR__ . '/response.php';
        lns_err('ورود لازم است.', 401);
    }
    return $u;
}

function lns_require_admin(): array
{
    $u = lns_require_auth();
    if (($u['role'] ?? '') !== 'admin') {
        require_once __DIR__ . '/response.php';
        lns_err('دسترسی فقط برای مدیر.', 403);
    }
    return $u;
}

/* ساخت نشست جدید با چرخش (نشست‌های قبلی همین کاربر پاک می‌شود) */
function lns_create_session(string $userId): string
{
    $pdo = lns_pdo();
    $del = $pdo->prepare('DELETE FROM sessions WHERE user_id = ?');
    $del->execute([$userId]);
    $token = bin2hex(random_bytes(32));
    $now = lns_now_ms();
    $ins = $pdo->prepare('INSERT INTO sessions (id, user_id, token, expires_at, ip, user_agent, created_at) VALUES (?,?,?,?,?,?,?)');
    require_once __DIR__ . '/rate_limit.php';
    $ins->execute([lns_uuid(), $userId, $token, $now + LNS_SESSION_TTL * 1000, lns_client_ip(), mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255), $now]);
    $upd = $pdo->prepare('UPDATE users SET last_login = ? WHERE id = ?');
    $upd->execute([$now, $userId]);
    lns_set_session_cookie($token);
    lns_set_csrf_cookie($token);
    return $token;
}

function lns_destroy_session(): void
{
    $tok = $_COOKIE[LNS_SESSION_COOKIE] ?? '';
    if (is_string($tok) && $tok !== '') {
        try {
            $pdo = lns_pdo();
            $st = $pdo->prepare('DELETE FROM sessions WHERE token = ?');
            $st->execute([$tok]);
        } catch (Throwable) {
        }
    }
    lns_clear_cookies();
}

/* بررسی CSRF برای همه POST/PUT/PATCH/DELETE — ۴۰۳ در صورت نقص */
function lns_check_csrf(): void
{
    $m = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (in_array($m, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }
    require_once __DIR__ . '/response.php';
    $got = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf'] ?? '');
    if (!is_string($got) || $got === '') {
        $raw = file_get_contents('php://input');
        if (is_string($raw) && $raw !== '') {
            $j = json_decode($raw, true);
            if (is_array($j) && isset($j['csrf']) && is_string($j['csrf'])) {
                $got = $j['csrf'];
            }
        }
    }
    $sess = $_COOKIE[LNS_SESSION_COOKIE] ?? '';
    $scope = (is_string($sess) && $sess !== '') ? $sess : 'anon';
    if (!is_string($got) || $got === '' || !hash_equals(lns_csrf_for($scope), $got)) {
        lns_err('توکن CSRF نامعتبر است.', 403);
    }
}

/* صدور کوکی CSRF ناشناس برای فرم‌های ورود/ثبت‌نام (GET) */
function lns_issue_anon_csrf(): void
{
    $sess = $_COOKIE[LNS_SESSION_COOKIE] ?? '';
    if (is_string($sess) && $sess !== '') {
        return;
    }
    if (empty($_COOKIE[LNS_CSRF_COOKIE])) {
        lns_set_csrf_cookie('anon');
    }
}

function lns_hash_password(string $p): string
{
    return password_hash($p, PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1]);
}

/* ── JWT حداقلی HS256 ── */
function lns_b64u_encode(string $b): string
{
    return rtrim(strtr(base64_encode($b), '+/', '-_'), '=');
}

function lns_b64u_decode(string $s): ?string
{
    $b = base64_decode(strtr($s, '-_', '+/'), true);
    return $b === false ? null : $b;
}

function lns_jwt_encode(array $payload, int $ttlSec): string
{
    [$sess] = lns_secrets();
    $header = lns_b64u_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] = time() + $ttlSec;
    $body = lns_b64u_encode(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $sig = lns_b64u_encode(hash_hmac('sha256', $header . '.' . $body, $sess, true));
    return $header . '.' . $body . '.' . $sig;
}

function lns_jwt_decode(string $jwt): ?array
{
    [$sess] = lns_secrets();
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }
    [$h, $b, $s] = $parts;
    $expect = lns_b64u_encode(hash_hmac('sha256', $h . '.' . $b, $sess, true));
    if (!hash_equals($expect, $s)) {
        return null;
    }
    $raw = lns_b64u_decode($b);
    if ($raw === null) {
        return null;
    }
    $p = json_decode($raw, true);
    if (!is_array($p) || !isset($p['exp']) || (int) $p['exp'] < time()) {
        return null;
    }
    return $p;
}
