window.showSmartSecretaryPopup = function() {
  const alerts = getSmartAlerts();
  if (alerts.length === 0) return;

  const existingPopup = document.getElementById('smart-secretary-popup');
  if (existingPopup) existingPopup.remove();

  const alertsHtml = alerts.map(alert => {
    let colors = '';
    if (alert.type === 'success') colors = 'background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2);';
    if (alert.type === 'warning') colors = 'background: rgba(245, 158, 11, 0.1); color: #D97706; border: 1px solid rgba(245, 158, 11, 0.2);';
    if (alert.type === 'danger') colors = 'background: rgba(239, 68, 68, 0.1); color: #DC2626; border: 1px solid rgba(239, 68, 68, 0.2);';

    return `
      <div style="display: flex; gap: 12px; padding: 10px; border-radius: 8px; margin-bottom: 8px; ${colors} align-items: flex-start;">
        <i class="ph-duotone ${alert.icon}" style="font-size: 20px;"></i>
        <div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold;">${alert.title}</h4>
          <p style="margin: 0; font-size: 12px; opacity: 0.9;">${alert.message}</p>
        </div>
      </div>
    `;
  }).join('');

  const popup = document.createElement('div');
  popup.id = 'smart-secretary-popup';
  popup.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99999;
    width: 90%;
    max-width: 350px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
    overflow: hidden;
    font-family: inherit;
    animation: slideDownFade 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  if (!document.getElementById('smart-secretary-styles')) {
    const style = document.createElement('style');
    style.id = 'smart-secretary-styles';
    style.innerHTML = `@keyframes slideDownFade { from { top: -50px; opacity: 0; } to { top: 20px; opacity: 1; } }`;
    document.head.appendChild(style);
  }

  popup.innerHTML = `
    <div style="background: #ffffff; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 8px; color: #0f9d7a;">
        <i class="ph-duotone ph-robot" style="font-size: 20px;"></i>
        <span style="font-weight: bold; font-size: 14px; color: #1e293b;">السكرتير الذكي</span>
      </div>
      <button onclick="this.closest('#smart-secretary-popup').remove()" style="background: none; border: none; color: #94a3b8; font-size: 22px; cursor: pointer; padding: 0;">&times;</button>
    </div>
    <div style="padding: 16px; max-height: 60vh; overflow-y: auto; background: #ffffff;">
      ${alertsHtml}
    </div>
  `;

  document.body.appendChild(popup);
};


// ==========================================
// 2. كود لوحة التحكم (الرئيسية) - تم إعادتها لتصميمك الأصلي مع الجدول الأسبوعي
// ==========================================
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
      case "schedule": // تمت الإضافة: الجدول الأسبوعي
        return renderSchedulePage();
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

    const teacherName = appState.settings?.teacherName || "المعلم";
    const todayLabel = typeof formatArDate === "function" ? formatArDate(new Date().toISOString()) : new Date().toLocaleDateString('ar-EG');
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
                    <div class="stat-val" dir="ltr">${appState.students ? appState.students.length : 0}</div>
                  </div>
                </div>
                <div class="premium-stat-card float-delayed">
                  <div class="stat-icon gold"><i class="ph-duotone ph-books"></i></div>
                  <div class="stat-info">
                    <div class="stat-lbl">جلسات مُنجزة</div>
                    <div class="stat-val" dir="ltr">${appState.sessions ? appState.sessions.length : 0}</div>
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
        if (typeof initHistoryPage === "function") initHistoryPage();
        break;
      case "analysis":
        if (typeof initAnalysisPage === "function") initAnalysisPage();
        break;
      case "monthly":
        if (typeof initMonthlySheetPage === "function") initMonthlySheetPage();
        break;
      case "schedule": // تمت الإضافة: تهيئة الجدول الأسبوعي
        if (typeof initSchedulePage === "function") initSchedulePage();
        break;
      case "settings":
        if (typeof initSettingsPage === "function") initSettingsPage();
        break;
      case "account":
        if (typeof initAccountPage === "function") initAccountPage();
        break;
      default:
        setTimeout(() => {
          if (typeof showSmartSecretaryPopup === "function") {
            showSmartSecretaryPopup();
          }
        }, 500);
        
        if (typeof initSessionForm === "function") initSessionForm();
        break;
    }
  };
})();
