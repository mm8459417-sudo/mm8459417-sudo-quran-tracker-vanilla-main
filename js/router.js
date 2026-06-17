(function () {
  function renderHeader() {
    const header = document.getElementById("app-header");
    if (!appState.user) {
      header.classList.add("hidden");
      header.innerHTML = "";
      return;
    }
    header.classList.remove("hidden");
    const teacherName = appState.settings.teacherName || "المعلم";
    header.innerHTML = `
      <div class="app-header__inner">
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-ghost icon-btn menu-toggle-btn" aria-label="فتح القائمة" aria-expanded="false" onclick="openSidebar()">
            <i class="ph-bold ph-list" style="font-size: 24px;"></i>
          </button>
          <div class="app-brand">
            <div class="app-brand__logo">
              <img src="logo.jpeg" alt="شعار رفيق القرآن" onerror="this.style.display='none'" />
            </div>
            <div>
              <div class="app-brand__title" style="color: var(--gold); font-family: var(--font-display); font-weight: 800;">رَفِيقُ القُرْآنِ</div>
              <div class="app-brand__subtitle">مسار حفظ هادئ وواضح</div>
            </div>
          </div>
        </div>
        <div class="app-header__meta">
          <div class="app-user">
            <div class="app-user__label">المعلم</div>
            <div class="app-user__name">${teacherName}</div>
          </div>
          
          <button class="theme-toggle-btn" onclick="toggleThemeSwitch()" title="تبديل المظهر">
  <i class="ph-fill ph-sun sun-icon"></i>
  <i class="ph-fill ph-moon moon-icon"></i>
</button>
          
          <button class="btn btn-outline btn-sm" onclick="handleLogout()">
            <i class="ph-bold ph-sign-out" style="font-size: 16px;"></i>
            خروج
          </button>
        </div>
      </div>
    `;
  }

  function renderSidebar() {
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    if (!appState.user) {
      sidebar.classList.add("hidden");
      overlay.classList.add("hidden");
      sidebar.setAttribute("aria-hidden", "true");
      sidebar.innerHTML = "";
      return;
    }

    sidebar.classList.remove("hidden");
    overlay.classList.remove("hidden");

    const teacherName = appState.settings.teacherName || "المعلم";
    const initial = teacherName ? teacherName.charAt(0) : "م";
    
    // تم إضافة الجدول الأسبوعي هنا
    const tabs = [
      { key: "form", icon: `<i class="ph-duotone ph-house"></i>`, label: "الرئيسية" },
      { key: "history", icon: `<i class="ph-duotone ph-clock-counter-clockwise"></i>`, label: "سجلات الطلاب" },
      { key: "analysis", icon: `<i class="ph-duotone ph-chart-line-up"></i>`, label: "تحليل الأداء" },
      { key: "monthly", icon: `<i class="ph-duotone ph-calendar-check"></i>`, label: "الشيت الشهري" },
      { key: "schedule", icon: `<i class="ph-duotone ph-calendar-plus"></i>`, label: "الجدول الأسبوعي" },
      { key: "settings", icon: `<i class="ph-duotone ph-gear-six"></i>`, label: "الإعدادات" },
      { key: "account", icon: `<i class="ph-duotone ph-user-circle"></i>`, label: "الحساب" },
    ];

    sidebar.innerHTML = `
      <div class="app-sidebar__brand">
        <img src="logo.jpeg" alt="رفيق القرآن" onerror="this.style.display='none'" />
        <div>
          <div class="app-sidebar__brand-text" style="color: var(--gold); font-family: var(--font-display); font-weight: 800; font-size: 1.4rem;">رَفِيقُ القُرْآنِ</div>
          <div class="app-sidebar__brand-sub">منصة متابعة الحفظ</div>
        </div>
      </div>
      <div class="app-sidebar__user">
        <div class="app-sidebar__avatar">${initial}</div>
        <div>
          <div class="app-sidebar__user-name">${teacherName}</div>
          <div class="app-sidebar__user-role">معلم</div>
        </div>
      </div>
      <nav class="app-sidebar__nav" aria-label="التنقل الرئيسي">
        ${tabs
          .map(
            (t) => `
          <button class="nav-item ${appState.activeTab === t.key ? "active" : ""}" onclick="setActiveTab('${t.key}')" ${appState.activeTab === t.key ? 'aria-current="page"' : ""}>
            <span class="nav-item__icon" aria-hidden="true">${t.icon}</span>
            <span class="nav-item__label">${t.label}</span>
          </button>
        `
          )
          .join("")}
      </nav>
      <div class="app-sidebar__footer">
        <button class="btn btn-danger w-100" onclick="handleLogout()">
          <i class="ph-bold ph-sign-out" style="font-size: 16px;"></i>
          تسجيل خروج
        </button>
      </div>
    `;
    sidebar.setAttribute("aria-hidden", "false");
  }

  function renderBottomNav() {
    const bottomNav = document.getElementById("app-bottom-nav");
    if (!bottomNav) return;

    if (!appState.user) {
      bottomNav.classList.add("hidden");
      bottomNav.innerHTML = "";
      return;
    }

    // تم إضافة الجدول هنا أيضاً للموبايل
    const items = [
      { key: "form", icon: `<i class="ph-duotone ph-house"></i>`, label: "الرئيسية" },
      { key: "history", icon: `<i class="ph-duotone ph-clock-counter-clockwise"></i>`, label: "السجل" },
      { key: "analysis", icon: `<i class="ph-duotone ph-chart-line-up"></i>`, label: "التحليل" },
      { key: "monthly", icon: `<i class="ph-duotone ph-calendar-check"></i>`, label: "الشيت" },
      { key: "schedule", icon: `<i class="ph-duotone ph-calendar-plus"></i>`, label: "الجدول" },
      { key: "settings", icon: `<i class="ph-duotone ph-gear-six"></i>`, label: "الإعدادات" },
    ];

    bottomNav.classList.remove("hidden");
    bottomNav.innerHTML = items
      .map(
        (item) => `
          <button class="bottom-nav-item ${appState.activeTab === item.key ? "active" : ""}" onclick="setActiveTab('${item.key}')" ${appState.activeTab === item.key ? 'aria-current="page"' : ""}>
            <span class="bottom-nav-item__icon" aria-hidden="true">${item.icon}</span>
            <span class="bottom-nav-item__label">${item.label}</span>
          </button>
        `
      )
      .join("");
  }

  function renderMain() {
    const main = document.getElementById("app-main");
    if (appState.route === "login") {
      document.body.classList.remove('dashboard-active');
      main.innerHTML = renderLoginPage();
      initLoginPage();
      return;
    }

    document.body.classList.add('dashboard-active');
    main.innerHTML = renderDashboardPage();
    initDashboardPage();
  }

  window.router = {
    render() {
      renderHeader();
      renderSidebar();
      renderBottomNav();
      renderMain();
    },
    setRoute(route) {
      appState.route = route;
      this.render();
    },
  };

  window.openSidebar = function () {
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const toggle = document.querySelector(".menu-toggle-btn");
    sidebar.classList.add("show");
    overlay.classList.add("show");
    sidebar.setAttribute("aria-hidden", "false");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  };

  window.closeSidebar = function () {
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const toggle = document.querySelector(".menu-toggle-btn");
    sidebar.classList.remove("show");
    overlay.classList.remove("show");
    sidebar.setAttribute("aria-hidden", "true");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  };

  document.addEventListener("click", (e) => {
    if (e.target.id === "sidebar-overlay") {
      window.closeSidebar();
    }
  });
})();
