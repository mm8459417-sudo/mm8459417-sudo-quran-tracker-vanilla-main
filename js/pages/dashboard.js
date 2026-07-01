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
      case "secretary": return typeof renderSecretaryPage === 'function' ? renderSecretaryPage() : '<div style="padding:40px; text-align:center;">جاري تحميل السكرتير الذكي...</div>';
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
      <style>
        /* إخفاء إحصائيات الموبايل افتراضياً */
        .mobile-stats { display: none; }
        
        /* تظبيط شكل الموبايل فقط (شاشات صغيرة) */
        @media (max-width: 768px) {
          .mobile-stats { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; margin-bottom: 12px; }
          .desktop-stats { display: none !important; } /* إخفاء الإحصائيات الكبيرة */
          
          .premium-hero { padding: 20px 16px !important; }
          .premium-hero__title { font-size: 22px !important; margin-top: 5px !important; }
          .premium-hero__subtitle { font-size: 13px !important; margin-bottom: 16px !important; }
          .premium-hero__actions { display: flex; flex-direction: column; gap: 8px; }
          .premium-hero__actions button { width: 100%; justify-content: center; }
          
          .mobile-hero-top { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; }
        }

        /* تظبيط شكل الديسكتوب فقط (شاشات كبيرة) */
        @media (min-width: 769px) {
          .mobile-hero-top { display: block; margin-bottom: 0; }
        }
      </style>

      <div class="premium-hero">
        <div class="premium-hero__particles">
          <div class="particle p1"></div><div class="particle p2"></div><div class="particle p3"></div><div class="particle p4"></div><div class="particle p5"></div>
        </div>
        <div class="premium-hero__bg"></div>
        <div class="premium-hero__glass"></div>
        
        <div class="premium-hero__content">
          <div class="premium-hero__main">
            
            <div class="mobile-hero-top">
              <div class="premium-hero__date-pill">
                <i class="ph-duotone ph-calendar-check"></i><span>${todayLabel}</span>
              </div>
              
              <div class="mobile-stats">
                <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; gap: 6px; color: white;">
                   <i class="ph-duotone ph-users-three" style="color: #34d399; font-size: 15px;"></i>
                   <span style="font-size: 11px; opacity: 0.9;">الطلاب:</span>
                   <span style="font-weight: bold; font-size: 13px;" dir="ltr">${appState.students ? appState.students.length : 0}</span>
                </div>
                <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 4px 10px; display: flex; align-items: center; gap: 6px; color: white;">
                   <i class="ph-duotone ph-books" style="color: #fbbf24; font-size: 15px;"></i>
                   <span style="font-size: 11px; opacity: 0.9;">الجلسات:</span>
                   <span style="font-weight: bold; font-size: 13px;" dir="ltr">${appState.sessions ? appState.sessions.length : 0}</span>
                </div>
              </div>
            </div>
            
            <h1 class="premium-hero__title">السَّلَامُ عَلَيْكُمْ، <span>${teacherName}</span></h1>
            <p class="premium-hero__subtitle">مرحباً بك في مساحتك الخاصة. تابع إنجازات طلابك وتتبع تقدمهم في حفظ كتاب الله بكل يسر وسهولة.</p>

            <div class="premium-hero__actions">
              <button type="button" class="btn btn-primary btn-lg" onclick="setActiveTab('form')">
                <i class="ph-duotone ph-plus-circle"></i>تسجيل جلسة جديدة
              </button>
              <button type="button" class="btn btn-glass btn-lg" onclick="setActiveTab('secretary')">
                <i class="ph-duotone ph-robot"></i>السكرتير الذكي
              </button>
            </div>
          </div>

          <div class="premium-hero__side desktop-stats">
            <div class="premium-hero__quran-icon">
              <i class="ph-duotone ph-book-open-text"></i><div class="quran-glow"></div>
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
      case "secretary": if (typeof initSecretaryPage === "function") initSecretaryPage(); break;
      default: if (typeof initSessionForm === "function") initSessionForm(); break;
    }
  };
})();
