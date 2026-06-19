const CACHE_NAME = 'rafiq-quran-v3'; // كود الإصدار - نغيره (v4, v5...) كل ما نرفع تحديث كبير

// الملفات الأساسية اللي المنصة محتاجاها لتشتغل بدون إنترنت (App Shell)
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.jpeg',
  './css/rafiq-tokens.css',
  './css/rafiq-components.css',
  './css/rafiq-pages.css',
  './js/firebase-config.js',
  './js/auth.js',
  './js/db.js',
  './js/router.js',
  './js/app.js',
  './js/pages/login.js',
  './js/pages/dashboard.js',
  './js/pages/settings.js',
  './js/pages/account.js',
  './js/pages/session-form.js',
  './js/pages/history.js',
  './js/pages/analysis.js',
  './js/pages/monthly-sheet.js',
  './js/pages/schedule.js',
  './js/utils/toast-manager.js',
  './js/utils/export-utils.js'
];

// 1. مرحلة التثبيت: كاش للملفات الأساسية واجبار السيرفس وركر الجديد يتفعل فوراً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching App Shell...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting()) // إنهاء وضع الانتظار فوراً
  );
});

// 2. مرحلة التفعيل: تنظيف الكاش القديم تماماً عشان ميعملش تضارب
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // السيطرة على كل الصفحات المفتوحة فوراً
  );
});

// 3. استراتيجية جلب البيانات: Network First للـ CSS والـ JS لضمان ظهور التعديلات فوراً
self.addEventListener('fetch', (event) => {
  // تخطي طلبات Firebase و Chart.js عشان متعملش مشاكل مع الكاش المحلي
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebasecss') || event.request.url.includes('unpkg.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // لو الطلب ناجح، نحدث النسخة اللي في الكاش ونرجع الاستجابة
        if (response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // لو مفيش إنترنت، يفتح الملف مباشرة من الكاش
        return caches.match(event.request);
      })
  );
});
