(function () {
  window.setActiveTab = function (tab) {
    appState.activeTab = tab;
    window.closeSidebar?.();
    router.render();
  };



  function renderActiveTab() {
    switch (appState.activeTab) {
      case "history":
        return renderHistoryPage();
      case "analysis":
        return renderAnalysisPage();
      case "monthly":
        return renderMonthlySheetPage();
      case "settings":
        return renderSettingsPage();
      case "account":
        return renderAccountPage();
      default:
        return renderSessionForm();
    }
  }

  window.renderDashboardPage = function () {
    document.body.classList.add('dashboard-active');

    const teacherName = appState.settings.teacherName || "المعلم";
    const todayLabel = formatArDate(new Date().toISOString());
    const hour = new Date().getHours();
    const greetTime = hour < 12 ? "صباح الخير" : hour < 17 ? "مساء النور" : "مساء الخير";

    return `
      <section class="dash-shell">
        <!-- Premium Hero Section -->
        <div class="premium-hero">
          <div class="premium-hero__particles">
            <div class="particle p1"></div>
            <div class="particle p2"></div>
            <div class="particle p3"></div>
            <div class="particle p4"></div>
            <div class="particle p5"></div>
          </div>
          <div class="premium-hero__bg"></div>
          <div class="premium-hero__glass"></div>
          
          <div class="premium-hero__content">
            <div class="premium-hero__main">
              <div class="premium-hero__date-pill">
                <i class="ph-duotone ph-calendar-check"></i>
                <span>${todayLabel}</span>
              </div>
              
              <h1 class="premium-hero__title">
                السَّلَامُ عَلَيْكُمْ، <span>${teacherName}</span>
              </h1>
              <p class="premium-hero__subtitle">
                مرحباً بك في مساحتك الخاصة. تابع إنجازات طلابك وتتبع تقدمهم في حفظ كتاب الله بكل يسر وسهولة، مع تحليلات ذكية لرفع مستوى الأداء.
              </p>

              <div class="premium-hero__actions">
                <button class="btn btn-primary btn-lg" onclick="setActiveTab('form')">
                  <i class="ph-duotone ph-plus-circle"></i>
                  تسجيل جلسة جديدة
                </button>
                <button class="btn btn-glass btn-lg" onclick="setActiveTab('analysis')">
                  <i class="ph-duotone ph-chart-pie-slice"></i>
                  التحليلات الذكية
                </button>
              </div>
            </div>

            <div class="premium-hero__side">
              <div class="premium-hero__quran-icon">
                <i class="ph-duotone ph-book-open-text"></i>
                <div class="quran-glow"></div>
              </div>

              <div class="premium-hero__stats-stack">
                <div class="premium-stat-card">
                  <div class="stat-icon emerald"><i class="ph-duotone ph-users-three"></i></div>
                  <div class="stat-info">
                    <div class="stat-lbl">إجمالي الطلاب</div>
                    <div class="stat-val" dir="ltr">${appState.students.length}</div>
                  </div>
                </div>
                <div class="premium-stat-card float-delayed">
                  <div class="stat-icon gold"><i class="ph-duotone ph-books"></i></div>
                  <div class="stat-info">
                    <div class="stat-lbl">جلسات مُنجزة</div>
                    <div class="stat-val" dir="ltr">${appState.sessions.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        <!-- Content -->
        <div class="dash-content">
          ${renderActiveTab()}
        </div>
      </section>
    `;
  };

  window.initDashboardPage = function () {
    switch (appState.activeTab) {
      case "history":
        initHistoryPage();
        break;
      case "analysis":
        initAnalysisPage();
        break;
      case "monthly":
        initMonthlySheetPage();
        break;
      case "settings":
        initSettingsPage();
        break;
      case "account":
        initAccountPage();
        break;
      default:
        initSessionForm();
    }
  };
})();
