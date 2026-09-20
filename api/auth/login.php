<?php
/* ═══ ورود با ایمیل یا موبایل + چرخش نشست ═══ */
declare(strict_types=1);

require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/rate_limit.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/audit.php';

lns_method(['POST']);
lns_check_csrf();

$in = lns_input();
$ident = trim((string) ($in['identifier'] ?? ($in['email'] ?? '')));
$pass = (string) ($in['pass'] ?? '');

$rl = lns_rl_check('auth:login:' . lns_client_ip() . ':' . sha1(strtolower($ident)), 5, 300);
if (!$rl['allowed']) {
    lns_err('به دلیل تلاش‌های ناموفق، موقتاً قفل است. ' . $rl['retry_after'] . ' ثانیه دیگر تلاش کنید.', 429, ['retry_after' => $rl['retry_after']]);
}

$pdo = lns_pdo();
$emailKey = strtolower(lns_fa2en($ident));
$phoneKey = lns_norm_phone($ident);
$st = $pdo->prepare('SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1');
$st->execute([$emailKey, $phoneKey]);
$u = $st->fetch();

if (!$u || !password_verify($pass, $u['password_hash'])) {
    lns_audit('', 'login_failed', mb_substr($ident, 0, 60));
    lns_err('ایمیل/شماره یا گذرواژه اشتباه است.', 401, ['remaining' => $rl['remaining']]);
}
if (($u['status'] ?? '') === 'blocked') {
    lns_err('این حساب مسدود شده است. با پشتیبانی تماس بگیرید.', 403);
}

if (password_needs_rehash($u['password_hash'], PASSWORD_ARGON2ID)) {
    $up = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $up->execute([lns_hash_password($pass), $u['id']]);
}

lns_rl_reset('auth:login:' . lns_client_ip() . ':' . sha1(strtolower($ident)));
lns_audit($u['id'], 'login', '');
$token = lns_create_session($u['id']);

$st = $pdo->prepare('SELECT id,name,phone,email,role,status,created_at,last_login FROM users WHERE id = ?');
$st->execute([$u['id']]);
lns_ok(['user' => $st->fetch(), 'csrf' => lns_csrf_for($token), 'refresh' => lns_jwt_encode(['sub' => $u['id'], 'typ' => 'refresh'], 30 * 24 * 3600)]);
