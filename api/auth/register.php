<?php
/* ═══ ثبت‌نام: اولین کاربر ادمین می‌شود ═══ */
declare(strict_types=1);

require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/rate_limit.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/audit.php';

lns_method(['POST']);
lns_check_csrf();

$rl = lns_rl_check('auth:register:' . lns_client_ip(), 10, 60);
if (!$rl['allowed']) {
    lns_err('درخواست‌های بیش از حد. کمی بعد تلاش کنید.', 429, ['retry_after' => $rl['retry_after']]);
}

$in = lns_input();
$name = lns_clean($in['name'] ?? '', 60);
$phone = lns_norm_phone((string) ($in['phone'] ?? ''));
$email = strtolower(trim((string) ($in['email'] ?? '')));
$pass = (string) ($in['pass'] ?? '');
$pass2 = (string) ($in['pass2'] ?? '');

if (mb_strlen($name, 'UTF-8') < 3) {
    lns_err('نام را کامل وارد کنید (حداقل ۳ حرف).', 422);
}
if (!lns_is_phone($phone)) {
    lns_err('شماره موبایل معتبر نیست (مثال: 09123456789).', 422);
}
if (!lns_is_email($email)) {
    lns_err('ایمیل معتبر نیست.', 422);
}
if ($pass !== $pass2) {
    lns_err('تکرار گذرواژه مطابقت ندارد.', 422);
}
$perr = lns_password_error($pass);
if ($perr !== null) {
    lns_err($perr, 422);
}

$pdo = lns_pdo();
$dup = $pdo->prepare('SELECT id FROM users WHERE email = ? OR phone = ? LIMIT 1');
$dup->execute([$email, $phone]);
if ($dup->fetch()) {
    lns_err('این ایمیل یا شماره موبایل قبلاً ثبت شده است.', 409);
}

$count = (int) $pdo->query('SELECT COUNT(*) c FROM users')->fetch()['c'];
$role = $count === 0 ? 'admin' : 'customer';

$id = lns_uuid();
$now = lns_now_ms();
$ins = $pdo->prepare('INSERT INTO users (id,name,phone,email,password_hash,role,status,created_at,last_login) VALUES (?,?,?,?,?,?,?, ?,0)');
$ins->execute([$id, $name, $phone, $email, lns_hash_password($pass), $role, 'active', $now]);

lns_audit($id, 'register', $role);
$token = lns_create_session($id);

$st = $pdo->prepare('SELECT id,name,phone,email,role,status,created_at,last_login FROM users WHERE id = ?');
$st->execute([$id]);
lns_ok(['user' => $st->fetch(), 'csrf' => lns_csrf_for($token), 'refresh' => lns_jwt_encode(['sub' => $id, 'typ' => 'refresh'], 30 * 24 * 3600)], 201);
