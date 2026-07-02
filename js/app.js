const appState = {
  route: "login",
  activeTab: "form",
  user: null,
  students: [],
  groups: [],
  sessions: [],
  settings: {
    teacherName: "",
    defaultLimit: 12,
    accountingPhone: "",
  },
  ui: {
    loginMode: "login",
    loginError: "",
    sessionScope: "individual",
    searchQuery: "",
    searchGender: "all",
    selectedStudentId: "",
    selectedGroupId: "",
    historyStudentId: null,
    analysisStudentId: "all",
    analysisRange: "all",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    rewardAmount: "",
    showCertificate: false,
    report: null,
    editSessionId: null,
    studentForm: null,
    groupForm: null,
    sessionForm: null,
  },
};

window.appState = appState;

let renderScheduled = false;
function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    router.render();
  });
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

window.debounce = function (fn, delay = 250) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
};

window.showToast = function (msg) {
  const toastRoot = document.getElementById("app-toast");
  if (!toastRoot) return;
  toastRoot.innerHTML = `<div class="toast-pill">${msg}</div>`;
  setTimeout(() => {
    toastRoot.innerHTML = "";
  }, 3200);
};

window.formatArDate = function (iso) {
  try {
    return new Date(iso).toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

window.formatMonthLabel = function (year, month) {
  try {
    return new Date(year, month - 1, 1).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
    });
  } catch {
    return `${year}/${month}`;
  }
};

window.formatTime12h = function (time24) {
  if (!time24 || typeof time24 !== "string") return "";
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24;
  const suffix = h >= 12 ? "م" : "ص";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

window.getStudentById = function (id) {
  return appState.students.find((s) => s.id === id);
};

window.getGroupById = function (id) {
  return appState.groups.find((g) => g.id === id);
};

window.getGroupMembers = function (groupId) {
  const group = getGroupById(groupId);
  if (!group || !Array.isArray(group.studentIds)) return [];
  return appState.students.filter((s) => group.studentIds.includes(s.id));
};

window.getStudentSessions = function (studentId) {
  return appState.sessions
    .map((session) => {
      if (session.mode === "group") {
        const participant = session.participants?.find(
          (p) => p.studentId === studentId && p.present !== false
        );
        if (!participant) return null;
        return { ...session, participant };
      }
      if (session.studentId === studentId) return session;
      return null;
    })
    .filter(Boolean);
};

window.countStudentSessions = function (studentId) {
  return getStudentSessions(studentId).length;
};

window.getNextPackageNum = function (studentId, limit) {
  const count = countStudentSessions(studentId);
  return (count % limit) + 1;
};

window.handleLogout = async function () {
  try {
    await authModule.logout();
    showToast("تم تسجيل الخروج");
  } catch (err) {
    showToast(err);
  }
};

function attachSubscriptions() {
  dbModule.subscribeStudents((data) => {
    appState.students = data;
    if (typeof syncTasksWithWorker === 'function') syncTasksWithWorker(); 
    scheduleRender();
  });
  dbModule.subscribeGroups((data) => {
    appState.groups = data;
    if (typeof syncTasksWithWorker === 'function') syncTasksWithWorker(); 
    scheduleRender();
  });
  dbModule.subscribeSessions((data) => {
    appState.sessions = data;
    if (typeof syncTasksWithWorker === 'function') syncTasksWithWorker(); 
    scheduleRender();
  });
  dbModule.subscribeSettings((data) => {
    const user = appState.user;
    const fallbackName = user
      ? user.displayName || user.email?.split("@")[0] || "المعلم"
      : "المعلم";
      
    appState.settings = {
      ...appState.settings, 
      ...data,
      teacherName: data.teacherName || fallbackName,
      defaultLimit: data.defaultLimit || 12,
      accountingPhone: data.accountingPhone || "",
    };
    
    scheduleRender();
    if (typeof applyTheme === 'function') applyTheme(); 
  });
}

document.addEventListener("DOMContentLoaded", () => {
  authModule.onAuthStateChanged((user) => {
    if (user) {
      appState.user = user;
      dbModule.setTeacherId(user.uid);
      attachSubscriptions();
      router.setRoute("dashboard");
      return;
    }

    appState.user = null;
    dbModule.clearSubscriptions();
    appState.students = [];
    appState.groups = [];
    appState.sessions = [];
    router.setRoute("login");
  });
});

/* =========================================
   DASHBOARD UI ENGINE (Lightweight)
   ========================================= */

const scrollObserver = prefersReducedMotion.matches
  ? null
  : new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = "running";
          entry.target.classList.add("is-visible");
          scrollObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

const originalScheduleRender = scheduleRender;
window.scheduleRender = function() {
  originalScheduleRender();
  setTimeout(() => {
    const revealTargets = document.querySelectorAll(".card-soft, .stat-card, .reveal, .dash-section");
    revealTargets.forEach((el, index) => {
      if (!el.classList.contains("reveal")) {
        el.classList.add("reveal");
      }
      el.style.animationDelay = `${(index % 12) * 0.06}s`;
      if (scrollObserver) {
        el.style.animationPlayState = "paused";
        scrollObserver.observe(el);
      } else {
        el.style.animationPlayState = "running";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }
    });
  }, 50);
};

// ==========================================
// 🤖 نظام ربط السكرتير الذكي والإشعارات المتقدمة
// ==========================================

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('✅ Notification permission granted.');
        showToast("تم تفعيل إشعارات السكرتير الذكي 🔔");
      }
    });
  }
}

