// ==========================================
// كود لوحة التحكم (الرئيسية)
// ==========================================
(function () {
  window.setActiveTab = function (tab) {
    appState.activeTab = tab;
    window.closeSidebar?.();
    router.render();
  };

  function renderActiveTab() {
    switch (appState.activeTab) {
      case "history": return renderHistoryPage();
      case "analysis": return renderAnalysisPage();
      case "monthly": return renderMonthlySheetPage();
      case "schedule": return renderSchedulePage();
      case "settings": return renderSettingsPage();
      case "account": return renderAccountPage();
      default: return renderSessionForm();
    }
  }

  window.renderDashboardPage = function () {
    document.body.classList.add('dashboard-active');

    const teacherName = appState.settings?.teacherName || "المعلم";
    const todayLabel = typeof formatArDate === "function" ? formatArDate(new Date().toISOString()) : new Date().toLocaleDateString('ar-EG');
    
    // الشرط ده بيعرف المنصة إحنا في الشاشة الرئيسية ولا لأ
    const isHomePage = !appState.activeTab || appState.activeTab === "form" || appState.activeTab === "dashboard";

    const heroHtml = `
      <div class="premium-hero" style="position: relative; padding: 20px; overflow: hidden; border-radius: 16px; margin-bottom: 24px;">
        <div class="premium-hero__particles">
          <div class="particle p1"></div><div class="particle p2"></div><div class="particle p3"></div><div class="particle p4"></div><div class="particle p5"></div>
        </div>
        <div class="premium-hero__bg"></div>
        <div class="premium-hero__glass"></div>
        
        <div class="premium-hero__content" style="display: flex; flex-direction: column; position: relative; z-index: 2;">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
            
            <div class="premium-hero__date-pill" style="margin: 0; align-self: flex-start;">
              <i class="ph-duotone ph-calendar-check"></i><span>${todayLabel}</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
              
              <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 6px 12px; display: flex; align-items: center; gap: 8px; color: white;">
                 <i class="ph-duotone ph-users-three" style="color: #34d399; font-size: 16px;"></i>
                 <span style="font-size: 12px; opacity: 0.9;">الطلاب:</span>
                 <span style="font-weight: bold; font-size: 14px;" dir="ltr">${appState.students ? appState.students.length : 0}</span>
              </div>
              
              <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 6px 12px; display: flex; align-items: center; gap: 8px; color: white;">
                 <i class="ph-duotone ph-books" style="color: #fbbf24; font-size: 16px;"></i>
                 <span style="font-size: 12px; opacity: 0.9;">الجلسات:</span>
                 <span style="font-weight: bold; font-size: 14px;" dir="ltr">${appState.sessions ? appState.sessions.length : 0}</span>
              </div>

            </div>
          </div>
          
          <div class="premium-hero__main" style="width: 100%;">
            <h1 class="premium-hero__title" style="margin-top: 0;">السَّلَامُ عَلَيْكُمْ، <span>${teacherName}</span></h1>
            <p class="premium-hero__subtitle">مرحباً بك في مساحتك الخاصة. تابع إنجازات طلابك وتتبع تقدمهم في حفظ كتاب الله بكل يسر وسهولة.</p>

            <div class="premium-hero__actions" style="margin-top: 16px;">
              <button type="button" class="btn btn-primary btn-lg" onclick="setActiveTab('form')">
                <i class="ph-duotone ph-plus-circle"></i>تسجيل جلسة جديدة
              </button>
              <button type="button" class="btn btn-glass btn-lg" onclick="setActiveTab('analysis')">
                <i class="ph-duotone ph-chart-pie-slice"></i>التحليلات الذكية
              </button>
            </div>
          </div>

          <div class="premium-hero__side" style="position: absolute; left: 0; bottom: 0; opacity: 0.2; pointer-events: none;">
            <div class="premium-hero__quran-icon" style="margin: 0; transform: scale(0.8) translate(-20px, 20px);">
              <i class="ph-duotone ph-book-open-text"></i><div class="quran-glow"></div>
            </div>
          </div>
          
        </div>
      </div>
    `;

    return `
      <section class="dash-shell">
        ${isHomePage ? heroHtml : ''}
        
        <div class="dash-content">
          ${renderActiveTab()}
        </div>
      </section>
    `;
  };

  window.initDashboardPage = function () {
    switch (appState.activeTab) {
      case "history": if (typeof initHistoryPage === "function") initHistoryPage(); break;
      case "analysis": if (typeof initAnalysisPage === "function") initAnalysisPage(); break;
      case "monthly": if (typeof initMonthlySheetPage === "function") initMonthlySheetPage(); break;
      case "schedule": if (typeof initSchedulePage === "function") initSchedulePage(); break;
      case "settings": if (typeof initSettingsPage === "function") initSettingsPage(); break;
      case "account": if (typeof initAccountPage === "function") initAccountPage(); break;
      default: if (typeof initSessionForm === "function") initSessionForm(); break;
    }
  };
})();
