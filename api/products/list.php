<?php
/* ═══ لاین نوری استار — استاب: فهرست محصولات (/products/list) ═══
   وضعیت فاز ۲: فقط ۵۰۱ Not Implemented. منطق در فاز ۳.
   فاز ۳: SELECT با فیلتر دسته/جستجو/مرتب‌سازی + صفحه‌بندی.
   امنیت فاز ۳: PDO prepared + CSRF + rate-limit + نشست چرخشی. */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
http_response_code(501);
echo json_encode([
    'ok' => false,
    'error' => 'پیاده‌سازی نشده (Not Implemented).',
    'endpoint' => '/products/list',
    'phase' => 2,
], JSON_UNESCAPED_UNICODE);
