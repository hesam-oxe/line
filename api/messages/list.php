<?php
/* ═══ فهرست پیام‌ها: مال خود؛ ادمین همه ═══ */
declare(strict_types=1);

require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

lns_method(['GET']);
$u = lns_require_auth();

$limit = lns_int($_GET['limit'] ?? 50, 1, 100) ?? 50;
$offset = lns_int($_GET['offset'] ?? 0, 0, 100000) ?? 0;

$pdo = lns_pdo();
if (($u['role'] ?? '') === 'admin') {
    $st = $pdo->prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT ' . $limit . ' OFFSET ' . $offset);
    $st->execute();
} else {
    $st = $pdo->prepare('SELECT * FROM messages WHERE from_user = ? OR to_user = ? ORDER BY created_at DESC LIMIT ' . $limit . ' OFFSET ' . $offset);
    $st->execute([$u['id'], $u['id']]);
}
lns_ok(['items' => $st->fetchAll()]);
