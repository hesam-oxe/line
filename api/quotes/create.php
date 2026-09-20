<?php
/* ═══ ثبت استعلام (کاربر احرازهویت‌شده) — تک‌قلمی یا چندقلمی ═══ */
declare(strict_types=1);

require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/validate.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/audit.php';

lns_method(['POST']);
lns_check_csrf();
$u = lns_require_auth();

$in = lns_input();
$items = [];
if (isset($in['items']) && is_string($in['items'])) {
    $decoded = json_decode($in['items'], true);
    if (is_array($decoded)) {
        $in['items'] = $decoded;
    }
}
// توجه: lns_input فقط رشته نگه می‌دارد؛ items را از بدنه خام می‌خوانیم
$raw = file_get_contents('php://input');
if (is_string($raw) && $raw !== '') {
    $j = json_decode($raw, true);
    if (is_array($j) && isset($j['items']) && is_array($j['items'])) {
        $in['items'] = $j['items'];
    }
}

if (isset($in['items']) && is_array($in['items'])) {
    foreach (array_slice($in['items'], 0, 30) as $it) {
        if (!is_array($it)) {
            continue;
        }
        $pid = isset($it['productId']) ? (string) $it['productId'] : (string) ($it['product_id'] ?? '');
        $qty = lns_int($it['qty'] ?? ($it['quantity'] ?? 1), 1, 999) ?? 1;
        $items[] = ['product_id' => mb_substr($pid, 0, 64), 'qty' => $qty];
    }
} else {
    $pid = (string) ($in['product_id'] ?? '');
    $qty = lns_int($in['quantity'] ?? 1, 1, 999) ?? 1;
    $items[] = ['product_id' => mb_substr($pid, 0, 64), 'qty' => $qty];
}
if (!$items) {
    lns_err('سبد استعلام خالی است.', 422);
}
$note = lns_str($in['note'] ?? ($in['message'] ?? ''), 0, 500) ?? '';

$pdo = lns_pdo();
$chk = $pdo->prepare('SELECT id FROM products WHERE id = ? LIMIT 1');
$ids = [];
$now = lns_now_ms();
$ins = $pdo->prepare('INSERT INTO quotes (id,user_id,product_id,quantity,message,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)');
foreach ($items as $it) {
    if ($it['product_id'] !== '') {
        $chk->execute([$it['product_id']]);
        if (!$chk->fetch()) {
            lns_err('محصول یافت نشد: ' . $it['product_id'], 404);
        }
    }
    $id = lns_uuid();
    $ins->execute([$id, $u['id'], $it['product_id'], $it['qty'], $note, 'new', $now, $now]);
    $ids[] = $id;
}
lns_audit($u['id'], 'quote_create', implode(',', array_slice($ids, 0, 3)));
lns_ok(['ids' => $ids], 201);
