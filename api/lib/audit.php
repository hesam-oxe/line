<?php
/* ═══ لاین نوری استار — ثبت حسابرسی ═══ */
declare(strict_types=1);

function lns_audit(string $userId, string $action, string $target = ''): void
{
    try {
        require_once __DIR__ . '/db.php';
        $pdo = lns_pdo();
        $st = $pdo->prepare('INSERT INTO audit_log (user_id, action, target, created_at) VALUES (?,?,?,?)');
        $st->execute([$userId, mb_substr($action, 0, 64), mb_substr($target, 0, 128), lns_now_ms()]);
    } catch (Throwable) {
        // حسابرسی نباید درخواست را بشکند
    }
}
