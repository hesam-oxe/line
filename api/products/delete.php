<?php
/* ═══ حذف محصول (ادمین) ═══ */
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

$pdo = lns_pdo();
$st = $pdo->prepare('DELETE FROM products WHERE id = ?');
$st->execute([$id]);
if ($st->rowCount() === 0) {
    lns_err('محصول یافت نشد.', 404);
}
lns_audit($admin['id'], 'product_delete', $id);
lns_ok(['id' => $id]);
