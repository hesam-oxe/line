<?php
/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — روتر فرانت‌کنترلر API
   آپاچی: via .htaccess همه درخواست‌ها به اینجا می‌آیند.
   سرور داخلی PHP: با حالت روتر اجرا کنید:
     php -S localhost:8001 api/index.php
   فاز ۳: مسیریابی + نرخ‌محدود عمومی + CSRF ناشناس + CORS محلی.
   ═══════════════════════════════════════════════════════════ */
declare(strict_types=1);

require_once __DIR__ . '/lib/response.php';
require_once __DIR__ . '/lib/rate_limit.php';
require_once __DIR__ . '/lib/auth.php';

header('X-Content-Type-Options: nosniff');

// ── CORS فقط برای تست محلی (فرانت :8000 → API :8001) ──
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === 'http://localhost:8000') {
    header('Access-Control-Allow-Origin: http://localhost:8000');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ── نرخ‌محدود عمومی: ۱۰۰ درخواست/دقیقه به‌ازای IP ──
$rl = lns_rl_check('general:' . lns_client_ip(), 100, 60);
if (!$rl['allowed']) {
    lns_err('درخواست‌های بیش از حد.', 429, ['retry_after' => $rl['retry_after']]);
}

// ── صدور کوکی CSRF ناشناس برای فرم‌های ورود/ثبت‌نام ──
if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    lns_issue_anon_csrf();
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?: '/';
$path = '/' . trim($path, '/');
if ($path === '/') {
    $path = '/index';
}

// ── نگاشت مسیر تمیز به فایل ──
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
    lns_ok([
        'service' => 'linenory-api',
        'env' => 'local',
        'phase' => 3,
        'time' => date('c'),
    ]);
}

if ($path === '/index') {
    lns_ok([
        'service' => 'لاین نوری استار — API',
        'phase' => 3,
        'note' => 'بک‌اند پیاده‌سازی‌شده (SQLite محلی / MySQL تولیدی).',
        'endpoints' => array_values(array_filter(array_keys($routes), fn($r) => $r !== '/index')),
    ]);
}

if (!array_key_exists($path, $routes) || $routes[$path] === null) {
    lns_err('مسیر یافت نشد.', 404, ['path' => $path, 'method' => $method]);
}

require $routes[$path];
