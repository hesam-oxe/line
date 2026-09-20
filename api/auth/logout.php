<?php
/* ═══ خروج: ابطال نشست + پاک‌سازی کوکی ═══ */
declare(strict_types=1);

require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/audit.php';

lns_method(['POST']);
lns_check_csrf();

$u = lns_user();
if ($u !== null) {
    lns_audit($u['id'], 'logout', '');
}
lns_destroy_session();
lns_ok(['message' => 'با موفقیت خارج شدید.']);
