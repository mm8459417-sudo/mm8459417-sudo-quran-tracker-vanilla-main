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
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
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

  // تم استبدال المتغيرات الوهمية بألوان حقيقية (أخضر داكن)
  popup.innerHTML = `
    <div style="background: linear-gradient(135deg, #0f9d7a, #065f46); color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="ph-duotone ph-robot" style="font-size: 20px;"></i>
        <span style="font-weight: bold; font-size: 14px;">السكرتير الذكي</span>
      </div>
      <button onclick="this.closest('#smart-secretary-popup').remove()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0;">&times;</button>
    </div>
    <div style="padding: 16px; max-height: 60vh; overflow-y: auto;">
      ${alertsHtml}
    </div>
  `;

  document.body.appendChild(popup);
};


// ==========================================
// 2. كود لوحة التحكم (الرئيسية) بتصميم مدمج
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

    return `
      <section class="dash-shell">
        
        <div style="background: linear-gradient(135deg, #0f9d7a, #065f46); border-radius: 16px; padding: 30px; color: white; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(15,157,122,0.2); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div>
            <div style="background: rgba(255,255,255,0.2); padding: 6px 15px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 15px; display: inline-block;">
              <i class="ph-duotone ph-calendar-check" style="margin-left: 5px;"></i> ${todayLabel}
            </div>
            <h1 style="font-size: 26px; font-weight: bold; margin: 0 0 10px 0; color: white;">السَّلَامُ عَلَيْكُمْ، ${teacherName}</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 15px; max-width: 500px;">مرحباً بك في مساحتك الخاصة. تابع إنجازات طلابك وتتبع تقدمهم في حفظ كتاب الله بكل يسر وسهولة.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn" style="background: white; color: #0f9d7a; border: none; font-weight: bold; padding: 10px 20px; border-radius: 8px; cursor: pointer;" onclick="setActiveTab('form')">
              <i class="ph-duotone ph-plus-circle"></i> تسجيل جلسة
            </button>
            <button class="btn" style="background: rgba(255,255,255,0.2); color: white; border: none; font-weight: bold; padding: 10px 20px; border-radius: 8px; cursor: pointer;" onclick="setActiveTab('analysis')">
              <i class="ph-duotone ph-chart-pie-slice"></i> التحليلات
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px;">
          
          <div class="card-soft" style="display: flex; align-items: center; gap: 15px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
            <div style="width: 55px; height: 55px; background: rgba(15,157,122,0.1); color: #0f9d7a; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px;">
              <i class="ph-duotone ph-users-three"></i>
            </div>
            <div>
              <div style="font-size: 13px; color: #64748b; font-weight: bold;">إجمالي الطلاب</div>
              <div style="font-size: 24px; font-weight: 900; color: #1e293b;">${appState.students.length}</div>
            </div>
          </div>

          <div class="card-soft" style="display: flex; align-items: center; gap: 15px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
            <div style="width: 55px; height: 55px; background: rgba(245,158,11,0.1); color: #f59e0b; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px;">
              <i class="ph-duotone ph-books"></i>
            </div>
            <div>
              <div style="font-size: 13px; color: #64748b; font-weight: bold;">جلسات مُنجزة</div>
              <div style="font-size: 24px; font-weight: 900; color: #1e293b;">${appState.sessions.length}</div>
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
        // السكرتير بيشتغل أولاً
        setTimeout(() => {
          if (typeof showSmartSecretaryPopup === "function") {
            showSmartSecretaryPopup();
          }
        }, 500);
        
        // بعدها الفورم بيحمل
        initSessionForm();
        break;
    }
  };
})();
