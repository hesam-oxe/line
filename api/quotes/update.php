<?php
/* ═══ تغییر وضعیت استعلام (ادمین) ═══ */
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
$status = lns_enum($in['status'] ?? '', ['new', 'review', 'invoice', 'done', 'rejected']);
$note = lns_clean($in['adminNote'] ?? ($in['note'] ?? ''), 400);
if ($id === null) {
    lns_err('شناسه استعلام لازم است.', 422);
}
if ($status === null) {
    lns_err('وضعیت نامعتبر است.', 422);
}

$pdo = lns_pdo();
$st = $pdo->prepare('UPDATE quotes SET status = ?, updated_at = ? WHERE id = ?');
$st->execute([$status, lns_now_ms(), $id]);
if ($st->rowCount() === 0) {
    $chk = $pdo->prepare('SELECT id FROM quotes WHERE id = ?');
    $chk->execute([$id]);
    if (!$chk->fetch()) {
        lns_err('استعلام یافت نشد.', 404);
    }
}
// یادداشت ادمین در لاگ حسابرسی (اسکیما ستون جدا ندارد)
lns_audit($admin['id'], 'quote_update:' . $status, $id . ($note !== '' ? '|' . mb_substr($note, 0, 80) : ''));
lns_ok(['id' => $id, 'status' => $status]);
