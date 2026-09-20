<?php
/* ═══ ارسال پیام (کاربر احرازهویت‌شده) ═══ */
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
$body = lns_str($in['body'] ?? '', 1, 600);
$subject = lns_str($in['subject'] ?? '', 0, 120) ?? '';
$to = lns_str($in['to_user'] ?? '', 0, 64) ?? '';
if ($body === null) {
    lns_err('متن پیام خالی است (۱ تا ۶۰۰ حرف).', 422);
}

$pdo = lns_pdo();
$id = lns_uuid();
$ins = $pdo->prepare('INSERT INTO messages (id,from_user,to_user,subject,body,read,created_at) VALUES (?,?,?,?,?,0,?)');
$ins->execute([$id, $u['id'], $to, $subject, $body, lns_now_ms()]);
lns_audit($u['id'], 'message_send', $id);
lns_ok(['id' => $id], 201);
