const CACHE_NAME = 'rafiq-quran-v4'; // تحديث رقم الكاش عشان يحمل السكرتير الجديد

// الملفات الأساسية
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

// 1. مرحلة التثبيت
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching App Shell...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. مرحلة التفعيل
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

// 3. استراتيجية جلب البيانات (Network First)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebasecss') || event.request.url.includes('unpkg.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// ==========================================
// 🤖 العقل المدبر: نظام الإشعارات في الخلفية
// ==========================================

let todayTasks = [];
let notifiedTasks = new Set(); // عشان منبعتش نفس الإشعار مرتين

// الاستماع للرسائل اللي جاية من التطبيق (الجدول اليومي)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_TASKS') {
    todayTasks = event.data.tasks;
    console.log('[السكرتير الذكي] تم استلام جدول مهام اليوم:', todayTasks);
    checkTasks(); // فحص فوري أول ما يستلم الجدول
  }
});

// دالة فحص المهام مقارنة بالوقت الحالي
function checkTasks() {
  if (!todayTasks || todayTasks.length === 0) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  todayTasks.forEach(task => {
    // لو تم إرسال إشعار للمهمة دي قبل كده، نتخطاها
    const taskKey = `${task.id}-${task.time}`;
    if (notifiedTasks.has(taskKey)) return;

    const taskMinutes = task.minutes;
    const timeDiff = taskMinutes - currentMinutes;

    let notificationTitle = '';
    let notificationBody = '';

    // 1. تنبيه: باقي 10 دقائق على الحصة ⏳
    if (timeDiff <= 10 && timeDiff > 0) {
      notificationTitle = '⏳ حصة قريبة جداً!';
      notificationBody = `حصة ${task.type} (${task.name}) هتبدأ خلال ${timeDiff} دقائق.`;
    } 
    // 2. تنبيه: الحصة بدأت فعلاً أو عدى عليها شوية ⚠️
    else if (timeDiff <= 0 && timeDiff > -15) {
      notificationTitle = '🔔 الحصة بدأت!';
      notificationBody = `المفروض تكون حصة ${task.name} شغالة دلوقتي.`;
    }
    // 3. تنبيه: تأكيد التسجيل (عدى عليها وقت وممكن يكون نسي يسجلها) ❓
    else if (timeDiff <= -30 && timeDiff > -60) {
      notificationTitle = '❓ هل نسيت تسجيل الحصة؟';
      notificationBody = `حصة ${task.name} انتهت. افتح السكرتير الذكي لتسجيل الحضور أو الغياب.`;
    }

    // إرسال الإشعار
    if (notificationTitle) {
      self.registration.showNotification(notificationTitle, {
        body: notificationBody,
        icon: './logo.jpeg',
        badge: './logo.jpeg',
        vibrate: [200, 100, 200],
        data: { url: '/?page=secretary' } // لما يضغط على الإشعار يفتح صفحة السكرتير
      });

      // حفظ إننا بعتنا إشعار للحصة دي عشان منكرروش
      notifiedTasks.add(taskKey);
    }
  });
}

// لما المستخدم يضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // توجيه المستخدم لصفحة السكرتير
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // لو المنصة مفتوحة في تاب، روح للتاب دي وركز عليها
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // لو المنصة مش مفتوحة خالص، افتح تاب جديدة
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});

// تشغيل الفحص كل دقيقة في الخلفية باستخدام Periodic Sync (متوفر في بعض المتصفحات الحديثة)
// بما إن الـ Interval مش دايماً يعتمد عليه في السيرفس وركر، هنعتمد على إرسال رسالة من الـ app.js كل شوية
