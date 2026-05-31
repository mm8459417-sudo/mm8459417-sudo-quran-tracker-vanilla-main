(function () {
  window.prevMonth = function () {
    if (appState.ui.month === 1) {
      appState.ui.month = 12;
      appState.ui.year -= 1;
    } else {
      appState.ui.month -= 1;
    }
    router.render();
  };

  window.nextMonth = function () {
    if (appState.ui.month === 12) {
      appState.ui.month = 1;
      appState.ui.year += 1;
    } else {
      appState.ui.month += 1;
    }
    router.render();
  };

  function buildCounts() {
    const map = {};
    appState.sessions.forEach((s) => {
      if (!s.date) return;
      const d = new Date(s.date);
      if (d.getFullYear() === appState.ui.year && d.getMonth() + 1 === appState.ui.month) {
        if (s.mode === "group" && Array.isArray(s.participants)) {
          s.participants
            .filter((p) => p.present !== false)
            .forEach((p) => {
              map[p.studentId] = (map[p.studentId] || 0) + 1;
            });
        } else if (s.studentId) {
          map[s.studentId] = (map[s.studentId] || 0) + 1;
        }
      }
    });
    return map;
  }

  window.copyMonthlySheet = function () {
    const counts = buildCounts();
    const lines = [
      "📋 شيت حضور حلقة القرآن الكريم",
      `📅 ${formatMonthLabel(appState.ui.year, appState.ui.month)}`,
      `المعلم: ${appState.settings.teacherName}`,
      "─────────────────────────",
      ...appState.students.map((s, i) => {
        const c = counts[s.id] || 0;
        const lim = s.sessionLimit || appState.settings.defaultLimit || 12;
        return `${i + 1}. ${s.name}   ${c} / ${lim} حصة`;
      }),
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => showToast("تم نسخ الشيت"))
      .catch(() => showToast("تعذر النسخ"));
  };

  window.exportMonthlySheetPdf = async function () {
    const el = document.getElementById("monthly-sheet-box");
    if (!el) return;
    await exportElementAsPdf(el, `sheet-${appState.ui.year}-${appState.ui.month}.pdf`);
  };

  window.exportMonthlySheetImage = async function () {
    const el = document.getElementById("monthly-sheet-box");
    if (!el) return;
    await exportElementAsImage(el, `sheet-${appState.ui.year}-${appState.ui.month}.png`);
  };

  window.renderMonthlySheetPage = function () {
  document.body.classList.add('monthly-active');

  // 1. تحديد الشهر الحالي لجلب بياناته
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  // تصفية الجلسات لتشمل هذا الشهر فقط
  const monthSessions = appState.sessions.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // 2. تجهيز بيانات الطلاب والعمليات الحسابية
  let tableData = appState.students.map(student => {
    const stdSessions = monthSessions.filter(s => s.participant && s.participant.id === student.id);

    let quranCount = 0;
    let islamicCount = 0;
    let unexcusedAbsenceCount = 0;

    // حساب الحضور والغياب من الجلسات (بافتراض وجود خاصية attendance في الجلسة)
    stdSessions.forEach(s => {
      // لو مسجل حضور أو مفيش حالة غياب صريحة بنعتبره حاضر
      if (!s.attendance || s.attendance === "present") {
        if (s.sessionType === "quran" || s.sessionType === "review") quranCount++;
        if (s.sessionType === "islamic") islamicCount++;
      } else if (s.attendance === "absent_unexcused" || s.attendance === "absent") {
        // غياب بدون عذر
        unexcusedAbsenceCount++;
      }
    });

    const totalAttended = quranCount + islamicCount;
    
    // إعدادات الطالب المالية (بأرقام افتراضية لو مش متسجلة في بياناته)
    const sessionPrice = student.sessionPrice || 70; // سعر الجلسة
    const maxAbsenceAllowed = student.maxAbsenceAllowed || 1; // الحد الأقصى للغياب المجاني
    const groupName = student.group || "فردي (بدون مجموعة)"; // اسم المجموعة

    // حساب الحلقات المستحقة الدفع (الغياب اللي فوق الحد الأقصى)
    const payableAbsences = Math.max(0, unexcusedAbsenceCount - maxAbsenceAllowed);
    const totalCalculatedSessions = totalAttended + payableAbsences;
    const totalAmount = totalCalculatedSessions * sessionPrice;

    // حساب متوسط التقييم
    const ratedSessions = stdSessions.filter(s => (!s.attendance || s.attendance === "present") && s.participant.overall);
    const avgRating = ratedSessions.length ? (ratedSessions.reduce((sum, s) => sum + s.participant.overall, 0) / ratedSessions.length).toFixed(1) : "-";

    return {
      ...student,
      groupName,
      quranCount,
      islamicCount,
      totalAttended,
      unexcusedAbsenceCount,
      payableAbsences,
      totalCalculatedSessions,
      totalAmount,
      avgRating,
      sessionPrice
    };
  });

  // 3. ترتيب الطلاب حسب المجموعات
  tableData.sort((a, b) => {
    if (a.groupName.includes("فردي") && !b.groupName.includes("فردي")) return 1;
    if (!a.groupName.includes("فردي") && b.groupName.includes("فردي")) return -1;
    return a.groupName.localeCompare(b.groupName, 'ar');
  });

  // 4. توليد ألوان مميزة لكل مجموعة أوتوماتيكياً
  const groupColors = { "فردي (بدون مجموعة)": "transparent" };
  const pastelPalette = ["#e0f2fe", "#fce7f3", "#fef3c7", "#dcfce7", "#f3e8ff", "#ffedd5"];
  let colorIndex = 0;
  
  tableData.forEach(row => {
    if (!groupColors[row.groupName]) {
      groupColors[row.groupName] = pastelPalette[colorIndex % pastelPalette.length];
      colorIndex++;
    }
  });

  // 5. بناء صفوف الجدول
  const tbodyHtml = tableData.length ? tableData.map(row => {
    const rowBgColor = groupColors[row.groupName];
    return `
      <tr style="background-color: ${rowBgColor}; border-bottom: 1px solid var(--color-border);">
        <td style="padding: 16px; font-weight: bold; color: var(--color-slate-800);">
          ${row.name} 
          ${!row.groupName.includes("فردي") ? `<br><span style="font-size: 11px; color: var(--color-primary-600); background: rgba(255,255,255,0.6); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.05);">(مجموعة: ${row.groupName})</span>` : ''}
        </td>
        <td style="padding: 16px; text-align: center;">${row.quranCount}</td>
        <td style="padding: 16px; text-align: center;">${row.islamicCount}</td>
        <td style="padding: 16px; text-align: center; color: #ef4444; font-weight: bold;">
          ${row.unexcusedAbsenceCount} <span style="font-size:11px; color:#94a3b8; font-weight:normal;">(مُحاسب على ${row.payableAbsences})</span>
        </td>
        <td style="padding: 16px; text-align: center;">
          <span style="background: var(--color-slate-100); padding: 4px 10px; border-radius: 6px; font-weight: bold;">
            ${row.totalCalculatedSessions}
          </span>
        </td>
        <td style="padding: 16px; text-align: center; color: var(--gold); font-weight: bold;">
          <i class="ph-fill ph-star" style="margin-left: 2px;"></i>${row.avgRating}
        </td>
        <td style="padding: 16px; text-align: center; font-weight: 900; font-size: 16px; color: #0f9d7a;">
          ${row.totalAmount} <span style="font-size: 12px; font-weight: normal; color: #64748b;">ج.م</span>
        </td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">لا توجد بيانات لهذا الشهر حتى الآن.</td></tr>`;

  // 6. عرض الصفحة بالكامل
  return `
    <div>
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div class="d-flex align-items-center gap-3">
          <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--emerald-bg);display:flex;align-items:center;justify-content:center;">
            <i class="ph-duotone ph-wallet" style="font-size: 20px; color: var(--emerald)"></i>
          </div>
          <div>
            <div style="font-weight:var(--fw-bold);font-size:var(--fs-lg);color:var(--text-primary);">الشيت الشهري والحسابات</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);">تقرير شهر ${monthNames[currentMonth]} ${currentYear}</div>
          </div>
        </div>
        <div>
          <button class="btn btn-outline" onclick="window.print()"><i class="ph-duotone ph-printer"></i> طباعة التقرير</button>
        </div>
      </div>

      <div class="card-soft" style="padding: 0; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
          <thead>
            <tr style="background: var(--color-slate-50); border-bottom: 2px solid var(--color-border-strong);">
              <th style="padding: 16px; text-align: right; color: var(--color-slate-600); font-size: 13px;">اسم الطالب / المجموعة</th>
              <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">حلقات قرآن</th>
              <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">حلقات تربية</th>
              <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">الغياب (الزائد)</th>
              <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">إجمالي الحلقات المُحاسب عليها</th>
              <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">متوسط التقييم</th>
              <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">الإجمالي المالي</th>
            </tr>
          </thead>
          <tbody>
            ${tbodyHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
};
  window.initMonthlySheetPage = function () {
    return;
  };
})();
