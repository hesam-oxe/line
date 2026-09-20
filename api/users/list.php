<?php
/* ═══ فهرست کاربران (ادمین، بدون password_hash) ═══ */
declare(strict_types=1);

require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

lns_method(['GET']);
lns_require_admin();

$limit = lns_int($_GET['limit'] ?? 50, 1, 100) ?? 50;
$offset = lns_int($_GET['offset'] ?? 0, 0, 100000) ?? 0;

$pdo = lns_pdo();
$st = $pdo->prepare('SELECT id,name,phone,email,role,status,created_at,last_login FROM users ORDER BY created_at DESC LIMIT ' . $limit . ' OFFSET ' . $offset);
$st->execute();
lns_ok(['items' => $st->fetchAll()]);
