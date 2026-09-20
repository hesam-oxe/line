/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — سرویس‌ورکر آفلاین
   استاتیک: کش‌اول. APIهای GET: کش ۵ دقیقه‌ای. POST آفلاین:
   کلاینت در localStorage صف می‌کند (js/api.js) و با online فلاش می‌کند.
   ═══════════════════════════════════════════════════════════ */
'use strict';

const STATIC_CACHE = 'lns-static-v1';
const API_CACHE = 'lns-api-v1';
const API_TTL = 5 * 60 * 1000;

const STATIC_ASSETS = [
  './', 'index.html', 'products.html', 'auth.html', 'offline.html',
  'css/base.css', 'css/sections.css', 'css/enhance.css',
  'css/products.css', 'css/panels.css', 'css/noscript.css',
  'js/theme.js', 'js/config.js', 'js/api.js', 'js/store.js', 'js/ui.js', 'js/main.js',
  'manifest.webmanifest', 'assets/favicon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()).catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== API_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isApiGet(req) {
  try {
    const u = new URL(req.url);
    return req.method === 'GET' && (u.pathname.includes('/api/') || u.pathname.endsWith('/products/list') || u.pathname.endsWith('/quotes/list') || u.pathname.endsWith('/messages/list'));
  } catch (_) {
    return false;
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // POSTها را کلاینت صف می‌کند

  if (isApiGet(req)) {
    /* API GET: network-first با کش ۵ دقیقه‌ای */
    e.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const fresh = await fetch(req);
          if (fresh.ok) {
            const body = await fresh.clone().blob();
            const stamped = new Response(body, {
              status: fresh.status,
              headers: Object.assign({}, Object.fromEntries(fresh.headers.entries()), { 'x-lns-cached': String(Date.now()) })
            });
            cache.put(req, stamped).catch(() => {});
          }
          return fresh;
        } catch (_) {
          const hit = await cache.match(req);
          if (hit) return hit;
          return new Response(JSON.stringify({ ok: false, error: 'آفلاین.' }), {
            status: 503, headers: { 'Content-Type': 'application/json' }
          });
        }
      })
    );
    return;
  }

  // استاتیک: کش‌اول + فالبک آفلاین
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok && new URL(req.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('offline.html');
        return caches.match('index.html');
      });
    })
  );
});
