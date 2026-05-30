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
    scheduleRender();
  });
  dbModule.subscribeGroups((data) => {
    appState.groups = data;
    scheduleRender();
  });
  dbModule.subscribeSessions((data) => {
    appState.sessions = data;
    scheduleRender();
  });
  dbModule.subscribeSettings((data) => {
    const user = appState.user;
    const fallbackName = user
      ? user.displayName || user.email?.split("@")[0] || "المعلم"
      : "المعلم";
    appState.settings = {
      teacherName: data.teacherName || fallbackName,
      defaultLimit: data.defaultLimit || 12,
      accountingPhone: data.accountingPhone || "",
    };
    scheduleRender();
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

// Intersection Observer for Scroll Animations
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

// Override scheduleRender to re-attach observers
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