if ('serviceWorker' in navigator && 'Notification' in window) {
  // طلب الإذن بالإشعارات
  requestNotificationPermission();

  // 🔊 استقبال أمر تشغيل الصوت من الـ Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
      const notificationSound = new Audio('./p2.ogg');
      notificationSound.play().catch(e => console.log("Audio play blocked by browser:", e));
    }
  });
}

// دالة مزامنة المهام مع السكرتير في الخلفية
function syncTasksWithWorker() {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;

  function normalizeArabic(text) {
    if (!text) return "";
    return text.trim().replace(/[أإآ]/g, "ا").replace(/ة$/g, "ه");
  }

  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    if (timeStr.includes(':') && !timeStr.includes('AM') && !timeStr.includes('PM') && !timeStr.includes('م') && !timeStr.includes('ص')) {
       let [h, m] = timeStr.split(':').map(Number);
       return h * 60 + m;
    }
    let [time, period] = timeStr.split(" ");
    if(!time || !period) return 0;
    let [h, m] = time.split(":").map(Number);
    if ((period === "PM" || period === "م") && h !== 12) h += 12;
    if ((period === "AM" || period === "ص") && h === 12) h = 0;
    return h * 60 + m;
  }

  const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const todayIndex = new Date().getDay();
  const todayName = DAYS_AR[todayIndex];
  
  let todayTasks = [];
  const students = appState.students || [];
  const groups = appState.groups || [];
  const sessions = appState.sessions || [];
  const todayString = new Date().toISOString().split("T")[0];

  const isSessionRecorded = (id, mode) => {
     return sessions.some(s => {
        if (!s.date || !s.date.startsWith(todayString)) return false;
        if (mode === "individual") return s.studentId === id;
        if (mode === "group") return s.groupId === id;
        return false;
     });
  };

  students.forEach(student => {
    let schedules = [];
    const qEnabled = student.quranEnabled !== undefined ? student.quranEnabled : ((student.quranLimit || student.sessionLimit) > 0);
    const iEnabled = student.islamicEnabled !== undefined ? student.islamicEnabled : ((student.islamicLimit || 0) > 0);

    if (qEnabled && Array.isArray(student.quranSchedule)) {
      schedules.push(...student.quranSchedule.map(s => ({...s, type: 'قرآن', sessionType: 'quran'})));
    } else if (qEnabled && Array.isArray(student.schedule)) {
      schedules.push(...student.schedule.map(s => ({...s, type: 'قرآن', sessionType: 'quran'})));
    }
    if (iEnabled && Array.isArray(student.islamicSchedule)) {
      schedules.push(...student.islamicSchedule.map(s => ({...s, type: 'تربية', sessionType: 'islamic'})));
    }

    schedules.forEach(sched => {
      if (normalizeArabic(sched.day) === normalizeArabic(todayName)) {
        if (isSessionRecorded(student.id, "individual")) return;
        todayTasks.push({
          mode: "individual",
          id: student.id,
          name: student.name,
          time: sched.time,
          type: sched.type,
          minutes: timeToMinutes(sched.time)
        });
      }
    });
  });

  groups.forEach(group => {
     if (group.schedule && Array.isArray(group.schedule)) {
        group.schedule.forEach(sched => {
           if (normalizeArabic(sched.day) === normalizeArabic(todayName)) {
              if (isSessionRecorded(group.id, "group")) return;
              todayTasks.push({
                 mode: "group",
                 id: group.id,
                 name: `مجموعة: ${group.name}`,
                 time: sched.time,
                 type: sched.type || 'قرآن',
                 minutes: timeToMinutes(sched.time)
              });
           }
        });
     }
  });

  navigator.serviceWorker.controller.postMessage({
    type: 'SYNC_TASKS',
    tasks: todayTasks
  });
}

// مزامنة المهام كل 5 دقائق
setInterval(syncTasksWithWorker, 5 * 60 * 1000);

// وكمان بنعمل مزامنة أول ما السكرتير يكون جاهز
if (navigator.serviceWorker) {
  navigator.serviceWorker.ready.then(() => {
    setTimeout(syncTasksWithWorker, 2000);
  });
}
