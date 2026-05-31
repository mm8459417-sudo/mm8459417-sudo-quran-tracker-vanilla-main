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
    // تعيين القالب الافتراضي عند فتح الشهادة لأول مرة
    if (!appState.ui.certTheme) {
      appState.ui.certTheme = 'theme-default';
    }
    router.render();
  };

  window.hideCertificate = function () {
    appState.ui.showCertificate = false;
    router.render();
  };

  // دالة جديدة لتغيير قالب الشهادة
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

    const cornerOrnamentSVG = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#D4AF37"/><stop offset="100%" style="stop-color:#B8962E"/></linearGradient></defs><path d="M0 0 L40 0 Q25 25 0 40 Z" fill="url(#g1)" opacity="0.8"/><path d="M0 0 L60 0 Q35 35 0 60 Z" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.4"/><path d="M0 0 L80 0 Q50 50 0 80 Z" fill="none" stroke="#D4AF37" stroke-width="0.5" opacity="0.2"/><circle cx="20" cy="20" r="3" fill="#D4AF37" opacity="0.6"/></svg>`)))}`;

    // جلب القالب المختار من الـ state (وإلا نستخدم الافتراضي)
    const currentTheme = appState.ui.certTheme || 'theme-default';

    return `
      <div class="cert-preview-container">
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
            <div class="rc-top-bar-diamond">◆</div>
            <div class="rc-top-bar-line"></div>
          </div>

          <div class="rc-content">
            
            <div class="rc-header">
              <div class="rc-meta-block">
                <div class="rc-meta-label">التاريخ الميلادي</div>
                <div class="rc-meta-value">${todayDate}</div>
              </div>
              
              <div class="rc-logo-center">
                <div class="rc-logo-ring">
                  <img src="logo.jpeg" class="rc-logo-img" onerror="this.style.display='none'" />
                </div>
                <div class="rc-brand-text">رَفِيقُ القُرْآنِ</div>
              </div>

              <div class="rc-meta-block">
                <div class="rc-meta-label">رقم التوثيق</div>
                <div class="rc-meta-value rc-mono">${certId}</div>
              </div>
            </div>

            <div class="rc-title-section">
              <div class="rc-title-ornament">❋ ❋ ❋</div>
              <h1 class="rc-main-title">شَهَادَةُ إِنْجَازٍ وَتَفَوُّق</h1>
              <div class="rc-title-divider">
                <span class="rc-div-wing">━━━━━━━━</span>
                <span class="rc-div-star">✦</span>
                <span class="rc-div-wing">━━━━━━━━</span>
              </div>
            </div>

            <div class="rc-body">
              <p class="rc-intro-text">تتقدم إدارة المنصة والمعلم الفاضل بخالص الشكر والتقدير إلى ${isFemale ? 'الطالبة المتميزة' : 'الطالب المتميز'}</p>
              
              <div class="rc-student-block">
                <div class="rc-avatar-wrapper">
                  <div class="rc-avatar-glow"></div>
                  <div class="rc-avatar-border">
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
                  <div class="rc-seal-ring"></div>
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
                <div class="rc-sig-grade">مُمْتَــاز</div>
                <div class="rc-sig-underline"></div>
              </div>
            </div>
            
            <div class="rc-bottom-verse">
              <span>﴿ وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ ﴾</span>
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
        <div class="elite-ai-insights">
          <div class="ai-icon"><i class="ph-duotone ph-sparkle"></i></div>
          <div class="ai-content">
            <div class="ai-title">رؤية الذكاء الاصطناعي <span>(AI Insight)</span></div>
            <div class="ai-desc">
              ${avgRating >= 4.5 ? "أداء مبهر! معدل الحفظ والمراجعة في تصاعد مستمر، والطلاب يظهرون التزاماً ممتازاً في الجلسات الأخيرة. استمر في تعزيز هذا التفوق." :
          avgRating >= 3.5 ? "أداء جيد ومستقر إجمالاً. يوصى بزيادة التركيز على المراجعة (الماضي البعيد) لبعض الطلاب لتعزيز الحفظ وتقليل احتمالية التشتت." :
            "تحتاج بعض الجوانب لمزيد من المتابعة الدقيقة. يفضل تقليل مقدار الحفظ الجديد مؤقتاً والتركيز على تثبيت ومراجعة الماضي بشكل مكثف."}
            </div>
          </div>
        </div>
        ` : ""}

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

        ${chartData.length === 0 ? `
          <div class="elite-empty-state">
            <div class="elite-empty-icon"><i class="ph-duotone ph-chart-line-down"></i></div>
            <div class="elite-empty-title">لا توجد بيانات كافية للتحليل</div>
            <div class="elite-empty-desc">سجّل المزيد من الجلسات والتقييمات لفتح الرسوم البيانية العميقة والتحليلات المتقدمة.</div>
          </div>
        ` : `
          <div class="card-soft mb-4">
            <div style="font-weight:var(--fw-bold);color:var(--text-primary);margin-bottom:var(--sp-3);">معدل الإنجاز</div>
            <div style="height:260px;">
              <canvas id="analysis-chart"></canvas>
            </div>
          </div>
        `}

        ${showReward ? `
          <div class="card-soft mb-4" style="background:var(--emerald-bg);border-color:rgba(15,157,122,0.15);">
            <div style="font-weight:var(--fw-bold);margin-bottom:var(--sp-3);color:var(--emerald-dark);"><i class="ph-duotone ph-confetti" style="margin-left:4px;"></i>أداء متميز</div>
            <input class="form-control mb-3" placeholder="مبلغ المكافأة (ج.م)" value="${appState.ui.rewardAmount || ""}" oninput="appState.ui.rewardAmount=this.value" />
            <button class="btn btn-primary w-100" onclick="showCertificate()">إصدار شهادة تفوق</button>
          </div>
        ` : ""}

        ${appState.ui.showCertificate && student ? `
          <div class="card-soft mb-4">
            
            <div class="mb-4 p-3" style="background: rgba(0,0,0,0.03); border-radius: 12px; border: 1px solid rgba(0,0,0,0.05);">
              <label style="font-weight: bold; margin-bottom: 10px; display: block; color: var(--text-primary);">اختر قالب وتصميم الشهادة:</label>
              <div class="d-flex gap-2">
                <button class="btn ${appState.ui.certTheme === 'theme-default' ? 'btn-gold' : 'btn-outline'}" onclick="setCertificateTheme('theme-default')" style="flex:1;">الذهبي الملكي</button>
                <button class="btn ${appState.ui.certTheme === 'theme-emerald' ? 'btn-primary' : 'btn-outline'}" onclick="setCertificateTheme('theme-emerald')" style="flex:1;">الأخضر الإسلامي</button>
                <button class="btn ${appState.ui.certTheme === 'theme-sapphire' ? 'btn-primary' : 'btn-outline'}" onclick="setCertificateTheme('theme-sapphire')" style="flex:1;">الأزرق الماسي</button>
              </div>
            </div>

            ${renderCertificate(student, monthlyAvg >= 4.5 ? "الشهر" : "الأسبوع")}
            
            <div class="d-flex flex-wrap gap-2 mt-3">
              <button class="btn btn-primary btn-sm" onclick="exportCertificateImage()"><i class="ph-duotone ph-image" style="margin-left:4px;"></i>صورة</button>
              <button class="btn btn-gold btn-sm" onclick="exportCertificatePdf()"><i class="ph-duotone ph-file-pdf" style="margin-left:4px;"></i>PDF</button>
              <button class="btn btn-outline btn-sm" onclick="exportCertificateGif()"><i class="ph-duotone ph-gif" style="margin-left:4px;"></i>GIF</button>
              <button class="btn btn-outline btn-sm" onclick="hideCertificate()">إغلاق</button>
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
