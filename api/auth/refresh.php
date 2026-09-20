<?php
/* ═══ تازه‌سازی نشست با JWT یا کوکی جاری ═══ */
declare(strict_types=1);

require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/rate_limit.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/audit.php';

lns_method(['POST']);

$in = lns_input();
$userId = null;

// مسیر ۱: JWT تازه‌سازی در بدنه
if (!empty($in['refresh']) && is_string($in['refresh'])) {
    $rl = lns_rl_check('auth:refresh:' . lns_client_ip(), 10, 60);
    if (!$rl['allowed']) {
        lns_err('درخواست‌های بیش از حد.', 429);
    }
    $p = lns_jwt_decode($in['refresh']);
    if ($p === null || ($p['typ'] ?? '') !== 'refresh' || empty($p['sub'])) {
        lns_err('توکن تازه‌سازی نامعتبر است.', 401);
    }
    $userId = (string) $p['sub'];
} else {
    // مسیر ۲: نشست کوکی + CSRF
    lns_check_csrf();
    $u = lns_user();
    if ($u === null) {
        lns_err('نشست معتبر نیست.', 401);
    }
    $userId = $u['id'];
}

$pdo = lns_pdo();
$st = $pdo->prepare("SELECT id FROM users WHERE id = ? AND status = 'active' LIMIT 1");
$st->execute([$userId]);
if (!$st->fetch()) {
    lns_err('کاربر یافت نشد یا مسدود است.', 401);
}

lns_audit($userId, 'refresh', '');
$token = lns_create_session($userId);
lns_ok(['csrf' => lns_csrf_for($token), 'refresh' => lns_jwt_encode(['sub' => $userId, 'typ' => 'refresh'], 30 * 24 * 3600)]);
