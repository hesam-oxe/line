<?php
/* ═══ ویرایش کاربر: نقش/وضعیت (ادمین؛ نه خودش) ═══ */
declare(strict_types=1);

require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/audit.php';

lns_method(['POST']);
lns_check_csrf();
$admin = lns_require_admin();

$in = lns_input();
$id = lns_str($in['id'] ?? '', 1, 64);
if ($id === null) {
    lns_err('شناسه کاربر لازم است.', 422);
}
if ($id === $admin['id']) {
    lns_err('تغییر حساب خودتان مجاز نیست.', 403);
}

$fields = [];
$args = [];
if (array_key_exists('role', $in)) {
    $v = lns_enum($in['role'], ['admin', 'customer']);
    if ($v === null) {
        lns_err('نقش نامعتبر است.', 422);
    }
    $fields[] = 'role = ?';
    $args[] = $v;
}
if (array_key_exists('status', $in)) {
    $v = lns_enum($in['status'], ['active', 'blocked']);
    if ($v === null) {
        lns_err('وضعیت نامعتبر است.', 422);
    }
    $fields[] = 'status = ?';
    $args[] = $v;
}
if (!$fields) {
    lns_err('هیچ فیلدی برای به‌روزرسانی داده نشد.', 422);
}

$pdo = lns_pdo();
$args[] = $id;
$st = $pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?');
$st->execute($args);
if ($st->rowCount() === 0) {
    $chk = $pdo->prepare('SELECT id FROM users WHERE id = ?');
    $chk->execute([$id]);
    if (!$chk->fetch()) {
        lns_err('کاربر یافت نشد.', 404);
    }
}
lns_audit($admin['id'], 'user_update', $id . ':' . implode(',', $fields));
lns_ok(['id' => $id]);
