<?php
/* ═══ لاین نوری استار — استاب: ارسال پیام (/messages/send) ═══
   وضعیت فاز ۲: فقط ۵۰۱ Not Implemented. منطق در فاز ۳.
   فاز ۳: ذخیره messages + ضداسپم honeypot/rate-limit سمت سرور.
   امنیت فاز ۳: PDO prepared + CSRF + rate-limit + نشست چرخشی. */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
http_response_code(501);
echo json_encode([
    'ok' => false,
    'error' => 'پیاده‌سازی نشده (Not Implemented).',
    'endpoint' => '/messages/send',
    'phase' => 2,
], JSON_UNESCAPED_UNICODE);
