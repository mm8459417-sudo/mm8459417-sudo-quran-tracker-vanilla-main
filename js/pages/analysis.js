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
    const todayDate = formatArDate(new Date().toISOString());

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

    // SVG البنت (للبنات فقط)
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
    const girlAvatarDataUrl = `data:image/svg+xml;base64,{girlAvatarSVG}`;

    const cornerOrnamentSVG = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${themeColor1}"/><stop offset="100%" style="stop-color:${themeColor2}"/></linearGradient></defs><path d="M0 0 L40 0 Q25 25 0 40 Z" fill="url(#g1)" opacity="0.8"/><path d="M0 0 L60 0 Q35 35 0 60 Z" fill="none" stroke="${themeColor1}" stroke-width="1" opacity="0.4"/><path d="M0 0 L80 0 Q50 50 0 80 Z" fill="none" stroke="${themeColor1}" stroke-width="0.5" opacity="0.2"/><circle cx="20" cy="20" r="3" fill="${themeColor1}" opacity="0.6"/></svg>`)))}`;

    const defaultIntro = `تتقدم إدارة حلقات الصحبة بخالص الشكر والتقدير إلى الطالب المتميز`;
    const defaultReason = `وذلك لتميز${genderSuffix} الواضح وتفوق${genderSuffix} في حصاد الشهر\nسائلين المولى عز وجل أن يجعل${genderSuffix} من أهل القرآن الذين هم أهل الله وخاصته`;

    const introText = appState.ui.certIntroText !== undefined ? appState.ui.certIntroText : defaultIntro;
    const reasonText = appState.ui.certReasonText !== undefined ? appState.ui.certReasonText : defaultReason;
    const rewardAmount = appState.ui.certRewardAmount || "";

    return `
      <div class="cert-preview-container" style="position: relative; font-family: 'Cairo', sans-serif;">
        
        <div class="certificate-template-background" id="certificate-box" style="position: relative; width: 100%; height: 100%; background-image: url('js/pages/cert_template.jpg'); background-size: cover; background-position: center; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
          
          <style>
            .royal-cert.theme-emerald .rc-border-gold { border-color: #0F9D7A !important; box-shadow: inset 0 0 0 2px rgba(15, 157, 122, 0.2) !important; box-shadow: inset 0 0 0 2px rgba(15, 157, 122, 0.2) !important; }
            .royal-cert.theme-emerald .rc-div-star, .royal-cert.theme-emerald .rc-highlight { color: #0F9D7A !important; }
            .royal-cert.theme-emerald .rc-avatar-border { border-color: transparent !important; background: transparent !important; box-shadow: none !important; }

            .royal-cert.theme-sapphire .rc-border-gold { border-color: #0D47A1 !important; box-shadow: inset 0 0 0 2px rgba(13, 71, 161, 0.2) !important; box-shadow: inset 0 0 0 2px rgba(13, 71, 161, 0.2) !important; }
            .royal-cert.theme-sapphire .rc-div-star, .royal-cert.theme-sapphire .rc-highlight { color: #0D47A1 !important; }
            .royal-cert.theme-sapphire .rc-avatar-border { border-color: transparent !important; background: transparent !important; box-shadow: none !important; }

            /* إخفاء الفوانيس القديمة (برمجياً عبر overlay) */
            .fanoos-remover {
              position: absolute;
              top: 0; left: 0; right: 0; height: 15%;
              background: #1b263b; /* نفس لون الخلفية الكحلي */
              z-index: 5;
            }
          </style>

          <div class="fanoos-remover"></div>

          <div class="text-remover intro-remover" style="position: absolute; top: 32%; left: 10%; right: 10%; height: 6%; background: rgba(27,38,59,0.9); z-index: 10;"></div>
          <div class="text-remover reason-remover" style="position: absolute; top: 40%; left: 10%; right: 10%; height: 10%; background: rgba(27,38,59,0.9); z-index: 10;"></div>
          
          <div class="cert-content-overlay royal-cert ${currentTheme}" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 15;">
            
            <div class="rc-date" style="position: absolute; top: 90.3%; right: 10%; font-size: 16px; color: #fff;">${appState.sessions[0].date}</div>

            <div class="rc-content" style="position: relative; width: 100%; height: 100%;">
              <div class="rc-header">
                <div class="rc-meta-block" style="position: absolute; top: 10%; left: 15%; opacity: 1;">
                  <img src="js/pages/logo.png" style="height: 85px; width: auto; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));" alt="Logo" />
                </div>
              </div>

              <div class="rc-title-section" style="position: absolute; top: 22%; left: 50%; transform: translateX(-50%); text-align: center; width: 80%;">
                <h1 class="rc-main-title" style="font-family: 'Amiri', serif; font-size: 60px; color: transparent; background-image: linear-gradient(to left, #e9c46a, #c9973a); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">شهادة إنجاز وتفوق</h1>
              </div>

              <div class="rc-body" style="position: absolute; top: 32%; left: 50%; transform: translateX(-50%); width: 80%;">
                ${introText ? `<p class="rc-intro-text" style="color: #fff; font-size: 20px; text-align: center; line-height: 1.5; margin-bottom: 30px;">${introText.replace(/\n/g, '<br>')}</p>` : ''}
                
                <div class="rc-student-block" style="position: absolute; top: 40%; left: 50%; transform: translateX(-50%); width: 100%;">
                  <div class="rc-avatar-wrapper" style="position: relative; display: flex; justify-content: center;">
                    <div class="rc-avatar-glow" style="background: radial-gradient(circle, ${themeColor1} 0%, transparent 70%);"></div>
                    
                    <div class="rc-avatar-border" style="width: 170px; height: 170px; border: 4px solid transparent; background: transparent; padding: 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                      ${isFemale ? 
                        `<img src="${girlAvatarDataUrl}" class="rc-avatar-img" alt="طالبة" />` : 
                        `<img src="js/pages/boy.png" class="rc-avatar-img" alt="طالب" style="object-fit: contain; width: 100%; height: 100%; border-radius: 50%;" />`
                      }
                    </div>

                  </div>
                  <div class="rc-name-plate" style="margin-top: 10px;">
                    <div class="rc-name-plate-inner ${isFemale ? 'rc-female' : 'rc-male'}" style="text-align: center;">
                      <h2 class="rc-student-name" style="font-family: 'Amiri', serif; font-size: 35px; color: #fff;">${student.name}</h2>
                    </div>
                  </div>
                </div>

                ${reasonText ? `<p class="rc-achievement-text" style="color: #fff; font-size: 18px; text-align: center; line-height: 1.6;">${reasonText.replace(/\n/g, '<br>')}</p>` : ''}
              </div>

              <div class="rc-footer" style="position: absolute; top: 85%; left: 50%; transform: translateX(-50%); width: 80%; display: flex; align-items: flex-end; margin-top: 30px;">
                <div class="rc-sig-col rc-sig-teacher" style="flex: 1; text-align: right; color: #fff; font-size: 16px;">توقيع المعلم</div>
                
                <div class="rc-sig-col rc-sig-admin" style="flex: 1; text-align: left; color: #fff; font-size: 16px;">توقيع الإدارة</div>
              </div>
              
              <div class="rc-bottom-verse" style="position: absolute; top: 92%; left: 50%; transform: translateX(-50%); text-align: center; width: 80%; font-size: 14px; color: transparent; background-image: linear-gradient(to left, #e9c46a, #c9973a); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">
                <span>﴿ إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ كَانَتْ لَهُمْ جَنَّاتُ الْفردوس نزلا ﴾</span>
              </div>

              <div class="rc-seal-wrapper" style="position: absolute; bottom: 15%; right: 10%; text-align: center; display: flex; flex-direction: column; align-items: center; z-index: 20;">
                ${rewardAmount ? `
                  <div style="text-align: center; position: absolute; bottom: 0;">
                      <div style="font-size: 13px; color: #fff; font-weight: 700; margin-bottom: 5px;">وحصل على مكافأة مالية:</div>
                      <div style="font-size: 55px; line-height: 1; margin-bottom: -15px; position: relative; z-index: 2; text-shadow: 0 4px 10px rgba(0,0,0,0.15);">💰</div>
                      <div style="background: linear-gradient(to bottom, #fcd34d, #f59e0b); border-radius: 50px; padding: 5px 30px; display: inline-block; color: #fff; font-weight: 800; font-size: 26px; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);">
                          ${rewardAmount}
                      </div>
                      <div style="font-size: 14px; font-weight: 800; color: #fff; margin-top: 2px;">جنيهاً مصرياً</div>
                  </div>
                ` : ''}
              </div>

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
        <div class="d-flex align-items-center gap-3 mb-5">
          <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--emerald-bg);display:flex;align-items:center;justify-content:center;">
            <i class="ph-duotone ph-chart-line-up" style="font-size: 20px; color: var(--emerald)"></i>
          </div>
          <div>
            <div style="font-weight:var(--fw-bold);font-size:var(--fs-lg);color:var(--text-primary);">تحليل الأداء</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);">تتبع التقدم وقياس الإنجاز</div>
          </div>
        </div>

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

       ${appState.ui.showCertificate && student ? `
          <div class="certificate-studio-wrapper card-soft mb-4" style="padding: 0; overflow: hidden; display: flex; flex-wrap: wrap; border: 1px solid var(--color-border-strong);">
            
            <div class="studio-sidebar" style="flex: 1 1 250px; max-width: 320px; background: #F8FAFC; border-left: 1px solid var(--color-border); display: flex; flex-direction: column; min-height: 500px;">
              
              <div style="padding: 20px; border-bottom: 1px solid var(--color-border); background: #fff;">
                <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: var(--color-primary-800);">🎨 إعدادات الشهادة</h3>
              </div>

              <div style="padding: 20px; border-bottom: 1px solid var(--color-border); background: #fefce8;">
                <label style="font-size: 13px; font-weight: bold; color: #854d0e; display: block; margin-bottom: 5px;">النص العلوي (قبل الاسم)</label>
                <textarea class="form-control" style="font-size: 12px; min-height: 50px; margin-bottom: 10px; border-color: #fde047;" placeholder="تتقدم إدارة المنصة..." onchange="appState.ui.certIntroText = this.value; scheduleRender();">${appState.ui.certIntroText !== undefined ? appState.ui.certIntroText : `تتقدم إدارة حلقات الصحبة بخالص الشكر والتقدير إلى الطالب المتميز`}</textarea>
                
                <label style="font-size: 13px; font-weight: bold; color: #854d0e; display: block; margin-bottom: 5px;">النص السفلي (سبب التكريم والدعاء)</label>
                <textarea class="form-control" style="font-size: 12px; min-height: 60px; margin-bottom: 15px; border-color: #fde047;" placeholder="وذلك لتميزه الواضح..." onchange="appState.ui.certReasonText = this.value; scheduleRender();">${appState.ui.certReasonText !== undefined ? appState.ui.certReasonText : `وذلك لتميز${student.gender==='girl'?'ها':'ه'} الواضح وتفوق${student.gender==='girl'?'ها':'ه'} في حصاد الشهر\nسائلين المولى عز وجل أن يجعل${student.gender==='girl'?'ها':'ه'} من أهل القرآن الذين هم أهل الله وخاصته`}</textarea>

                <label style="font-size: 13px; font-weight: bold; color: #854d0e; display: block; margin-bottom: 5px;">المكافأة المالية ج.م (اختياري)</label>
                <input type="number" class="form-control" style="border-color: #fde047; font-weight: bold;" placeholder="مثال: 50 (اتركه فارغ للإخفاء)" value="${appState.ui.certRewardAmount || ''}" onchange="appState.ui.certRewardAmount = this.value; scheduleRender();" />
              </div>

              <div class="studio-tools" style="padding: 20px; overflow-y: auto; flex: 1;">
                <div class="template-category" style="margin-bottom: 20px;">
                  <h4 style="font-size: 13px; font-weight: bold; color: var(--color-slate-600); margin-bottom: 10px;">قوالب الأولاد</h4>
                  <div class="template-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="template-btn ${appState.ui.certTheme === 'theme-emerald' ? 'active' : ''}" onclick="setCertificateTheme('theme-emerald')" style="height: 80px; background: #d1fae5; border-radius: 8px; cursor: pointer; border: 2px solid ${appState.ui.certTheme === 'theme-emerald' ? 'var(--color-primary-600)' : 'transparent'}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #065f46;">أخضر إسلامي</div>
                    <div class="template-btn ${appState.ui.certTheme === 'theme-sapphire' ? 'active' : ''}" onclick="setCertificateTheme('theme-sapphire')" style="height: 80px; background: #dbeafe; border-radius: 8px; cursor: pointer; border: 2px solid ${appState.ui.certTheme === 'theme-sapphire' ? 'var(--color-primary-600)' : 'transparent'}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #1e3a8a;">أزرق ملكي</div>
                  </div>
                </div>
              </div>

              <div style="padding: 20px; border-top: 1px solid var(--color-border); background: #fff; display: flex; flex-direction: column; gap: 10px;">
                <button class="btn btn-primary w-100" onclick="exportCertificateImage()"><i class="ph-duotone ph-image" style="margin-left:4px;"></i>تحميل كصورة</button>
                <button class="btn btn-gold w-100" onclick="exportCertificatePdf()"><i class="ph-duotone ph-file-pdf" style="margin-left:4px;"></i>تحميل PDF</button>
                <button class="btn btn-outline-danger w-100" onclick="hideCertificate()">إغلاق الاستوديو</button>
              </div>
            </div>

            <div class="studio-preview" style="flex: 1 1 500px; min-width: 0; padding: 40px 20px; background: #e2e8f0; overflow: auto; display: flex; justify-content: center;">
               <div style="box-shadow: 0 20px 40px rgba(0,0,0,0.2); border-radius: 12px; max-width: 100%;">
                 ${renderCertificate(student, monthlyAvg >= 4.5 ? "الشهر" : "الأسبوع")}
               </div>
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
