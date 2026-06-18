const CACHE_NAME = 'rafiq-quran-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/rafiq-tokens.css',
  './css/rafiq-components.css',
  './css/rafiq-pages.css',
  './js/app.js',
  './js/router.js',
  './logo.jpeg'
];

// 1. مرحلة التثبيت (Caching الأساسيات)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. مرحلة التفعيل (تنظيف الكاش القديم لو حدثنا المنصة)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. مرحلة جلب البيانات (Fetch) - الأولوية للنت عشان الداتا تتحدث باستمرار
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
