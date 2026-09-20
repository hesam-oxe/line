<?php
/* ═══ ویرایش محصول (ادمین، جزئی) ═══ */
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
    lns_err('شناسه محصول لازم است.', 422);
}

$fields = [];
$args = [];
if (array_key_exists('name', $in)) {
    $v = lns_clean($in['name'], 80);
    if (mb_strlen($v, 'UTF-8') < 3 || mb_strlen($v, 'UTF-8') > 80) {
        lns_err('نام محصول باید ۳ تا ۸۰ حرف باشد.', 422);
    }
    $fields[] = 'name = ?';
    $args[] = $v;
}
if (array_key_exists('cat', $in) || array_key_exists('category', $in)) {
    $v = lns_enum($in['cat'] ?? $in['category'], ['mono', 'rgb', 'rgbw', 'cob', 'profile', 'driver']);
    if ($v === null) {
        lns_err('دسته نامعتبر است.', 422);
    }
    $fields[] = 'category = ?';
    $args[] = $v;
}
foreach (['price' => [0, 1000000000], 'stock' => [0, 1000000]] as $k => [$mn, $mx]) {
    if (array_key_exists($k, $in)) {
        $v = lns_int($in[$k], $mn, $mx);
        if ($v === null) {
            lns_err("مقدار $k نامعتبر است.", 422);
        }
        $fields[] = "$k = ?";
        $args[] = $v;
    }
}
foreach (['description' => 500, 'desc' => 500, 'image' => 255] as $k => $mx) {
    if (array_key_exists($k, $in)) {
        $col = $k === 'desc' ? 'description' : $k;
        $v = lns_clean($in[$k], $mx);
        $fields[] = "$col = ?";
        $args[] = $v;
    }
}
if (!$fields) {
    lns_err('هیچ فیلدی برای به‌روزرسانی داده نشد.', 422);
}

$pdo = lns_pdo();
$args[] = $id;
$st = $pdo->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?');
$st->execute($args);
if ($st->rowCount() === 0) {
    $chk = $pdo->prepare('SELECT id FROM products WHERE id = ?');
    $chk->execute([$id]);
    if (!$chk->fetch()) {
        lns_err('محصول یافت نشد.', 404);
    }
}
lns_audit($admin['id'], 'product_update', $id);
lns_ok(['id' => $id]);
