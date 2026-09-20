<?php
/* ═══ فهرست محصولات (عمومی) ═══ */
declare(strict_types=1);

require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/db.php';

lns_method(['GET']);

$cat = trim((string) ($_GET['cat'] ?? 'all'));
$q = trim((string) ($_GET['q'] ?? ''));
$sort = trim((string) ($_GET['sort'] ?? 'pop'));
$limit = lns_int($_GET['limit'] ?? 50, 1, 100) ?? 50;
$offset = lns_int($_GET['offset'] ?? 0, 0, 100000) ?? 0;

$allowedCats = ['mono', 'rgb', 'rgbw', 'cob', 'profile', 'driver'];
$where = [];
$args = [];
if ($cat !== 'all') {
    if (!in_array($cat, $allowedCats, true)) {
        lns_err('دسته نامعتبر است.', 422);
    }
    $where[] = 'category = ?';
    $args[] = $cat;
}
if ($q !== '') {
    $where[] = '(name LIKE ? OR description LIKE ?)';
    $args[] = '%' . mb_substr($q, 0, 60, 'UTF-8') . '%';
    $args[] = '%' . mb_substr($q, 0, 60, 'UTF-8') . '%';
}
$order = match ($sort) {
    'cheap' => 'price ASC',
    'exp' => 'price DESC',
    default => 'created_at DESC',
};

$pdo = lns_pdo();
$sql = 'SELECT id,slug,name,description,price,category,image,stock,created_at FROM products';
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY ' . $order . ' LIMIT ' . $limit . ' OFFSET ' . $offset;
$st = $pdo->prepare($sql);
$st->execute($args);
$rows = $st->fetchAll();

$cnt = 'SELECT COUNT(*) c FROM products' . ($where ? ' WHERE ' . implode(' AND ', $where) : '');
$cs = $pdo->prepare($cnt);
$cs->execute($args);
lns_ok(['items' => $rows, 'total' => (int) $cs->fetch()['c']]);
