// ==========================================
// 1. نظام السكرتير الذكي (الإشعار العائم)
// ==========================================
function getSmartAlerts() {
  const alerts = [];
  const now = Date.now();
  const weekSessions = appState.sessions.filter(s => new Date(s.date).getTime() >= now - 7 * 86400000);
  
  appState.students.forEach(student => {
    const studentSessions = weekSessions.filter(s => s.participant && s.participant.id === student.id);
    if (studentSessions.length > 0) {
      const avg = studentSessions.reduce((sum, s) => sum + (s.participant.overall || 0), 0) / studentSessions.length;
      if (avg >= 4.5) {
        alerts.push({ type: 'success', icon: 'ph-star', title: 'مرشح للتكريم', message: `الطالب ${student.name} أداؤه ممتاز (${avg.toFixed(1)}/5).` });
      } else if (avg <= 3) {
        alerts.push({ type: 'warning', icon: 'ph-warning-circle', title: 'يحتاج متابعة', message: `مستوى ${student.name} تراجع مؤخراً.` });
      }
    }
  });

  if (weekSessions.length === 0 && appState.students.length > 0) {
    alerts.push({ type: 'danger', icon: 'ph-clock', title: 'تذكير', message: 'لم تسجل أي جلسات هذا الأسبوع.' });
  }

  // رسالة ترحيب لو مفيش تنبيهات عشان نتأكد إنه شغال
  if (alerts.length === 0) {
    alerts.push({ 
      type: 'success', 
      icon: 'ph-sparkle', 
      title: 'جاهز للعمل', 
      message: 'كل شيء على ما يرام يا معلمي، المنصة جاهزة لتسجيل إنجازات اليوم!' 
    });
  }

  return alerts;
}

window.showSmartSecretaryPopup = function() {
  const alerts = getSmartAlerts();
  if (alerts.length === 0) return;

  // لو الإشعار موجود بالفعل، امسحه عشان ميتكررش
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

  // بناء الإشعار العائم
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
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
    border: 1px solid var(--color-border-strong);
    overflow: hidden;
    font-family: var(--font-arabic);
    animation: slideDownFade 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  // أنيميشن النزول من فوق
  if (!document.getElementById('smart-secretary-styles')) {
    const style = document.createElement('style');
    style.id = 'smart-secretary-styles';
    style.innerHTML = `@keyframes slideDownFade { from { top: -50px; opacity: 0; } to { top: 20px; opacity: 1; } }`;
    document.head.appendChild(style);
  }

  popup.innerHTML = `
    <div style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800)); color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="ph-duotone ph-robot" style="font-size: 20px;"></i>
        <span style="font-weight: bold; font-size: 14px;">السكرتير الذكي</span>
      </div>
      <button onclick="this.closest('#smart-secretary-popup').style.display='none'" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0;">&times;</button>
    </div>
    <div style="padding: 16px; max-height: 60vh; overflow-y: auto;">
      ${alertsHtml}
    </div>
  `;

  document.body.appendChild(popup);
};


// ==========================================
// 2. كود لوحة التحكم (الرئيسية)
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
        // تشغيل السكرتير الذكي أولاً عشان نضمن ظهوره
        setTimeout(() => {
          if (typeof showSmartSecretaryPopup === "function") {
            showSmartSecretaryPopup();
          }
        }, 500);
        
        // ثم تشغيل الفورم الأساسي
        initSessionForm();
        break;
    }
  };
})();
