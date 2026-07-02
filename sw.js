const CACHE_NAME = 'rafiq-quran-v6'; // حدثنا الكاش عشان يقرا الملفات الجديدة

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.jpeg.png', // اللوجو الأساسي
  './image_p1.png',  // اللوجو الأبيض
  './p2.ogg',        // صوت الإشعار
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching App Shell...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebasecss') || event.request.url.includes('unpkg.com')) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ==========================================
// 🤖 العقل المدبر: نظام الإشعارات
// ==========================================
let todayTasks = [];
let notifiedTasks = new Set(); 

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_TASKS') {
    todayTasks = event.data.tasks;
    checkTasks();
  }
});

function checkTasks() {
  if (!todayTasks || todayTasks.length === 0) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  todayTasks.forEach(task => {
    const taskKey = `${task.id}-${task.time}`;
    if (notifiedTasks.has(taskKey)) return;

    const timeDiff = task.minutes - currentMinutes;

    let notificationTitle = '';
    let notificationBody = '';
    let actionTitle = 'افتح السكرتير';

    if (timeDiff <= 10 && timeDiff > 0) {
      notificationTitle = '⏳ حصة قريبة جداً!';
      notificationBody = `حصة ${task.type} (${task.name}) هتبدأ خلال ${timeDiff} دقائق.`;
    } else if (timeDiff <= 0 && timeDiff > -15) {
      notificationTitle = '🔔 الحصة بدأت!';
      notificationBody = `حصة ${task.name} المفروض تكون شغالة دلوقتي.`;
      actionTitle = 'سجل الحضور';
    } else if (timeDiff <= -30 && timeDiff > -60) {
      notificationTitle = '❓ هل نسيت التسجيل؟';
      notificationBody = `حصة ${task.name} انتهت. افتح لتسجيل الحضور أو الغياب.`;
      actionTitle = 'سجل الآن';
    }

    if (notificationTitle) {
      // أمر بتشغيل الصوت لو المنصة مفتوحة
      self.clients.matchAll().then(clients => {
         clients.forEach(client => {
             client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND' });
         });
      });

      // إرسال الإشعار للموبايل/الجهاز
      self.registration.showNotification(notificationTitle, {
        body: notificationBody,
        icon: './logo.jpeg.png', // اللوجو الأساسي الملون
        badge: './image_p1.png', // اللوجو الأبيض المفرغ
        dir: 'rtl',
        lang: 'ar',
        vibrate: [300, 100, 300], 
        data: { url: '/?page=secretary' },
        actions: [
          { action: 'open_secretary', title: actionTitle }
        ]
      });

      notifiedTasks.add(taskKey);
    }
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});
