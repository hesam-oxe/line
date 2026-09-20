<?php
/* ═══ ایجاد محصول (ادمین) ═══ */
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
$name = lns_clean($in['name'] ?? '', 80);
$cat = lns_enum($in['cat'] ?? 'mono', ['mono', 'rgb', 'rgbw', 'cob', 'profile', 'driver']);
$price = lns_int($in['price'] ?? '', 0, 1000000000);
$stock = lns_int($in['stock'] ?? 0, 0, 1000000) ?? 0;
$desc = lns_clean($in['description'] ?? ($in['desc'] ?? ''), 500);
$image = lns_clean($in['image'] ?? '', 255);

if (mb_strlen($name, 'UTF-8') < 3) {
    lns_err('نام محصول باید ۳ تا ۸۰ حرف باشد.', 422);
}
if ($cat === null) {
    lns_err('دسته نامعتبر است.', 422);
}
if ($price === null) {
    lns_err('قیمت نامعتبر است.', 422);
}

$pdo = lns_pdo();
$id = lns_uuid();
$slug = lns_slug($name) . '-' . substr(str_replace('-', '', $id), 0, 8);
$now = lns_now_ms();
$ins = $pdo->prepare('INSERT INTO products (id,slug,name,description,price,category,image,stock,created_at) VALUES (?,?,?,?,?,?,?,?,?)');
$ins->execute([$id, $slug, $name, $desc, $price, $cat, $image, $stock, $now]);
lns_audit($admin['id'], 'product_create', $id);
lns_ok(['id' => $id, 'slug' => $slug], 201);
