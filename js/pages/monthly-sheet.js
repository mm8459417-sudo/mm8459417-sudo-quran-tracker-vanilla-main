(function () {
  // ✅ تأمين الـ appState بالكامل لمنع أي أخطاء تمنع فتح الصفحة
  if (typeof appState === "undefined") {
    window.appState = { ui: {}, students: [], sessions: [], tempAdjustments: {} };
  }
  if (!appState.ui) appState.ui = {};
  if (!appState.ui.sheetFilter) appState.ui.sheetFilter = "month"; 
  if (!appState.tempAdjustments) appState.tempAdjustments = {};

  const currentDateObj = new Date();
  if (appState.ui.month === undefined) appState.ui.month = currentDateObj.getMonth() + 1;
  if (appState.ui.year === undefined) appState.ui.year = currentDateObj.getFullYear();

  window.prevMonth = function () {
    if (appState.ui.month === 1) {
      appState.ui.month = 12;
      appState.ui.year -= 1;
    } else {
      appState.ui.month -= 1;
    }
    if (typeof router !== "undefined") router.render();
  };

  window.nextMonth = function () {
    if (appState.ui.month === 12) {
      appState.ui.month = 1;
      appState.ui.year += 1;
    } else {
      appState.ui.month += 1;
    }
    if (typeof router !== "undefined") router.render();
  };

  window.toggleStudentPrint = function(studentId, isChecked) {
    if (!appState.tempAdjustments) appState.tempAdjustments = {};
    if (!appState.tempAdjustments[studentId]) {
      appState.tempAdjustments[studentId] = { quran: 0, islamic: 0, group: 0, individual: 0, printExcluded: false };
    }
    appState.tempAdjustments[studentId].printExcluded = !isChecked; 
    if (typeof router !== "undefined") router.render();
  };

  function buildCounts() {
    const map = {};
    const sessionsList = appState.sessions || [];
    sessionsList.forEach((s) => {
      if (!s.date) return;
      const d = new Date(s.date);
      if (d.getFullYear() === appState.ui.year && d.getMonth() + 1 === appState.ui.month) {
        if (s.mode === "group" && Array.isArray(s.participants)) {
          s.participants
            .filter((p) => p.present !== false && p.attendance !== "absent_excused" && p.attendance !== "absent_unexcused")
            .forEach((p) => {
              map[p.studentId] = (map[p.studentId] || 0) + 1;
            });
        } else if (s.studentId && s.attendance !== "absent_excused" && s.attendance !== "absent_unexcused") {
          map[s.studentId] = (map[s.studentId] || 0) + 1;
        }
      }
    });
    return map;
  }

  window.copyMonthlySheet = function () {
    const counts = buildCounts();
    const studentsList = appState.students || [];
    const teacherName = (appState.settings && appState.settings.teacherName) ? appState.settings.teacherName : "غير محدد";
    const lines = [
      "📋 شيت حضور الحلقات",
      `📅 ${appState.ui.monthNames ? appState.ui.monthNames[appState.ui.month - 1] : appState.ui.month} / ${appState.ui.year}`,
      `المعلم: ${teacherName}`,
      "─────────────────────────",
      ...studentsList
        .filter(s => !(appState.tempAdjustments[s.id] && appState.tempAdjustments[s.id].printExcluded))
        .map((s, i) => {
          const c = counts[s.id] || 0;
          // التوافق الرجعي لحساب الباقة الكلية
          const lim = (s.quranLimit || 0) + (s.islamicLimit || 0) || s.sessionLimit || (appState.settings && appState.settings.defaultLimit) || 12;
          return `${i + 1}. ${s.name}   ${c} / ${lim} حصة`;
        }),
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => typeof showToast === 'function' && showToast("تم نسخ الشيت"))
      .catch(() => typeof showToast === 'function' && showToast("تعذر النسخ"));
  };

  window.adjustTempCount = function(studentId, field, amount) {
    if (!appState.tempAdjustments) appState.tempAdjustments = {};
    if (!appState.tempAdjustments[studentId]) {
      appState.tempAdjustments[studentId] = { quran: 0, islamic: 0, group: 0, individual: 0, printExcluded: false };
    }
    if (typeof appState.tempAdjustments[studentId][field] !== 'number') {
      appState.tempAdjustments[studentId][field] = 0;
    }
    appState.tempAdjustments[studentId][field] += amount;
    
    if (appState.tempAdjustments[studentId][field] < -50) appState.tempAdjustments[studentId][field] = -50; 

    if (typeof router !== "undefined") router.render(); 
  };

  // ==============================================================
  // دوال التصدير والطباعة
  // ==============================================================
  function createCleanTableClone() {
    const originalEl = document.getElementById("monthly-sheet-box");
    if (!originalEl) return null;

    const clone = originalEl.cloneNode(true);
    
    const noPrintElements = clone.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.remove());

    const buttons = clone.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());

    const inputs = clone.querySelectorAll('input[type="checkbox"]');
    inputs.forEach(input => input.remove());

    const rows = clone.querySelectorAll('tr');
    rows.forEach(row => {
        row.style.opacity = '1';
    });

    const container = document.createElement('div');
    container.id = 'temp-export-container';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.background = 'white';
    container.style.padding = '20px';
    container.style.direction = 'rtl';
    container.style.width = '1200px'; 
    
    const teacherName = (appState.settings && appState.settings.teacherName) ? appState.settings.teacherName : "";
    const title = appState.ui.sheetFilter === "month" 
        ? `تقرير شهر ${appState.ui.monthNames ? appState.ui.monthNames[appState.ui.month - 1] : appState.ui.month} لسنة ${appState.ui.year}` 
        : "تقرير آخر 7 أيام";
        
    container.innerHTML = `
        <h2 style="text-align: center; color: #065f46; font-family: 'Cairo', sans-serif; margin-bottom: 5px;">الشيت المالي والحسابات</h2>
        <h4 style="text-align: center; color: #64748b; font-family: 'Cairo', sans-serif; margin-top: 0; margin-bottom: 20px;">${title} | المعلم: ${teacherName}</h4>
    `;
    
    clone.style.width = '100%';
    clone.style.borderCollapse = 'collapse';
    clone.style.fontFamily = "'Cairo', sans-serif";
    
    container.appendChild(clone);
    document.body.appendChild(container);
    
    return container;
  }

  window.exportMonthlySheetImage = async function () {
    const cleanContainer = createCleanTableClone();
    if (!cleanContainer) {
      if (typeof showToast === 'function') showToast("الجدول غير موجود");
      return;
    }

    try {
        if (typeof exportElementAsImage === 'function') {
          await exportElementAsImage(cleanContainer, `sheet-${appState.ui.year}-${appState.ui.month}.png`);
        } else {
          if (typeof showToast === 'function') showToast("خاصية الصورة غير متوفرة حالياً");
        }
    } finally {
        document.body.removeChild(cleanContainer);
    }
  };

  window.exportMonthlySheetPdf = async function () {
    const cleanContainer = createCleanTableClone();
    if (!cleanContainer) {
      if (typeof showToast === 'function') showToast("الجدول غير موجود");
      return;
    }

    try {
        if (typeof exportElementAsPdf === 'function') {
          await exportElementAsPdf(cleanContainer, `sheet-${appState.ui.year}-${appState.ui.month}.pdf`);
        } else {
          if (typeof showToast === 'function') showToast("خاصية PDF غير متوفرة حالياً");
        }
    } finally {
        document.body.removeChild(cleanContainer);
    }
  };

  window.printCustomSheet = function () {
    const cleanContainer = createCleanTableClone();
    if (!cleanContainer) return;
    
    const tableHtml = cleanContainer.innerHTML;
    document.body.removeChild(cleanContainer);
        
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>طباعة الشيت المالي</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
                body { font-family: 'Cairo', Tahoma, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; direction: rtl; }
                th, td { border: 1px solid #cbd5e1; padding: 12px 8px; text-align: center; font-size: 13px; }
                th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; color: #1e293b; font-weight: bold; }
                tr { page-break-inside: avoid; }
                tfoot td { background-color: #065f46 !important; color: white !important; -webkit-print-color-adjust: exact; font-weight: bold; font-size: 15px; }
                .price-col { color: #0f9d7a; font-weight: bold; }
                .no-print, button, input[type="checkbox"] { display: none !important; }
            </style>
        </head>
        <body>
            ${tableHtml}
            <script>
                setTimeout(() => {
                    window.print();
                    window.close();
                }, 500);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
  };

  window.setSheetFilter = function (filter) {
    if (!appState.ui) appState.ui = {};
    appState.ui.sheetFilter = filter;
    if (typeof router !== "undefined") router.render();
  };

  // ==============================================================
  // دالة حساب الشيت الشهري الرئيسية
  // ==============================================================
  window.renderMonthlySheetPage = function () {
    try {
      document.body.classList.add('monthly-active');

      if (!appState.ui) appState.ui = {};
      if (!appState.ui.sheetFilter) {
        appState.ui.sheetFilter = "month"; 
      }

      const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      appState.ui.monthNames = monthNames;

      const sessionsList = appState.sessions || [];
      const studentsList = appState.students || [];
      const packagesList = appState.settings && appState.settings.packages ? appState.settings.packages : [];

      const filteredSessions = sessionsList.filter(s => {
        if (!s.date) return false;
        const d = new Date(s.date);
        if (appState.ui.sheetFilter === "week") {
          const now = new Date();
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return d >= oneWeekAgo && d <= now;
        } else {
          return (d.getMonth() + 1) === appState.ui.month && d.getFullYear() === appState.ui.year;
        }
      });

      let grandTotalAmount = 0;
      let grandTotalCalculatedSessions = 0;
      let grandTotalQuran = 0;
      let grandTotalIslamic = 0;
      let grandTotalIndividual = 0;
      let grandTotalGroup = 0;

      let tableData = studentsList.map(student => {
        const stdSessions = filteredSessions.filter(s => {
          if (s.mode === "individual" || !s.mode) {
            return s.studentId === student.id;
          } else if (s.mode === "group" && Array.isArray(s.participants)) {
            return s.participants.some(p => p.studentId === student.id);
          }
          return false;
        });

        let quranCount = 0;
        let islamicCount = 0;
        let unexcusedAbsenceCount = 0;
        let excusedAbsenceCount = 0;
        let individualCount = 0;
        let groupCount = 0;

        stdSessions.forEach(s => {
          let isPresent = true;
          let attendanceStatus = "present";
          
          if (s.mode === "group" && Array.isArray(s.participants)) {
            const p = s.participants.find(x => x.studentId === student.id);
            if (p && p.present === false) {
              isPresent = false;
              attendanceStatus = p.attendance || "absent_unexcused"; 
            } else if (p && p.attendance && p.attendance !== "present") {
              isPresent = false;
              attendanceStatus = p.attendance;
            }
          } else if (s.attendance && s.attendance !== "present") {
            isPresent = false;
            attendanceStatus = s.attendance;
          }

          if (isPresent) {
            if (s.sessionType === "quran" || s.sessionType === "review") quranCount++;
            if (s.sessionType === "islamic") islamicCount++;
            
            if (s.mode === "group") {
              groupCount++;
            } else {
              individualCount++;
            }
          } else {
            if (attendanceStatus === "absent_excused") {
              excusedAbsenceCount++;
            } else {
              unexcusedAbsenceCount++;
            }
          }
        });

        // قراءة التعديلات اليدوية
        if (!appState.tempAdjustments) appState.tempAdjustments = {};
        const adj = appState.tempAdjustments[student.id] || {};
        const printExcluded = adj.printExcluded || false; 

        // تطبيق التعديلات اليدوية
        quranCount = Math.max(0, quranCount + (adj.quran || 0));
        islamicCount = Math.max(0, islamicCount + (adj.islamic || 0));
        individualCount = Math.max(0, individualCount + (adj.individual || 0));
        groupCount = Math.max(0, groupCount + (adj.group || 0));

        // 🔥 جلب أسعار الباقات المنفصلة (فردي / جماعي)
        const indPkg = packagesList.find(p => p.id === student.individualPackageId);
        const grpPkg = packagesList.find(p => p.id === student.groupPackageId);
        const fallbackPkg = packagesList.find(p => p.id === student.packageId); // للتوافق الرجعي

        let sessionPriceInd = indPkg ? indPkg.price : (fallbackPkg ? fallbackPkg.price : (student.sessionPrice || 70));
        let sessionPriceGrp = grpPkg ? grpPkg.price : (student.groupSessionPrice !== undefined ? student.groupSessionPrice : sessionPriceInd);
        
        const maxAbsenceAllowed = student.maxAbsenceAllowed !== undefined ? student.maxAbsenceAllowed : 1;
        const enableUnexcusedAbsence = student.enableUnexcusedAbsence !== undefined ? student.enableUnexcusedAbsence : true;

        let payableAbsences = 0;
        if (enableUnexcusedAbsence) {
          payableAbsences = Math.max(0, unexcusedAbsenceCount - maxAbsenceAllowed);
        }

        // الحلقات المحتسبة
        let totalCalculatedSessions = individualCount + groupCount + payableAbsences;
        
        // 🔥 حساب الفلوس بدقة: الفردي بسعره + الجماعي بسعره + الغياب بيتحسب بسعر الفردي
        let totalAmount = (individualCount * sessionPriceInd) + (groupCount * sessionPriceGrp) + (payableAbsences * sessionPriceInd);

        if (!printExcluded) {
          grandTotalAmount += totalAmount;
          grandTotalCalculatedSessions += totalCalculatedSessions;
          grandTotalQuran += quranCount;
          grandTotalIslamic += islamicCount;
          grandTotalIndividual += individualCount;
          grandTotalGroup += groupCount;
        }

        return {
          ...student,
          quranCount,
          islamicCount,
          individualCount,
          groupCount,
          unexcusedAbsenceCount,
          excusedAbsenceCount,
          payableAbsences,
          totalCalculatedSessions,
          totalAmount,
          sessionPriceInd,
          sessionPriceGrp,
          enableUnexcusedAbsence,
          printExcluded
        };
      });

      tableData.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

      const tbodyHtml = tableData.length ? tableData.map(row => {
        const isGrpPriceDifferent = row.sessionPriceInd !== row.sessionPriceGrp;
        const priceLabel = isGrpPriceDifferent ? `${row.sessionPriceInd} / ${row.sessionPriceGrp}` : row.sessionPriceInd;

        return `
          <tr class="${row.printExcluded ? 'no-print' : ''}" style="border-bottom: 1px solid var(--color-border); background: var(--card-bg); opacity: ${row.printExcluded ? '0.4' : '1'}; transition: opacity 0.3s ease;">
            
            <td style="padding: 14px 16px; font-weight: bold; color: var(--color-slate-800); text-align: right;">
              <div class="d-flex align-items-center gap-2">
                <input type="checkbox" class="form-check-input no-print" style="width:18px;height:18px;cursor:pointer;margin:0;flex-shrink:0;" ${!row.printExcluded ? 'checked' : ''} onchange="toggleStudentPrint('${row.id}', this.checked)" title="تضمين في الطباعة">
                <div>
                  <i class="ph-bold ph-user" style="margin-left:4px; color:${row.gender === 'girl' ? '#ec4899' : '#10b981'};"></i>${row.name}
                </div>
              </div>
            </td>
            
            <td style="padding: 14px 16px; text-align: center; color: var(--color-slate-600); font-weight: bold;" title="فردي / جماعي">
               <span style="font-size:13px; letter-spacing:1px;">${priceLabel}</span> <span style="font-size:10px; font-weight:normal;">ج</span>
            </td>
            
            <td style="padding: 14px 16px; text-align: center; font-weight: 600;">
              <div>${row.quranCount}</div>
              <div class="no-print" style="display: flex; justify-content: center; gap: 4px; margin-top: 4px;">
                <button type="button" onclick='adjustTempCount("${row.id}", "quran", 1)' style="width: 20px; height: 20px; cursor: pointer; border: none; background: var(--color-slate-200); border-radius: 4px; font-weight:bold; font-size:14px; display:flex; align-items:center; justify-content:center; line-height:1;">+</button>
                <button type="button" onclick='adjustTempCount("${row.id}", "quran", -1)' style="width: 20px; height: 20px; cursor: pointer; border: none; background: var(--color-slate-200); border-radius: 4px; font-weight:bold; font-size:14px; display:flex; align-items:center; justify-content:center; line-height:1;">-</button>
              </div>
            </td>
            
            <td style="padding: 14px 16px; text-align: center; font-weight: 600;">
              <div>${row.islamicCount}</div>
              <div class="no-print" style="display: flex; justify-content: center; gap: 4px; margin-top: 4px;">
                <button type="button" onclick='adjustTempCount("${row.id}", "islamic", 1)' style="width: 20px; height: 20px; cursor: pointer; border: none; background: var(--color-slate-200); border-radius: 4px; font-weight:bold; font-size:14px; display:flex; align-items:center; justify-content:center; line-height:1;">+</button>
                <button type="button" onclick='adjustTempCount("${row.id}", "islamic", -1)' style="width: 20px; height: 20px; cursor: pointer; border: none; background: var(--color-slate-200); border-radius: 4px; font-weight:bold; font-size:14px; display:flex; align-items:center; justify-content:center; line-height:1;">-</button>
              </div>
            </td>
            
            <td style="padding: 14px 16px; text-align: center; color: #64748b;">${row.excusedAbsenceCount}</td>
            <td style="padding: 14px 16px; text-align: center; color: #ef4444; font-weight: bold;">
              ${row.unexcusedAbsenceCount} 
              <span style="font-size:10px; display:block; color:${row.enableUnexcusedAbsence ? '#94a3b8' : '#cbd5e1'}; font-weight:normal;">
                 ${row.enableUnexcusedAbsence ? `(مُحاسب على ${row.payableAbsences})` : '<del>(موقف)</del>'}
              </span>
            </td>
            
            <td style="padding: 14px 16px; text-align: center; color: #0ea5e9; font-weight: 600;">
              <div>${row.individualCount}</div>
              <div class="no-print" style="display: flex; justify-content: center; gap: 4px; margin-top: 4px;">
                <button type="button" onclick='adjustTempCount("${row.id}", "individual", 1)' style="width: 20px; height: 20px; cursor: pointer; border: none; background: #e0f2fe; color: #0284c7; border-radius: 4px; font-weight:bold; font-size:14px; display:flex; align-items:center; justify-content:center; line-height:1;">+</button>
                <button type="button" onclick='adjustTempCount("${row.id}", "individual", -1)' style="width: 20px; height: 20px; cursor: pointer; border: none; background: #e0f2fe; color: #0284c7; border-radius: 4px; font-weight:bold; font-size:14px; display:flex; align-items:center; justify-content:center; line-height:1;">-</button>
              </div>
            </td>
            
            <td style="padding: 14px 16px; text-align: center; color: #6d28d9; font-weight: 600;">
              <div>${row.groupCount}</div>
              <div class="no-print" style="display: flex; justify-content: center; gap: 4px; margin-top: 4px;">
                <button type="button" onclick='adjustTempCount("${row.id}", "group", 1)' style="width: 20px; height: 20px; cursor: pointer; border: none; background: #ede9fe; color: #6d28d9; border-radius: 4px; font-weight:bold; font-size:14px; display:flex; align-items:center; justify-content:center; line-height:1;">+</button>
                <button type="button" onclick='adjustTempCount("${row.id}", "group", -1)' style="width: 20px; height: 20px; cursor: pointer; border: none; background: #ede9fe; color: #6d28d9; border-radius: 4px; font-weight:bold; font-size:14px; display:flex; align-items:center; justify-content:center; line-height:1;">-</button>
              </div>
            </td>
            
            <td style="padding: 14px 16px; text-align: center;">
              <span style="background: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 6px; font-weight: bold;">
                ${row.totalCalculatedSessions}
              </span>
            </td>
            
            <td class="price-col" style="padding: 14px 16px; text-align: center; font-weight: 800; font-size: 15px; color: #0f9d7a;">
              ${row.totalAmount} <span style="font-size: 11px; font-weight: normal; color: #64748b;">ج.م</span>
            </td>
          </tr>
        `;
      }).join("") : `<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">لا توجد بيانات متاحة لهذا الشهر حتى الآن.</td></tr>`;

      return `
        <div style="font-family: 'Cairo', sans-serif;">
          <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
            
            <div class="d-flex align-items-center gap-3">
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(16,185,129,0.1);display:flex;align-items:center;justify-content:center;">
                <i class="ph-duotone ph-wallet" style="font-size: 22px; color: #10b981"></i>
              </div>
              <div>
                <div style="font-weight:800; font-size:18px; color:var(--text-primary);">الشيت المالي والحسابات</div>
                
                <div class="d-flex align-items-center gap-2 mt-1 no-print">
                  <button type="button" onclick="nextMonth()" class="btn btn-light btn-sm" style="padding: 2px 8px; font-weight: bold;" title="الشهر التالي">◀</button>
                  <span style="font-size:13px; font-weight:bold; color: #475569; min-width: 90px; text-align:center; background:#f1f5f9; padding:2px 8px; border-radius:6px;">
                    ${monthNames[appState.ui.month - 1]} ${appState.ui.year}
                  </span>
                  <button type="button" onclick="prevMonth()" class="btn btn-light btn-sm" style="padding: 2px 8px; font-weight: bold;" title="الشهر السابق">▶</button>
                </div>
              </div>
            </div>
            
            <div class="d-flex gap-2 flex-wrap no-print">
              <div style="background: var(--color-slate-100); padding: 4px; border-radius: 8px; display: flex; gap: 4px;">
                <button type="button" onclick="setSheetFilter('month')" style="border: none; background: ${appState.ui.sheetFilter === 'month' ? 'white' : 'transparent'}; color: ${appState.ui.sheetFilter === 'month' ? 'var(--color-slate-800)' : 'var(--color-slate-500)'}; box-shadow: ${appState.ui.sheetFilter === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}; padding: 6px 14px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">
                  حصاد الشهر
                </button>
                <button type="button" onclick="setSheetFilter('week')" style="border: none; background: ${appState.ui.sheetFilter === 'week' ? 'white' : 'transparent'}; color: ${appState.ui.sheetFilter === 'week' ? 'var(--color-slate-800)' : 'var(--color-slate-500)'}; box-shadow: ${appState.ui.sheetFilter === 'week' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}; padding: 6px 14px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">
                  حصاد الأسبوع
                </button>
              </div>
              
              <button type="button" class="btn btn-outline" style="color:#e11d48; border-color:#e11d48;" onclick="exportMonthlySheetPdf()" title="تحميل كملف PDF"><i class="ph-duotone ph-file-pdf"></i></button>
              <button type="button" class="btn btn-outline" style="color:#0284c7; border-color:#0284c7;" onclick="exportMonthlySheetImage()" title="تحميل كصورة"><i class="ph-duotone ph-image"></i></button>
              <button type="button" class="btn btn-outline" style="color:#475569; border-color:#cbd5e1;" onclick="copyMonthlySheet()" title="نسخ الشيت كنص"><i class="ph-duotone ph-copy"></i> نص</button>
              <button type="button" class="btn" style="background:#065f46; color:white; font-weight:bold;" onclick="printCustomSheet()"><i class="ph-duotone ph-printer"></i> طباعة</button>
            </div>
          </div>

          <div class="card-soft" style="padding: 0; overflow-x: auto; border: 1px solid var(--color-border); border-radius: 12px; box-shadow: var(--shadow-sm);">
            <table style="width: 100%; border-collapse: collapse; min-width: 1000px;" id="monthly-sheet-box">
              <thead>
                <tr style="background: var(--color-slate-50); border-bottom: 2px solid var(--color-border-strong);">
                  <th style="padding: 16px; text-align: right; color: var(--color-slate-700); font-size: 13px; font-weight: bold;">الطالب</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-700); font-size: 13px; font-weight: bold;">سعر الحلقة</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-700); font-size: 13px; font-weight: bold;">قرآن</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-700); font-size: 13px; font-weight: bold;">تربية</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-700); font-size: 13px; font-weight: bold;">غياب بعذر</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-700); font-size: 13px; font-weight: bold;">غياب بدون عذر</th>
                  <th style="padding: 16px; text-align: center; color: #0284c7; font-size: 13px; font-weight: bold;">حلقات فردية</th>
                  <th style="padding: 16px; text-align: center; color: #6d28d9; font-size: 13px; font-weight: bold;">حلقات جماعية</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-700); font-size: 13px; font-weight: bold;">مُحاسب على</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-700); font-size: 13px; font-weight: bold;">الإجمالي المالي</th>
                </tr>
              </thead>
              <tbody>
                ${tbodyHtml}
              </tbody>
              ${tableData.length > 0 ? `
                <tfoot style="background: #065f46; color: white;">
                  <tr style="font-weight: bold;">
                    <td colspan="2" style="padding: 16px; text-align: right; font-size: 14px;">الإجمالي الكلي (للمفعلين فقط):</td>
                    <td style="padding: 16px; text-align: center;">${grandTotalQuran}</td>
                    <td style="padding: 16px; text-align: center;">${grandTotalIslamic}</td>
                    <td style="padding: 16px; text-align: center;">-</td>
                    <td style="padding: 16px; text-align: center;">-</td>
                    <td style="padding: 16px; text-align: center; color:#bae6fd;">${grandTotalIndividual}</td>
                    <td style="padding: 16px; text-align: center; color:#ddd6fe;">${grandTotalGroup}</td>
                    <td style="padding: 16px; text-align: center; font-size: 15px; color: #a7f3d0;">${grandTotalCalculatedSessions}</td>
                    <td style="padding: 16px; text-align: center; font-size: 17px; color: #fde047;">${grandTotalAmount} ج.م</td>
                  </tr>
                </tfoot>
              ` : ''}
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      console.error("Sheet Render Error:", err);
      return `<div style="padding: 40px; color: #ef4444; text-align: center; background: #fee2e2; border-radius: 8px; margin: 20px; direction:rtl;">
         <h3 style="margin-bottom:10px;">عذراً، حدث خطأ أثناء تحميل الشيت المالي</h3>
         <p>${err.message}</p>
      </div>`;
    }
  };

  window.initMonthlySheetPage = function () {
    return;
  };
})();
