(function () {
  let chartInstance = null;

  window.setAnalysisStudent = function (id) {
    appState.ui.analysisStudentId = id;
    router.render();
  };

  window.setAnalysisRange = function (range) {
    appState.ui.analysisRange = range;
    router.render();
  };

  window.showCertificate = function () {
    appState.ui.showCertificate = true;
    if (!appState.ui.certTheme) {
      appState.ui.certTheme = 'theme-default';
    }
    router.render();
  };

  window.hideCertificate = function () {
    appState.ui.showCertificate = false;
    router.render();
  };

  window.setCertificateTheme = function (theme) {
    appState.ui.certTheme = theme;
    router.render();
  };

  function filterSessionsByRange(sessions, range) {
    if (range === "all") return sessions;
    const now = Date.now();
    const limit = range === "week" ? 7 : 30;
    return sessions.filter((s) => new Date(s.date).getTime() >= now - limit * 86400000);
  }

  function buildChartData(sessions) {
    return sessions.slice(-20).map((s, i) => ({ label: i + 1, value: s.overall || 0 }));
  }

  function normalizeStudentSessions(sessions) {
    return sessions.map((s) => {
      if (s.participant && typeof s.participant.overall === "number") {
        return { ...s, overall: s.participant.overall };
      }
      return s;
    });
  }

  function renderCertificate(student, rangeLabel) {
    let isFemale = false;
    if (student.gender === 'girl' || student.gender === 'female') {
      isFemale = true;
    } else if (student.gender !== 'boy') {
      const firstName = student.name.split(' ')[0];
      if (firstName.endsWith('ة') || firstName.endsWith('اء') || firstName.endsWith('ى') || ['مريم', 'زينب', 'هند', 'سعاد', 'ريم', 'نور', 'فاطمة', 'عائشة', 'خديجة', 'آمنة', 'سارة', 'حفصة', 'رقية'].includes(firstName)) {
        isFemale = true;
      }
    }

    const genderSuffix = isFemale ? 'ها' : 'ه';
    const certId = `RQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`;
    const todayDate = formatArDate(new Date().toISOString());
    const hijriDate = new Date().toLocaleDateString('ar-SA-u-ca-islamic', { year: 'numeric', month: 'long', day: 'numeric' });

    const currentTheme = appState.ui.certTheme || 'theme-default';

    let themeColor1 = '#D4AF37'; 
    let themeColor2 = '#B8962E';
    if (currentTheme === 'theme-emerald') {
      themeColor1 = '#0F9D7A';
      themeColor2 = '#145A46';
    } else if (currentTheme === 'theme-sapphire') {
      themeColor1 = '#0D47A1';
      themeColor2 = '#1976D2';
    }

    const boyAvatarSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="bgBoy" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#E8F5E9"/><stop offset="100%" style="stop-color:#C8E6C9"/></linearGradient>
        <linearGradient id="skinBoy" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#FDDCB5"/><stop offset="100%" style="stop-color:#F5C69A"/></linearGradient>
        <linearGradient id="capBoy" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#FFFFFF"/><stop offset="100%" style="stop-color:#F0F0F0"/></linearGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="url(#bgBoy)" stroke="#A5D6A7" stroke-width="2"/>
      <ellipse cx="100" cy="145" rx="55" ry="40" fill="#0B6E4F" opacity="0.9"/>
      <circle cx="100" cy="95" r="42" fill="url(#skinBoy)"/>
      <ellipse cx="100" cy="68" rx="44" ry="30" fill="url(#capBoy)"/>
      <path d="M56 72 Q100 55 144 72" fill="url(#capBoy)" stroke="#E0E0E0" stroke-width="1"/>
      <rect x="85" y="55" width="30" height="8" rx="4" fill="#E8E8E8" opacity="0.6"/>
      <circle cx="86" cy="95" r="4" fill="#3E2723"/>
      <circle cx="114" cy="95" r="4" fill="#3E2723"/>
      <circle cx="87" cy="94" r="1.5" fill="#FFF"/>
      <circle cx="115" cy="94" r="1.5" fill="#FFF"/>
      <ellipse cx="100" cy="105" rx="3" ry="1.5" fill="#D4A574"/>
      <path d="M92 112 Q100 118 108 112" fill="none" stroke="#C97B63" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="80" cy="102" rx="6" ry="4" fill="#F8B4A0" opacity="0.4"/>
      <ellipse cx="120" cy="102" rx="6" ry="4" fill="#F8B4A0" opacity="0.4"/>
    </svg>`;

    const girlAvatarSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="bgGirl" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFF3E0"/><stop offset="100%" style="stop-color:#FFE0B2"/></linearGradient>
        <linearGradient id="skinGirl" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#FDDCB5"/><stop offset="100%" style="stop-color:#F5C69A"/></linearGradient>
        <linearGradient id="hijab" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1B5E20"/><stop offset="50%" style="stop-color:#2E7D32"/><stop offset="100%" style="stop-color:#1B5E20"/></linearGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="url(#bgGirl)" stroke="#FFD54F" stroke-width="2"/>
      <ellipse cx="100" cy="150" rx="50" ry="35" fill="url(#hijab)"/>
      <path d="M50 90 Q50 45 100 40 Q150 45 150 90 Q150 130 140 145 L60 145 Q50 130 50 90Z" fill="url(#hijab)"/>
      <path d="M53 92 Q53 48 100 43 Q147 48 147 92" fill="none" stroke="#FFD54F" stroke-width="1.5" opacity="0.6"/>
      <circle cx="100" cy="95" r="37" fill="url(#skinGirl)"/>
      <circle cx="87" cy="92" r="3.5" fill="#3E2723"/>
      <circle cx="113" cy="92" r="3.5" fill="#3E2723"/>
      <circle cx="88" cy="91" r="1.3" fill="#FFF"/>
      <circle cx="114" cy="91" r="1.3" fill="#FFF"/>
      <path d="M83 86 Q87 83 91 86" fill="none" stroke="#5D4037" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M109 86 Q113 83 117 86" fill="none" stroke="#5D4037" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="100" cy="100" rx="2.5" ry="1.5" fill="#D4A574"/>
      <path d="M94 108 Q100 113 106 108" fill="none" stroke="#C97B63" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="82" cy="100" rx="5" ry="3.5" fill="#F8B4A0" opacity="0.35"/>
      <ellipse cx="118" cy="100" rx="5" ry="3.5" fill="#F8B4A0" opacity="0.35"/>
    </svg>`;

    const avatarSVG = isFemale ? girlAvatarSVG : boyAvatarSVG;
    const avatarDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(avatarSVG)))}`;

    const cornerOrnamentSVG = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${themeColor1}"/><stop offset="100%" style="stop-color:${themeColor2}"/></linearGradient></defs><path d="M0 0 L40 0 Q25 25 0 40 Z" fill="url(#g1)" opacity="0.8"/><path d="M0 0 L60 0 Q35 35 0 60 Z" fill="none" stroke="${themeColor1}" stroke-width="1" opacity="0.4"/><path d="M0 0 L80 0 Q50 50 0 80 Z" fill="none" stroke="${themeColor1}" stroke-width="0.5" opacity="0.2"/><circle cx="20" cy="20" r="3" fill="${themeColor1}" opacity="0.6"/></svg>`)))}`;

    // حقن مباشر للستايل لضمان كسر الكاش وتطبيق الألوان فوراً
    return `
      <div class="cert-preview-container">
        
        <style>
          /* الأخضر الإسلامي */
          .royal-cert.theme-emerald .rc-bg-glow { background: radial-gradient(circle at center, rgba(15, 157, 122, 0.15) 0%, transparent 70%) !important; }
          .royal-cert.theme-emerald .rc-main-title { color: transparent !important; background-image: linear-gradient(to left, #0F9D7A, #145A46) !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important; }
          .royal-cert.theme-emerald .rc-border-gold { border-color: #0F9D7A !important; box-shadow: inset 0 0 0 2px rgba(15, 157, 122, 0.2) !important; }
          .royal-cert.theme-emerald .rc-div-star, .royal-cert.theme-emerald .rc-highlight { color: #0F9D7A !important; }
          .royal-cert.theme-emerald .rc-seal-ring { border-color: rgba(15, 157, 122, 0.3) !important; }
          .royal-cert.theme-emerald .rc-seal-core { background: linear-gradient(135deg, #0F9D7A 0%, #145A46 100%) !important; }
          .royal-cert.theme-emerald .rc-avatar-border { border-color: #0F9D7A !important; }

          /* الأزرق الماسي */
          .royal-cert.theme-sapphire .rc-bg-glow { background: radial-gradient(circle at center, rgba(13, 71, 161, 0.1) 0%, transparent 70%) !important; }
          .royal-cert.theme-sapphire .rc-main-title { color: transparent !important; background-image: linear-gradient(to left, #0D47A1, #1976D2) !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important; }
          .royal-cert.theme-sapphire .rc-border-gold { border-color: #0D47A1 !important; box-shadow: inset 0 0 0 2px rgba(13, 71, 161, 0.2) !important; }
          .royal-cert.theme-sapphire .rc-div-star, .royal-cert.theme-sapphire .rc-highlight { color: #0D47A1 !important; }
          .royal-cert.theme-sapphire .rc-seal-ring { border-color: rgba(13, 71, 161, 0.3) !important; }
          .royal-cert.theme-sapphire .rc-seal-core { background: linear-gradient(135deg, #0D47A1 0%, #1976D2 100%) !important; }
          .royal-cert.theme-sapphire .rc-avatar-border { border-color: #0D47A1 !important; }
        </style>

        <div class="royal-cert ${currentTheme}" id="certificate-box">
          
          <div class="rc-bg-base"></div>
          <div class="rc-bg-pattern"></div>
          <div class="rc-bg-glow"></div>
          
          <div class="rc-border-gold"></div>
          <div class="rc-border-inner"></div>
          
          <img src="${cornerOrnamentSVG}" class="rc-corner rc-corner-tr" alt="" />
          <img src="${cornerOrnamentSVG}" class="rc-corner rc-corner-tl" alt="" />
          <img src="${cornerOrnamentSVG}" class="rc-corner rc-corner-br" alt="" />
          <img src="${cornerOrnamentSVG}" class="rc-corner rc-corner-bl" alt="" />
          
          <div class="rc-top-bar">
            <div class="rc-top-bar-line"></div>
            <div class="rc-top-bar-diamond" style="color:${themeColor1}">◆</div>
            <div class="rc-top-bar-line"></div>
          </div>

          <div class="rc-content">
            <div class="rc-header">
              <div class="rc-meta-block">
                <div class="rc-meta-label">التاريخ الميلادي</div>
                <div class="rc-meta-value">${todayDate}</div>
              </div>
              
              <div class="rc-logo-center">
                <div class="rc-logo-ring" style="border-color:${themeColor1}">
                  <img src="logo.jpeg" class="rc-logo-img" onerror="this.style.display='none'" />
                </div>
                <div class="rc-brand-text" style="color:${themeColor1}">رَفِيقُ القُرْآنِ</div>
              </div>

              <div class="rc-meta-block">
                <div class="rc-meta-label">رقم التوثيق</div>
                <div class="rc-meta-value rc-mono">${certId}</div>
              </div>
            </div>

            <div class="rc-title-section">
              <div class="rc-title-ornament" style="color:${themeColor1}">❋ ❋ ❋</div>
              <h1 class="rc-main-title">شَهَادَةُ إِنْجَازٍ وَتَفَوُّق</h1>
              <div class="rc-title-divider">
                <span class="rc-div-wing" style="color:${themeColor1}">━━━━━━━━</span>
                <span class="rc-div-star">✦</span>
                <span class="rc-div-wing" style="color:${themeColor1}">━━━━━━━━</span>
              </div>
            </div>

            <div class="rc-body">
              <p class="rc-intro-text">تتقدم إدارة المنصة والمعلم الفاضل بخالص الشكر والتقدير إلى ${isFemale ? 'الطالبة المتميزة' : 'الطالب المتميز'}</p>
              
              <div class="rc-student-block">
                <div class="rc-avatar-wrapper">
                  <div class="rc-avatar-glow" style="background: radial-gradient(circle, ${themeColor1} 0%, transparent 70%);"></div>
                  <div class="rc-avatar-border" style="border-color:${themeColor1}">
                    <img src="${avatarDataUrl}" class="rc-avatar-img" alt="${isFemale ? 'طالبة' : 'طالب'}" />
                  </div>
                </div>
                <div class="rc-name-plate">
                  <div class="rc-name-plate-inner ${isFemale ? 'rc-female' : 'rc-male'}">
                    <h2 class="rc-student-name">${student.name}</h2>
                  </div>
                </div>
              </div>

              <p class="rc-achievement-text">
                وذلك لتميز${genderSuffix} الواضح وتفوق${genderSuffix} في <strong class="rc-highlight">${rangeLabel === 'الشهر' ? 'حصاد الشهر' : 'حصاد الأسبوع'}</strong>
              </p>
              <p class="rc-dua-text">سائلين المولى عز وجل أن يجعل${genderSuffix} من أهل القرآن الذين هم أهل الله وخاصته</p>
            </div>

            <div class="rc-footer">
              <div class="rc-sig-col">
                <div class="rc-sig-label">توقيع المعلم</div>
                <div class="rc-sig-value">${appState.settings.teacherName}</div>
                <div class="rc-sig-underline"></div>
              </div>

              <div class="rc-seal-wrapper">
                <div class="rc-seal-outer">
                  <div class="rc-seal-ring" style="border-color: rgba(${currentTheme === 'theme-sapphire' ? '13,71,161' : currentTheme === 'theme-emerald' ? '15,157,122' : '212,175,55'}, 0.3)"></div>
                  <div class="rc-seal-core">
                    <div class="rc-seal-icon">
                      <svg viewBox="0 0 48 48" width="36" height="36"><path d="M24 2L30 16L44 18L34 28L36 42L24 36L12 42L14 28L4 18L18 16Z" fill="#FFF" opacity="0.95"/></svg>
                    </div>
                    <div class="rc-seal-text">مُعْتَمَد</div>
                  </div>
                </div>
              </div>

              <div class="rc-sig-col">
                <div class="rc-sig-label">التقدير العام</div>
                <div class="rc-sig-grade" style="color:${themeColor1}">مُمْتَــاز</div>
                <div class="rc-sig-underline"></div>
              </div>
            </div>
            
            <div class="rc-bottom-verse">
              <span style="color:${themeColor1}">﴿ وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ ﴾</span>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  window.exportCertificateImage = async function () {
    const el = document.getElementById("certificate-box");
    if (!el) return;
    await exportElementAsImage(el, "certificate.png");
  };

  window.exportCertificatePdf = async function () {
    const el = document.getElementById("certificate-box");
    if (!el) return;
    await exportElementAsPdf(el, "certificate.pdf");
  };

  window.exportCertificateGif = async function () {
    const el = document.getElementById("certificate-box");
    if (!el) return;
    await exportElementAsGif(el, "certificate.gif");
  };

  window.renderAnalysisPage = function () {
    const selectedId = appState.ui.analysisStudentId;
    const student = selectedId === "all" ? null : appState.students.find((s) => s.id === selectedId);

    const baseSessions = selectedId === "all"
      ? appState.sessions
      : normalizeStudentSessions(getStudentSessions(selectedId)).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

    const targetSessions = filterSessionsByRange(baseSessions, appState.ui.analysisRange);
    const chartData = buildChartData(targetSessions);

    let weeklyAvg = 0;
    let monthlyAvg = 0;
    if (student) {
      const now = Date.now();
      const weekSessions = baseSessions.filter((s) => new Date(s.date).getTime() >= now - 7 * 86400000);
      const monthSessions = baseSessions.filter((s) => new Date(s.date).getTime() >= now - 30 * 86400000);
      const calc = (arr) => arr.length ? arr.reduce((sum, s) => sum + (s.overall || 0), 0) / arr.length : 0;
      weeklyAvg = calc(weekSessions);
      monthlyAvg = calc(monthSessions);
    }

    const showReward = student && (weeklyAvg >= 4 || monthlyAvg >= 4.5);
    const totalSessions = targetSessions.length;
    const avgRating = totalSessions ? (targetSessions.reduce((s, t) => s + (t.overall || 0), 0) / totalSessions).toFixed(1) : "0";
    const quranSessions = targetSessions.filter(s => s.sessionType !== "islamic").length;
    const islamicSessions = targetSessions.filter(s => s.sessionType === "islamic").length;

    return `
      <div>
        <!-- رأس الصفحة -->
        <div class="d-flex align-items-center gap-3 mb-5">
          <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--emerald-bg);display:flex;align-items:center;justify-content:center;">
            <i class="ph-duotone ph-chart-line-up" style="font-size: 20px; color: var(--emerald)"></i>
          </div>
          <div>
            <div style="font-weight:var(--fw-bold);font-size:var(--fs-lg);color:var(--text-primary);">تحليل الأداء</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);">تتبع التقدم وقياس الإنجاز</div>
          </div>
        </div>

        <!-- فلاتر البحث -->
        <div class="card-soft mb-4">
          <div class="d-flex gap-3 mb-3" style="flex-wrap:wrap;">
            <select class="form-select" style="flex:1;min-width:180px;" onchange="setAnalysisStudent(this.value)">
              <option value="all" ${selectedId === "all" ? "selected" : ""}>جميع الطلاب</option>
              ${appState.students.map((s) => `<option value="${s.id}" ${s.id === selectedId ? "selected" : ""}>${s.name}</option>`).join("")}
            </select>
            <div class="d-flex gap-2">
              <button class="btn ${appState.ui.analysisRange === "week" ? "btn-primary" : "btn-outline"}" onclick="setAnalysisRange('week')">أسبوع</button>
              <button class="btn ${appState.ui.analysisRange === "month" ? "btn-primary" : "btn-outline"}" onclick="setAnalysisRange('month')">شهر</button>
              <button class="btn ${appState.ui.analysisRange === "all" ? "btn-primary" : "btn-outline"}" onclick="setAnalysisRange('all')">الكل</button>
            </div>
          </div>
        </div>

        ${chartData.length > 0 ? `
        <!-- الإحصائيات -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-4);margin-bottom:var(--sp-5);">
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--emerald-dark);">${totalSessions}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">إجمالي الجلسات</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--gold);">${avgRating}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">متوسط التقييم</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--emerald);">${quranSessions}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">حلقات قرآن</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:#0B3D2E;">${islamicSessions}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">حلقات تربية</div>
          </div>
        </div>

        <!-- الرسم البياني -->
        <div class="card-soft mb-4">
          <div style="font-weight:var(--fw-bold);color:var(--text-primary);margin-bottom:var(--sp-3);">معدل الإنجاز</div>
          <div style="height:260px;">
            <canvas id="analysis-chart"></canvas>
          </div>
        </div>
        ` : ""}

        ${showReward ? `
          <div class="card-soft mb-4" style="background:var(--emerald-bg);border-color:rgba(15,157,122,0.15);">
            <div style="font-weight:var(--fw-bold);margin-bottom:var(--sp-3);color:var(--emerald-dark);"><i class="ph-duotone ph-confetti" style="margin-left:4px;"></i>أداء متميز</div>
            <button class="btn btn-primary w-100" onclick="showCertificate()">إصدار شهادة تفوق</button>
          </div>
        ` : ""}

        <!-- استوديو الشهادات (نظام كانفا المصغر) -->
        ${appState.ui.showCertificate && student ? `
          <div class="certificate-studio-wrapper card-soft mb-4" style="padding: 0; overflow: hidden; display: flex; flex-direction: row; min-height: 600px; border: 1px solid var(--color-border-strong);">
            
            <!-- اللوحة الجانبية (Sidebar) للأدوات والقوالب -->
            <div class="studio-sidebar" style="width: 300px; background: #F8FAFC; border-left: 1px solid var(--color-border); display: flex; flex-direction: column;">
              
              <div style="padding: 20px; border-bottom: 1px solid var(--color-border); background: #fff;">
                <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: var(--color-primary-800);">🎨 استوديو التصميم</h3>
                <p style="margin: 5px 0 0; font-size: 12px; color: var(--text-muted);">اختر القالب المناسب للطالب</p>
              </div>

              <!-- قائمة القوالب (هنا هنحط صور الديزاينر لما تخلص) -->
              <div class="studio-tools" style="padding: 20px; overflow-y: auto; flex: 1;">
                
                <div class="template-category" style="margin-bottom: 20px;">
                  <h4 style="font-size: 13px; font-weight: bold; color: var(--color-slate-600); margin-bottom: 10px;">قوالب الأولاد</h4>
                  <div class="template-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="template-btn ${appState.ui.certTheme === 'theme-boy-1' ? 'active' : ''}" onclick="setCertificateTheme('theme-boy-1')" style="height: 80px; background: #e0f2fe; border-radius: 8px; cursor: pointer; border: 2px solid ${appState.ui.certTheme === 'theme-boy-1' ? 'var(--color-primary-600)' : 'transparent'}; display: flex; align-items: center; justify-content: center; font-size: 12px;">قالب 1 (مؤقت)</div>
                    <div class="template-btn ${appState.ui.certTheme === 'theme-boy-2' ? 'active' : ''}" onclick="setCertificateTheme('theme-boy-2')" style="height: 80px; background: #dbeafe; border-radius: 8px; cursor: pointer; border: 2px solid ${appState.ui.certTheme === 'theme-boy-2' ? 'var(--color-primary-600)' : 'transparent'}; display: flex; align-items: center; justify-content: center; font-size: 12px;">قالب 2 (مؤقت)</div>
                  </div>
                </div>

                <div class="template-category" style="margin-bottom: 20px;">
                  <h4 style="font-size: 13px; font-weight: bold; color: var(--color-slate-600); margin-bottom: 10px;">قوالب البنات</h4>
                  <div class="template-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="template-btn ${appState.ui.certTheme === 'theme-girl-1' ? 'active' : ''}" onclick="setCertificateTheme('theme-girl-1')" style="height: 80px; background: #fce7f3; border-radius: 8px; cursor: pointer; border: 2px solid ${appState.ui.certTheme === 'theme-girl-1' ? 'var(--color-primary-600)' : 'transparent'}; display: flex; align-items: center; justify-content: center; font-size: 12px;">قالب 1 (مؤقت)</div>
                    <div class="template-btn ${appState.ui.certTheme === 'theme-girl-2' ? 'active' : ''}" onclick="setCertificateTheme('theme-girl-2')" style="height: 80px; background: #fae8ff; border-radius: 8px; cursor: pointer; border: 2px solid ${appState.ui.certTheme === 'theme-girl-2' ? 'var(--color-primary-600)' : 'transparent'}; display: flex; align-items: center; justify-content: center; font-size: 12px;">قالب 2 (مؤقت)</div>
                  </div>
                </div>
                
                <div class="template-category">
                  <h4 style="font-size: 13px; font-weight: bold; color: var(--color-slate-600); margin-bottom: 10px;">قوالب الكبار</h4>
                  <div class="template-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="template-btn ${appState.ui.certTheme === 'theme-men' ? 'active' : ''}" onclick="setCertificateTheme('theme-men')" style="height: 80px; background: #fef3c7; border-radius: 8px; cursor: pointer; border: 2px solid ${appState.ui.certTheme === 'theme-men' ? 'var(--color-primary-600)' : 'transparent'}; display: flex; align-items: center; justify-content: center; font-size: 12px;">رجال (مؤقت)</div>
                    <div class="template-btn ${appState.ui.certTheme === 'theme-women' ? 'active' : ''}" onclick="setCertificateTheme('theme-women')" style="height: 80px; background: #fdf2f8; border-radius: 8px; cursor: pointer; border: 2px solid ${appState.ui.certTheme === 'theme-women' ? 'var(--color-primary-600)' : 'transparent'}; display: flex; align-items: center; justify-content: center; font-size: 12px;">نساء (مؤقت)</div>
                  </div>
                </div>

              </div>

              <!-- أزرار التصدير تحت اللوحة الجانبية -->
              <div style="padding: 20px; border-top: 1px solid var(--color-border); background: #fff; display: flex; flex-direction: column; gap: 10px;">
                <button class="btn btn-primary w-100" onclick="exportCertificateImage()"><i class="ph-duotone ph-image" style="margin-left:4px;"></i>تحميل كصورة</button>
                <button class="btn btn-gold w-100" onclick="exportCertificatePdf()"><i class="ph-duotone ph-file-pdf" style="margin-left:4px;"></i>تحميل PDF</button>
                <button class="btn btn-outline-danger w-100" onclick="hideCertificate()">إغلاق الاستوديو</button>
              </div>
            </div>

            <!-- منطقة العرض (Preview) -->
            <div class="studio-preview" style="flex: 1; padding: 40px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; overflow: auto;">
               <!-- هنا بننادي على دالة عرض الشهادة -->
               ${renderCertificate(student, monthlyAvg >= 4.5 ? "الشهر" : "الأسبوع")}
            </div>

          </div>
        ` : ""}
      </div>
    `;
  };

  window.initAnalysisPage = function () {
    const canvas = document.getElementById("analysis-chart");
    if (!canvas) return;

    const selectedId = appState.ui.analysisStudentId;
    const baseSessions = selectedId === "all"
      ? appState.sessions
      : normalizeStudentSessions(getStudentSessions(selectedId)).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

    const targetSessions = filterSessionsByRange(baseSessions, appState.ui.analysisRange);
    const data = buildChartData(targetSessions);

    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.parentElement.clientHeight);
    gradient.addColorStop(0, "rgba(15, 157, 122, 0.4)");
    gradient.addColorStop(1, "rgba(15, 157, 122, 0.0)");

    chartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: "التقييم",
            data: data.map((d) => d.value),
            borderColor: "#0F9D7A",
            backgroundColor: gradient,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#FFFFFF",
            pointBorderColor: "#0F9D7A",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "#D4AF37",
            pointHoverBorderColor: "#FFFFFF",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1500, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            titleColor: '#0B3D2E',
            bodyColor: '#0F9D7A',
            borderColor: 'rgba(15,157,122,0.1)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            titleFont: { family: 'Cairo', size: 14, weight: 'bold' },
            bodyFont: { family: 'Cairo', size: 14 },
            displayColors: false,
          }
        },
        scales: {
          y: {
            min: 0, max: 5,
            grid: { color: "rgba(15,157,122,0.05)", drawBorder: false },
            ticks: { font: { family: "Cairo" }, color: '#94A3B8' },
          },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { font: { family: "Cairo" }, color: '#94A3B8' },
          },
        },
      },
    });
  };
})();
