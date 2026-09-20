<?php
/* ═══ لاین نوری استار — استاب: تغییر وضعیت استعلام (ادمین) (/quotes/update) ═══
   وضعیت فاز ۲: فقط ۵۰۱ Not Implemented. منطق در فاز ۳.
   فاز ۳: new/review/invoice/done/rejected + یادداشت ادمین.
   امنیت فاز ۳: PDO prepared + CSRF + rate-limit + نشست چرخشی. */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
http_response_code(501);
echo json_encode([
    'ok' => false,
    'error' => 'پیاده‌سازی نشده (Not Implemented).',
    'endpoint' => '/quotes/update',
    'phase' => 2,
], JSON_UNESCAPED_UNICODE);
