<?php
/* ═══ کاربر جاری نشست ═══ */
declare(strict_types=1);

require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

lns_method(['GET']);
$u = lns_user();
if ($u === null) {
    lns_err('ورود لازم است.', 401);
}
lns_ok(['user' => $u]);
