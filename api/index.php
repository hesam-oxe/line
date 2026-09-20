<?php
/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — روتر فرانت‌کنترلر API
   آپاچی: via .htaccess همه درخواست‌ها به اینجا می‌آیند.
   سرور داخلی PHP: با حالت روتر اجرا کنید:
     php -S localhost:8001 api/index.php
   فاز ۲: فقط مسیریابی + استاب ۵۰۱. منطق در فاز ۳.
   ═══════════════════════════════════════════════════════════ */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?: '/';
$path = '/' . trim($path, '/');
if ($path === '/') {
    $path = '/index';
}

// ── نگاشت مسیر تمیز به فایل استاب ──
$routes = [
    '/index' => null, // همین فایل (راهنما)
    '/health' => null, // سلامت (پیاده‌سازی‌شده برای تست محلی)
    '/auth/register' => __DIR__ . '/auth/register.php',
    '/auth/login' => __DIR__ . '/auth/login.php',
    '/auth/logout' => __DIR__ . '/auth/logout.php',
    '/auth/refresh' => __DIR__ . '/auth/refresh.php',
    '/products/list' => __DIR__ . '/products/list.php',
    '/products/create' => __DIR__ . '/products/create.php',
    '/products/update' => __DIR__ . '/products/update.php',
    '/products/delete' => __DIR__ . '/products/delete.php',
    '/quotes/create' => __DIR__ . '/quotes/create.php',
    '/quotes/list' => __DIR__ . '/quotes/list.php',
    '/quotes/update' => __DIR__ . '/quotes/update.php',
    '/messages/send' => __DIR__ . '/messages/send.php',
    '/messages/list' => __DIR__ . '/messages/list.php',
    '/users/list' => __DIR__ . '/users/list.php',
    '/users/update' => __DIR__ . '/users/update.php',
];

if ($path === '/health') {
    http_response_code(200);
    echo json_encode([
        'ok' => true,
        'service' => 'linenory-api',
        'env' => 'local',
        'phase' => 2,
        'time' => date('c'),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($path === '/index') {
    http_response_code(200);
    echo json_encode([
        'ok' => true,
        'service' => 'لاین نوری استار — API',
        'phase' => 2,
        'note' => 'اسکافولد فقط؛ همه endpointها استاب ۵۰۱ هستند.',
        'endpoints' => array_values(array_filter(array_keys($routes), fn($r) => $r !== '/index')),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!array_key_exists($path, $routes) || $routes[$path] === null) {
    http_response_code(404);
    echo json_encode([
        'ok' => false,
        'error' => 'مسیر یافت نشد.',
        'path' => $path,
        'method' => $method,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require $routes[$path];
