<?php
/* ═══ فهرست استعلام‌ها: کاربر فقط مال خود، ادمین همه ═══ */
declare(strict_types=1);

require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

lns_method(['GET']);
$u = lns_require_auth();

$status = trim((string) ($_GET['status'] ?? ''));
if ($status !== '' && !in_array($status, ['new', 'review', 'invoice', 'done', 'rejected'], true)) {
    lns_err('وضعیت نامعتبر است.', 422);
}
$limit = lns_int($_GET['limit'] ?? 50, 1, 100) ?? 50;
$offset = lns_int($_GET['offset'] ?? 0, 0, 100000) ?? 0;

$pdo = lns_pdo();
$where = [];
$args = [];
if (($u['role'] ?? '') !== 'admin') {
    $where[] = 'user_id = ?';
    $args[] = $u['id'];
} elseif (!empty($_GET['user_id'])) {
    $where[] = 'user_id = ?';
    $args[] = mb_substr((string) $_GET['user_id'], 0, 64);
}
if ($status !== '') {
    $where[] = 'status = ?';
    $args[] = $status;
}
$sql = 'SELECT * FROM quotes' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY created_at DESC LIMIT ' . $limit . ' OFFSET ' . $offset;
$st = $pdo->prepare($sql);
$st->execute($args);
lns_ok(['items' => $st->fetchAll()]);
