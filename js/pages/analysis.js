(function () {
  let chartInstance = null;

  // ==========================================
  // أدوات مساعدة عامة (Helpers)
  // ==========================================

  function getCurrentMonthYear() {
    const now = new Date();
    const month = typeof appState.ui.month === "number" ? appState.ui.month : now.getMonth();
    const year = typeof appState.ui.year === "number" ? appState.ui.year : now.getFullYear();
    return { month, year };
  }

  function filterSessionsByMonth(sessions, month, year) {
    return sessions.filter((s) => {
      const d = new Date(s.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }

  function calcAverage(sessions) {
    if (!sessions.length) return 0;
    return sessions.reduce((sum, s) => sum + (s.overall || 0), 0) / sessions.length;
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

  function getStudentQuranLimit(student) {
    if (!student) return 0;
    const raw = student.quranLimit !== undefined && student.quranLimit !== null
      ? student.quranLimit
      : student.sessionLimit;
    return Number(raw) || 0;
  }

  function getStudentIslamicLimit(student) {
    if (!student) return 0;
    return Number(student.islamicLimit) || 0;
  }

  // خوارزمية الحد الأدنى للتحليل بناءً على حجم الباقة الشهرية
  function getMinimumThreshold(packageLimit) {
    if (packageLimit >= 6) return 4;
    if (packageLimit >= 3) return 3; // يغطي 3 و4 و5
    return 0; // 1 أو 2 أو بدون باقة: لا يوجد حد أدنى، يمكن التحليل مباشرة
  }

  function detectGender(student) {
    if (!student) return false;
    if (student.gender === "girl" || student.gender === "female") return true;
    if (student.gender === "boy") return false;
    const firstName = student.name.split(" ")[0];
    const femaleEndings = ["ة", "اء", "ى"];
    const femaleNames = ["مريم", "زينب", "هند", "سعاد", "ريم", "نور", "فاطمة", "عائشة", "خديجة", "آمنة", "سارة", "حفصة", "رقية"];
    if (femaleEndings.some((end) => firstName.endsWith(end)) || femaleNames.includes(firstName)) {
      return true;
    }
    return false;
  }

  function getDefaultCertTexts(student) {
    const isFemale = detectGender(student);
    const genderSuffix = isFemale ? "ها" : "ه";
    const defaultIntro = `تتقدم إدارة حلقات الصحبة والمعلم بخالص الشكر والتقدير إلى الطالب المتميز`;
    const defaultReason = `وذلك لتميز${genderSuffix} الواضح وتفوق${genderSuffix} في حفظ كتاب الله\nسائلين المولى عز وجل أن يجعل${genderSuffix} من أهل القرآن`;
    return { defaultIntro, defaultReason };
  }

  // ==========================================
  // حساب سياق التحليل الكامل (يُستخدم في العرض والرسم البياني معًا)
  // ==========================================
  function computeAnalysisContext() {
    if (appState.ui.analysisMode !== "quran" && appState.ui.analysisMode !== "islamic") {
      appState.ui.analysisMode = "quran";
    }

    const selectedId = appState.ui.analysisStudentId || "all";
    const student = selectedId === "all" ? null : appState.students.find((s) => s.id === selectedId);

    const { month, year } = getCurrentMonthYear();

    const baseSessions = selectedId === "all"
      ? appState.sessions.slice()
      : normalizeStudentSessions(getStudentSessions(selectedId)).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

    const monthSessions = filterSessionsByMonth(baseSessions, month, year).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    const quranMonthSessions = monthSessions.filter((s) => s.sessionType !== "islamic");
    const islamicMonthSessions = monthSessions.filter((s) => s.sessionType === "islamic");

    let quranLimit = 0;
    let islamicLimit = 0;
    let canToggleMode = false;
    let mode = appState.ui.analysisMode;
    let hasNoPackage = false;

    if (student) {
      quranLimit = getStudentQuranLimit(student);
      islamicLimit = getStudentIslamicLimit(student);

      if (quranLimit > 0 && islamicLimit === 0) {
        mode = "quran";
      } else if (islamicLimit > 0 && quranLimit === 0) {
        mode = "islamic";
      } else if (quranLimit > 0 && islamicLimit > 0) {
        canToggleMode = true;
      } else {
        hasNoPackage = true;
        mode = "quran";
      }
      appState.ui.analysisMode = mode; // مزامنة الحالة مع الباقة الفعلية للطالب
    } else {
      canToggleMode = true; // في وضع "جميع الطلاب" يظل التبديل متاحًا دائمًا
    }

    const targetSessions = mode === "quran" ? quranMonthSessions : islamicMonthSessions;
    const packageLimit = student ? (mode === "quran" ? quranLimit : islamicLimit) : null;
    const minThreshold = student && !hasNoPackage ? getMinimumThreshold(packageLimit) : null;

    const executedCount = targetSessions.length;
    const avgRatingNum = calcAverage(targetSessions);
    const avgRating = avgRatingNum.toFixed(1);

    let meetsMinimum = false;
    if (student && !hasNoPackage) {
      meetsMinimum = minThreshold === 0 ? executedCount >= 1 : executedCount >= minThreshold;
    }

    let status = null;
    if (student && !hasNoPackage && executedCount > 0) {
      if (!meetsMinimum) {
        status = {
          key: "waiting",
          icon: "⏳",
          title: "بانتظار استكمال الحد الأدنى",
          detail: `تم تنفيذ ${executedCount} من أصل ${minThreshold} حلقات كحد أدنى مطلوب لبدء التحليل هذا الشهر.`,
        };
      } else if (avgRatingNum >= 4.0) {
        status = {
          key: "eligible",
          icon: "✅",
          title: "مؤهل لإصدار شهادة تفوق",
          detail: `تم تنفيذ ${executedCount} حلقة بمتوسط تقييم ${avgRating} من 5.`,
        };
      } else {
        status = {
          key: "low",
          icon: "❌",
          title: "التقييم أقل من المطلوب",
          detail: `تم تنفيذ ${executedCount} حلقة${minThreshold > 0 ? ` (الحد الأدنى ${minThreshold})` : ""}، لكن متوسط التقييم ${avgRating} أقل من 4.0 المطلوب لإصدار الشهادة.`,
        };
      }
    }

    const showReward = !!(student && !hasNoPackage && executedCount > 0 && meetsMinimum && avgRatingNum >= 4.0);

    return {
      selectedId, student, mode, canToggleMode, hasNoPackage,
      month, year,
      quranLimit, islamicLimit, packageLimit, minThreshold,
      monthSessions, quranMonthSessions, islamicMonthSessions,
      targetSessions, executedCount, avgRating, avgRatingNum,
      status, showReward,
    };
  }

  // ==========================================
  // معالجات الأحداث (Event Handlers)
  // ==========================================

  window.setAnalysisStudent = function (id) {
    appState.ui.analysisStudentId = id;
    router.render();
  };

  window.setAnalysisMode = function (mode) {
    appState.ui.analysisMode = mode;
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

  // ==========================================
  // الشهادة
  // ==========================================
  function renderCertificate(student, periodLabel) {
    const { defaultIntro, defaultReason } = getDefaultCertTexts(student);

    const introText = appState.ui.certIntroText !== undefined ? appState.ui.certIntroText : defaultIntro;
    const reasonText = appState.ui.certReasonText !== undefined ? appState.ui.certReasonText : defaultReason;
    const rewardAmount = appState.ui.certRewardAmount || "";

    const imgPath = "./js/pages/cert_bg.png";

    return `
      <div style="width: 100%; display: flex; justify-content: center; overflow: hidden; background: #e2e8f0; padding: 20px 0; border-radius: 12px;">
        <div style="width: 1000px; height: 710px; transform: scale(0.60); transform-origin: top center; margin-bottom: -280px;">
          
          <div id="certificate-box" style="width: 1000px; height: 710px; position: relative; background-color: #fdfaf6; overflow: hidden; font-family: 'Cairo', sans-serif;">
            
            <img src="${imgPath}" style="position: absolute; top: 0; left: 0; width: 1000px; height: 710px; object-fit: cover; z-index: 0;" alt="" />

            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10;">
              
              <div style="position: absolute; top: 38%; width: 100%; text-align: center;">
                <p style="font-size: 22px; color: #1c2b4d; font-weight: 800; margin: 0; padding: 0 10%; line-height: 1.5;">${introText.replace(/\n/g, '<br>')}</p>
              </div>

              <div style="position: absolute; top: 46%; width: 100%; text-align: center; display: flex; justify-content: center;">
                <div style="background-color: rgba(253, 251, 246, 0.95); border: 2px solid #0F9D7A; border-radius: 14px; padding: 12px 60px; font-size: 42px; font-weight: 900; color: #0F9D7A; min-width: 350px;">
                  ${student.name}
                </div>
              </div>

              <div style="position: absolute; top: 58%; width: 100%; text-align: center;">
                ${reasonText ? `<p style="font-size: 22px; color: #2c3e50; font-weight: bold; line-height: 1.6; margin: 0; padding: 0 10%;">${reasonText.replace(/\n/g, '<br>')}</p>` : ''}
              </div>

              <div style="position: absolute; top: 67%; width: 100%; display: flex; justify-content: center;">
                ${rewardAmount ? `
                  <div style="display: inline-flex; align-items: center; gap: 8px;">
                    <div style="font-size: 38px; line-height: 1;">💰</div>
                    <div style="background-color: #d4af37; border-radius: 30px; padding: 6px 30px; color: #fff; font-weight: 900; font-size: 24px; border: 1px solid #b58d22;">
                      مكافأة: ${rewardAmount} جنيهاً
                    </div>
                  </div>
                ` : ''}
              </div>

              <div style="position: absolute; bottom: 4%; right: 12%; text-align: center; color: #1e293b; width: 200px;">
                <div style="font-weight: 800; font-size: 20px; color: #1c2b4d;">${appState.settings.teacherName}</div>
              </div>

              <div style="position: absolute; bottom: 4%; left: 12%; text-align: center; color: #1e293b; width: 200px;">
                <div style="font-weight: 800; font-size: 20px; color: #1c2b4d;">إدارة حلقات الصحبة</div>
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
    setTimeout(async () => {
        await exportElementAsImage(el, "certificate.png");
    }, 400); 
  };

  window.exportCertificatePdf = async function () {
    const el = document.getElementById("certificate-box");
    if (!el) return;
    setTimeout(async () => {
        await exportElementAsPdf(el, "certificate.pdf");
    }, 400);
  };

  window.exportCertificateGif = async function () {
    const el = document.getElementById("certificate-box");
    if (!el) return;
    setTimeout(async () => {
        await exportElementAsGif(el, "certificate.gif");
    }, 400);
  };

  // ==========================================
  // صفحة التحليل الرئيسية
  // ==========================================
  window.renderAnalysisPage = function () {
    const ctx = computeAnalysisContext();
    const {
      selectedId, student, mode, canToggleMode, hasNoPackage,
      month, year, quranLimit, islamicLimit, packageLimit, minThreshold,
      quranMonthSessions, islamicMonthSessions,
      executedCount, avgRating, status, showReward,
    } = ctx;

    const monthLabel = new Date(year, month, 1).toLocaleDateString("ar-EG", { month: "long", year: "numeric" });

    const header = `
      <div class="d-flex align-items-center gap-3 mb-5">
        <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--emerald-bg);display:flex;align-items:center;justify-content:center;">
          <i class="ph-duotone ph-chart-line-up" style="font-size: 20px; color: var(--emerald)"></i>
        </div>
        <div>
          <div style="font-weight:var(--fw-bold);font-size:var(--fs-lg);color:var(--text-primary);">تحليل الأداء</div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted);">تحليل شهر ${monthLabel}</div>
        </div>
      </div>
    `;

    const modeButtons = canToggleMode
      ? `
        <div class="d-flex gap-2">
          <button class="btn ${mode === "quran" ? "btn-primary" : "btn-outline"}" onclick="setAnalysisMode('quran')">تحليل قرآن</button>
          <button class="btn ${mode === "islamic" ? "btn-primary" : "btn-outline"}" onclick="setAnalysisMode('islamic')">تحليل تربية</button>
        </div>
      `
      : `
        <div class="d-flex align-items-center px-3" style="font-size:13px;font-weight:700;color:var(--text-muted);white-space:nowrap;">
          ${mode === "quran" ? "📖 تحليل القرآن" : "🕌 تحليل التربية"}
        </div>
      `;

    const selectorRow = `
      <div class="card-soft mb-4">
        <div class="d-flex gap-3" style="flex-wrap:wrap;">
          <select class="form-select" style="flex:1;min-width:180px;" onchange="setAnalysisStudent(this.value)">
            <option value="all" ${selectedId === "all" ? "selected" : ""}>جميع الطلاب</option>
            ${appState.students.map((s) => `<option value="${s.id}" ${s.id === selectedId ? "selected" : ""}>${s.name}</option>`).join("")}
          </select>
          ${modeButtons}
        </div>
      </div>
    `;

    // ==========================================
    // حالة عدم وجود باقة على الإطلاق لهذا الطالب
    // ==========================================
    if (student && hasNoPackage) {
      return `
        <div>
          ${header}
          ${selectorRow}
          <div class="alert alert-info d-flex align-items-center mb-4" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: var(--text-primary); border-radius: 12px; padding: 16px;">
            <i class="ph-duotone ph-warning" style="font-size: 24px; color: #f59e0b; margin-left: 12px;"></i>
            <div>
              <h6 style="margin: 0 0 4px; font-weight: bold; font-size: 15px;">لم يتم تحديد باقة لهذا الطالب</h6>
              <p style="margin: 0; font-size: 13px; color: var(--text-muted);">برجاء تحديد عدد حلقات القرآن أو التربية الشهرية من ملف الطالب حتى يظهر التحليل هنا.</p>
            </div>
          </div>
        </div>
      `;
    }

    // ==========================================
    // حالة عدم وجود جلسات مسجلة هذا الشهر لهذا القسم
    // ==========================================
    if (executedCount === 0) {
      return `
        <div>
          ${header}
          ${selectorRow}

          <div class="alert alert-info d-flex align-items-center mb-4" style="background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.2); color: var(--text-primary); border-radius: 12px; padding: 16px;">
            <i class="ph-duotone ph-info" style="font-size: 24px; color: #0ea5e9; margin-left: 12px;"></i>
            <div>
              <h6 style="margin: 0 0 4px; font-weight: bold; font-size: 15px;">لا توجد بيانات متاحة حالياً</h6>
              <p style="margin: 0; font-size: 13px; color: var(--text-muted);">لا توجد حلقات ${mode === "quran" ? "قرآن" : "تربية"} مسجلة ${student ? `للطالب ${student.name}` : ""} خلال ${monthLabel} حتى الآن.</p>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-4);margin-bottom:var(--sp-5);">
            <div class="card-soft" style="text-align:center;padding:var(--sp-4); opacity: 0.6; pointer-events: none;">
              <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--text-muted);">${student ? packageLimit : "-"}</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">باقة الشهر</div>
            </div>
            <div class="card-soft" style="text-align:center;padding:var(--sp-4); opacity: 0.6; pointer-events: none;">
              <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--text-muted);">0</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">الحلقات المنفذة</div>
            </div>
            <div class="card-soft" style="text-align:center;padding:var(--sp-4); opacity: 0.6; pointer-events: none;">
              <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--text-muted);">${student ? (minThreshold === 0 ? "مباشر" : minThreshold) : "-"}</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">الحد الأدنى للتحليل</div>
            </div>
            <div class="card-soft" style="text-align:center;padding:var(--sp-4); opacity: 0.6; pointer-events: none;">
              <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--text-muted);">0.0</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">متوسط التقييم</div>
            </div>
          </div>

          <div class="card-soft mb-4 d-flex align-items-center justify-content-center" style="height:260px; border: 1px dashed var(--border-color); background: rgba(0,0,0,0.02);">
            <div class="text-center" style="color: var(--text-muted);">
               <i class="ph-duotone ph-chart-line-up" style="font-size: 48px; opacity: 0.5; margin-bottom: 12px; display: block;"></i>
               <span style="font-size: 14px;">الرسم البياني سيظهر هنا بعد تسجيل الجلسات</span>
            </div>
          </div>
        </div>
      `;
    }

    // ==========================================
    // حالة وجود بيانات
    // ==========================================
    const statusStyles = {
      eligible: { bg: "rgba(15,157,122,0.08)", border: "rgba(15,157,122,0.25)", color: "var(--emerald-dark)" },
      waiting: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", color: "#92400e" },
      low: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", color: "#991b1b" },
    };

    const statusBlock = status ? `
      <div class="d-flex align-items-center mb-4" style="background: ${statusStyles[status.key].bg}; border: 1px solid ${statusStyles[status.key].border}; border-radius: 12px; padding: 16px;">
        <div style="font-size: 26px; margin-left: 12px;">${status.icon}</div>
        <div>
          <h6 style="margin: 0 0 4px; font-weight: bold; font-size: 15px; color: ${statusStyles[status.key].color};">${status.title}</h6>
          <p style="margin: 0; font-size: 13px; color: var(--text-muted);">${status.detail}</p>
        </div>
      </div>
    ` : "";

    // كروت الإحصائيات: بيانات باقة الطالب أو ملخص إجمالي عند اختيار "جميع الطلاب"
    const statCards = student
      ? `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-4);margin-bottom:var(--sp-5);">
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--emerald-dark);">${packageLimit}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">باقة الشهر</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--emerald);">${executedCount}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">الحلقات المنفذة</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:#0B3D2E;">${minThreshold === 0 ? "مباشر" : minThreshold}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">الحد الأدنى للتحليل</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--gold);">${avgRating}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">متوسط التقييم</div>
          </div>
        </div>
      `
      : `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-4);margin-bottom:var(--sp-5);">
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--emerald-dark);">${executedCount}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">إجمالي الجلسات</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--gold);">${avgRating}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">متوسط التقييم</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--emerald);">${quranMonthSessions.length}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">حلقات قرآن</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:#0B3D2E;">${islamicMonthSessions.length}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">حلقات تربية</div>
          </div>
        </div>
      `;

    const certStudio = appState.ui.showCertificate && student ? `
        <div class="certificate-studio-wrapper card-soft mb-4" style="padding: 0; overflow: hidden; display: flex; flex-wrap: wrap; border: 1px solid var(--color-border-strong);">
          
          <div class="studio-sidebar" style="flex: 1 1 250px; max-width: 320px; background: #F8FAFC; border-left: 1px solid var(--color-border); display: flex; flex-direction: column; min-height: 500px;">
            
            <div style="padding: 20px; border-bottom: 1px solid var(--color-border); background: #fff;">
              <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: var(--color-primary-800);">🎨 إعدادات الشهادة</h3>
            </div>

            <div style="padding: 20px; border-bottom: 1px solid var(--color-border); background: #fefce8;">
              <label style="font-size: 13px; font-weight: bold; color: #854d0e; display: block; margin-bottom: 5px;">النص العلوي (المقدمة)</label>
              <textarea class="form-control" style="font-size: 12px; min-height: 50px; margin-bottom: 15px; border-color: #fde047;" placeholder="..." onchange="appState.ui.certIntroText = this.value; router.render();">${appState.ui.certIntroText !== undefined ? appState.ui.certIntroText : getDefaultCertTexts(student).defaultIntro}</textarea>

              <label style="font-size: 13px; font-weight: bold; color: #854d0e; display: block; margin-bottom: 5px;">النص السفلي (سبب التكريم والدعاء)</label>
              <textarea class="form-control" style="font-size: 12px; min-height: 60px; margin-bottom: 15px; border-color: #fde047;" placeholder="..." onchange="appState.ui.certReasonText = this.value; router.render();">${appState.ui.certReasonText !== undefined ? appState.ui.certReasonText : getDefaultCertTexts(student).defaultReason}</textarea>

              <label style="font-size: 13px; font-weight: bold; color: #854d0e; display: block; margin-bottom: 5px;">المكافأة المالية ج.م (اختياري)</label>
              <input type="number" class="form-control" style="border-color: #fde047; font-weight: bold;" placeholder="مثال: 50 (اتركه فارغ للإخفاء)" value="${appState.ui.certRewardAmount || ''}" onchange="appState.ui.certRewardAmount = this.value; router.render();" />
            </div>

            <div style="padding: 20px; border-top: 1px solid var(--color-border); background: #fff; display: flex; flex-direction: column; gap: 10px; margin-top: auto;">
              <button class="btn btn-primary w-100" onclick="exportCertificateImage()"><i class="ph-duotone ph-image" style="margin-left:4px;"></i>تحميل كصورة</button>
              <button class="btn btn-gold w-100" onclick="exportCertificatePdf()"><i class="ph-duotone ph-file-pdf" style="margin-left:4px;"></i>تحميل PDF</button>
              <button class="btn btn-outline-danger w-100" onclick="hideCertificate()">إغلاق الاستوديو</button>
            </div>
          </div>

          <div class="studio-preview" style="flex: 1 1 500px; min-width: 0; padding: 40px 20px; background: #e2e8f0; overflow: auto; display: flex; justify-content: center; align-items: center;">
               ${renderCertificate(student, monthLabel)}
          </div>

        </div>
      ` : "";

    return `
      <div>
        ${header}
        ${selectorRow}
        ${statusBlock}
        ${statCards}

        <div class="card-soft mb-4">
          <div style="font-weight:var(--fw-bold);color:var(--text-primary);margin-bottom:var(--sp-3);">معدل الإنجاز</div>
          <div style="height:260px;">
            <canvas id="analysis-chart"></canvas>
          </div>
        </div>

        ${showReward ? `
          <div class="card-soft mb-4" style="background:var(--emerald-bg);border-color:rgba(15,157,122,0.15);">
            <div style="font-weight:var(--fw-bold);margin-bottom:var(--sp-3);color:var(--emerald-dark);"><i class="ph-duotone ph-confetti" style="margin-left:4px;"></i>أداء متميز</div>
            <button class="btn btn-primary w-100" onclick="showCertificate()">إصدار شهادة تفوق</button>
          </div>
        ` : ""}

        ${certStudio}
      </div>
    `;
  };

  window.initAnalysisPage = function () {
    const canvas = document.getElementById("analysis-chart");
    if (!canvas) return; // تم حل المشكلة هنا: الدالة هتقف لو الشاشة فاضية ومفيش Canvas

    const ctx = computeAnalysisContext();
    const data = buildChartData(ctx.targetSessions);

    if (chartInstance) {
      chartInstance.destroy();
    }

    const chartCtx = canvas.getContext("2d");
    const gradient = chartCtx.createLinearGradient(0, 0, 0, canvas.parentElement.clientHeight);
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
