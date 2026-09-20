<?php
/* ═══ نقشه سایت داینامیک (محصولات از دیتابیس + برگه‌های ثابت) ═══
   fallback استاتیک: sitemap.xml (اگر بک‌اند در دسترس نبود) */
declare(strict_types=1);

header('Content-Type: application/xml; charset=utf-8');

$base = 'https://hesam-oxe.github.io/line';
$today = date('Y-m-d');

$static = [
    ['loc' => $base . '/', 'lastmod' => $today, 'changefreq' => 'weekly', 'priority' => '1.0'],
    ['loc' => $base . '/products.html', 'lastmod' => $today, 'changefreq' => 'daily', 'priority' => '0.9'],
];

$products = [];
try {
    require_once __DIR__ . '/lib/db.php';
    $pdo = lns_pdo();
    $st = $pdo->query('SELECT slug, created_at FROM products ORDER BY created_at DESC LIMIT 200');
    foreach ($st->fetchAll() as $r) {
        $products[] = [
            'loc' => $base . '/products.html#' . rawurlencode((string) $r['slug']),
            'lastmod' => date('Y-m-d', (int) ($r['created_at'] / 1000)),
            'changefreq' => 'weekly',
            'priority' => '0.7',
        ];
    }
} catch (Throwable) {
    // سکوت: فقط برگه‌های ثابت
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach (array_merge($static, $products) as $u) {
    echo '  <url><loc>' . htmlspecialchars($u['loc'], ENT_XML1) . '</loc>'
        . '<lastmod>' . $u['lastmod'] . '</lastmod>'
        . '<changefreq>' . $u['changefreq'] . '</changefreq>'
        . '<priority>' . $u['priority'] . '</priority></url>' . "\n";
}
echo '</urlset>';
