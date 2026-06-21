(function () {
  // ✅ تأمين الـ appState بالكامل لمنع أي أخطاء تمنع فتح الصفحة
  if (typeof appState === "undefined") {
    window.appState = { ui: {}, students: [], sessions: [], tempAdjustments: {} };
  }
  if (!appState.ui) appState.ui = {};
  if (!appState.ui.sheetFilter) appState.ui.sheetFilter = "month"; 
  if (!appState.tempAdjustments) appState.tempAdjustments = {};

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

  function buildCounts() {
    const map = {};
    const sessionsList = appState.sessions || [];
    sessionsList.forEach((s) => {
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
    const studentsList = appState.students || [];
    const teacherName = (appState.settings && appState.settings.teacherName) ? appState.settings.teacherName : "غير محدد";
    const lines = [
      "📋 شيت حضور حلقة القرآن الكريم",
      `📅 ${typeof formatMonthLabel === 'function' ? formatMonthLabel(appState.ui.year, appState.ui.month) : `${appState.ui.month}/${appState.ui.year}`}`,
      `المعلم: ${teacherName}`,
      "─────────────────────────",
      ...studentsList.map((s, i) => {
        const c = counts[s.id] || 0;
        const lim = s.sessionLimit || (appState.settings && appState.settings.defaultLimit) || 12;
        return `${i + 1}. ${s.name}   ${c} / ${lim} حصة`;
      }),
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => typeof showToast === 'function' && showToast("تم نسخ الشيت"))
      .catch(() => typeof showToast === 'function' && showToast("تعذر النسخ"));
  };

  window.exportMonthlySheetPdf = async function () {
    const el = document.getElementById("monthly-sheet-box");
    if (!el) {
      if (typeof showToast === 'function') showToast("الجدول غير موجود");
      return;
    }
    if (typeof exportElementAsPdf === 'function') {
      await exportElementAsPdf(el, `sheet-${appState.ui.year}-${appState.ui.month}.pdf`);
    } else {
      if (typeof showToast === 'function') showToast("خاصية PDF غير متوفرة حالياً");
    }
  };

  window.exportMonthlySheetImage = async function () {
    const el = document.getElementById("monthly-sheet-box");
    if (!el) return;
    if (typeof exportElementAsImage === 'function') {
      await exportElementAsImage(el, `sheet-${appState.ui.year}-${appState.ui.month}.png`);
    } else {
      if (typeof showToast === 'function') showToast("خاصية الصورة غير متوفرة حالياً");
    }
  };

  window.adjustTempCount = function(studentId, field, amount) {
    if (!appState.tempAdjustments) appState.tempAdjustments = {};
    if (!appState.tempAdjustments[studentId]) {
      appState.tempAdjustments[studentId] = { quran: 0, calc: 0 };
    }
    if (typeof appState.tempAdjustments[studentId][field] !== 'number') {
      appState.tempAdjustments[studentId][field] = 0;
    }
    appState.tempAdjustments[studentId][field] += amount;
    if (typeof router !== "undefined") router.render(); 
  };

  window.printCustomSheet = function () {
    const el = document.getElementById("monthly-sheet-box");
    if (!el) return;
    const tableHtml = el.outerHTML;
    const title = appState.ui.sheetFilter === "month" 
        ? `تقرير شهر ${appState.ui.monthNames ? appState.ui.monthNames[appState.ui.month - 1] : appState.ui.month} لسنة ${appState.ui.year}` 
        : "تقرير آخر 7 أيام";
        
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>طباعة الشيت المالي</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
                h2 { text-align: center; color: #065f46; margin-bottom: 5px; }
                h4 { text-align: center; color: #64748b; margin-top: 0; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; direction: rtl; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-size: 14px; }
                th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; color: #1e293b; font-weight: bold; }
                tr { page-break-inside: avoid; }
                .group-label { font-size: 11px; color: #0284c7; display: block; margin-top: 4px; }
                tfoot td { background-color: #065f46 !important; color: white !important; -webkit-print-color-adjust: exact; font-weight: bold; font-size: 16px; }
                .price-col { color: #0f9d7a; font-weight: bold; }
                .no-print { display: none !important; }
            </style>
        </head>
        <body>
            <h2>الشيت المالي والحسابات</h2>
            <h4>${title}</h4>
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

  window.renderMonthlySheetPage = function () {
    try {
      document.body.classList.add('monthly-active');

      if (!appState.ui) appState.ui = {};
      if (!appState.ui.sheetFilter) {
        appState.ui.sheetFilter = "month"; 
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      appState.ui.monthNames = monthNames;

      const sessionsList = appState.sessions || [];
      const studentsList = appState.students || [];

      // 1. تصفية الجلسات
      const filteredSessions = sessionsList.filter(s => {
        if (!s.date) return false;
        const d = new Date(s.date);
        
        if (appState.ui.sheetFilter === "week") {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return d >= oneWeekAgo && d <= now;
        } else {
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }
      });

      let grandTotalAmount = 0;
      let grandTotalCalculatedSessions = 0;
      let grandTotalQuran = 0;
      let grandTotalIslamic = 0;

      // 2. تجهيز بيانات الطلاب
      let tableData = studentsList.map(student => {
        const stdSessions = filteredSessions.filter(s => {
          if (s.mode === "individual") {
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

        stdSessions.forEach(s => {
          let isPresent = true;
          let attendanceStatus = "present";
          
          if (s.mode === "group" && Array.isArray(s.participants)) {
              const p = s.participants.find(x => x.studentId === student.id);
              if (p && p.present === false) {
                  isPresent = false;
                  attendanceStatus = "absent_unexcused"; 
              }
          } else if (s.attendance && s.attendance !== "present") {
              isPresent = false;
              attendanceStatus = s.attendance;
          }

          if (isPresent) {
            if (s.sessionType === "quran" || s.sessionType === "review") quranCount++;
            if (s.sessionType === "islamic") islamicCount++;
          } else {
            if (attendanceStatus === "absent_excused") {
              excusedAbsenceCount++;
            } else {
              unexcusedAbsenceCount++;
            }
          }
        });

        if (!appState.tempAdjustments) appState.tempAdjustments = {};
        const adj = appState.tempAdjustments[student.id] || {};
        const adjQuran = typeof adj.quran === 'number' ? adj.quran : 0;
        const adjCalc = typeof adj.calc === 'number' ? adj.calc : 0;

        quranCount += adjQuran;

        const totalAttended = quranCount + islamicCount;
        const sessionPrice = student.sessionPrice || 70;
        const maxAbsenceAllowed = student.maxAbsenceAllowed !== undefined ? student.maxAbsenceAllowed : 1;
        const groupName = student.group || "فردي (بدون مجموعة)";

        // 🔴 التعديل السحري: قراءة زر تفعيل الغياب الخاص بالطالب (أو تفعيله افتراضياً)
        const enableUnexcusedAbsence = student.enableUnexcusedAbsence !== undefined ? student.enableUnexcusedAbsence : true;

        // 🔴 حساب الغياب المحاسب عليه بناءً على التفعيل
        let payableAbsences = 0;
        if (enableUnexcusedAbsence) {
            payableAbsences = Math.max(0, unexcusedAbsenceCount - maxAbsenceAllowed);
        }

        let totalCalculatedSessions = totalAttended + payableAbsences;
        
        totalCalculatedSessions += adjCalc; 

        const totalAmount = totalCalculatedSessions * sessionPrice;

        grandTotalAmount += totalAmount;
        grandTotalCalculatedSessions += totalCalculatedSessions;
        grandTotalQuran += quranCount;
        grandTotalIslamic += islamicCount;

        return {
          ...student,
          groupName,
          quranCount,
          islamicCount,
          totalAttended,
          unexcusedAbsenceCount,
          excusedAbsenceCount,
          payableAbsences,
          totalCalculatedSessions,
          totalAmount,
          sessionPrice,
          enableUnexcusedAbsence // تمرير حالة الزرار عشان نظهرها في الجدول
        };
      });

      // 3. ترتيب الطلاب
      tableData.sort((a, b) => {
        if (a.groupName.includes("فردي") && !b.groupName.includes("فردي")) return 1;
        if (!a.groupName.includes("فردي") && b.groupName.includes("فردي")) return -1;
        return a.groupName.localeCompare(b.groupName, 'ar');
      });

      // 4. الألوان
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
              ${!row.groupName.includes("فردي") ? `<span class="group-label" style="font-size: 11px; color: var(--color-primary-600); background: rgba(255,255,255,0.6); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.05); display: inline-block; margin-top: 4px;">(مجموعة: ${row.groupName})</span>` : ''}
            </td>
            <td style="padding: 16px; text-align: center; color: var(--color-slate-600); font-weight: bold;">
               ${row.sessionPrice} <span style="font-size:10px;">ج.م</span>
            </td>

            <td style="padding: 16px; text-align: center;">
              <div style="font-size: 15px;">${row.quranCount}</div>
              <div class="no-print" style="display: flex; justify-content: center; gap: 4px; margin-top: 6px;">
                <button onclick='adjustTempCount("${row.id}", "quran", 1)' style="width: 22px; height: 22px; cursor: pointer; border: none; background: #cbd5e1; border-radius: 4px; display:flex; align-items:center; justify-content:center; font-weight:bold;">+</button>
                <button onclick='adjustTempCount("${row.id}", "quran", -1)' style="width: 22px; height: 22px; cursor: pointer; border: none; background: #cbd5e1; border-radius: 4px; display:flex; align-items:center; justify-content:center; font-weight:bold;">-</button>
              </div>
            </td>

            <td style="padding: 16px; text-align: center;">${row.islamicCount}</td>
            <td style="padding: 16px; text-align: center; color: #64748b;">${row.excusedAbsenceCount}</td>
            
            <td style="padding: 16px; text-align: center; color: #ef4444; font-weight: bold;">
              ${row.unexcusedAbsenceCount} 
              <br>
              <span style="font-size:10px; color:${row.enableUnexcusedAbsence !== false ? '#94a3b8' : '#cbd5e1'}; font-weight:normal;">
                 ${row.enableUnexcusedAbsence !== false 
                    ? `(مُحاسب على ${row.payableAbsences})` 
                    : '<del>(غير مُفعل)</del>'}
              </span>
            </td>

            <td style="padding: 16px; text-align: center;">
              <span style="background: var(--color-slate-100); padding: 4px 10px; border-radius: 6px; font-weight: bold; color: #0284c7;">
                ${row.totalCalculatedSessions}
              </span>
              <div class="no-print" style="display: flex; justify-content: center; gap: 4px; margin-top: 6px;">
                <button onclick='adjustTempCount("${row.id}", "calc", 1)' style="width: 22px; height: 22px; cursor: pointer; border: none; background: #bae6fd; color: #0369a1; border-radius: 4px; display:flex; align-items:center; justify-content:center; font-weight:bold;">+</button>
                <button onclick='adjustTempCount("${row.id}", "calc", -1)' style="width: 22px; height: 22px; cursor: pointer; border: none; background: #bae6fd; color: #0369a1; border-radius: 4px; display:flex; align-items:center; justify-content:center; font-weight:bold;">-</button>
              </div>
            </td>

            <td class="price-col" style="padding: 16px; text-align: center; font-weight: 900; font-size: 16px; color: #0f9d7a;">
              ${row.totalAmount} <span style="font-size: 12px; font-weight: normal; color: #64748b;">ج.م</span>
            </td>
          </tr>
        `;
      }).join("") : `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">لا توجد بيانات لهذه الفترة حتى الآن.</td></tr>`;

      // 6. عرض الصفحة
      return `
        <div>
          <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
            <div class="d-flex align-items-center gap-3">
              <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--emerald-bg);display:flex;align-items:center;justify-content:center;">
                <i class="ph-duotone ph-wallet" style="font-size: 20px; color: var(--emerald)"></i>
              </div>
              <div>
                <div style="font-weight:var(--fw-bold);font-size:var(--fs-lg);color:var(--text-primary);">الشيت المالي والحسابات</div>
                <div style="font-size:var(--fs-xs);color:var(--text-muted);">
                  ${appState.ui.sheetFilter === "month" ? `تقرير شهر ${monthNames[currentMonth]} ${currentYear}` : "تقرير آخر 7 أيام"}
                </div>
              </div>
            </div>
            
            <div class="d-flex gap-2 flex-wrap">
              <div style="background: var(--color-slate-100); padding: 4px; border-radius: 8px; display: flex; gap: 4px;">
                <button onclick="setSheetFilter('month')" style="border: none; background: ${appState.ui.sheetFilter === 'month' ? 'white' : 'transparent'}; color: ${appState.ui.sheetFilter === 'month' ? 'var(--color-slate-800)' : 'var(--color-slate-500)'}; box-shadow: ${appState.ui.sheetFilter === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s;">
                  حصاد الشهر
                </button>
                <button onclick="setSheetFilter('week')" style="border: none; background: ${appState.ui.sheetFilter === 'week' ? 'white' : 'transparent'}; color: ${appState.ui.sheetFilter === 'week' ? 'var(--color-slate-800)' : 'var(--color-slate-500)'}; box-shadow: ${appState.ui.sheetFilter === 'week' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s;">
                  حصاد الأسبوع
                </button>
              </div>
              
              <button class="btn btn-outline" style="color:#e11d48; border-color:#e11d48;" onclick="exportMonthlySheetPdf()" title="تحميل كملف PDF"><i class="ph-duotone ph-file-pdf"></i></button>
              <button class="btn btn-outline" style="color:#0284c7; border-color:#0284c7;" onclick="exportMonthlySheetImage()" title="تحميل كصورة"><i class="ph-duotone ph-image"></i></button>
              <button class="btn" style="background:#065f46; color:white;" onclick="printCustomSheet()"><i class="ph-duotone ph-printer"></i> طباعة</button>
            </div>
          </div>

          <div class="card-soft" style="padding: 0; overflow-x: auto; border: 1px solid var(--color-border); border-radius: 12px;">
            <table style="width: 100%; border-collapse: collapse; min-width: 900px;" id="monthly-sheet-box">
              <thead>
                <tr style="background: var(--color-slate-50); border-bottom: 2px solid var(--color-border-strong);">
                  <th style="padding: 16px; text-align: right; color: var(--color-slate-600); font-size: 13px;">الطالب / المجموعة</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">سعر الحلقة</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">حضور قرآن</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">حضور تربية</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">غياب (بعذر)</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">غياب (بدون عذر)</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">الحلقات المُحاسبة</th>
                  <th style="padding: 16px; text-align: center; color: var(--color-slate-600); font-size: 13px;">الإجمالي المالي</th>
                </tr>
              </thead>
              <tbody>
                ${tbodyHtml}
              </tbody>
              ${tableData.length > 0 ? `
                <tfoot style="background: #065f46; color: white;">
                  <tr>
                    <td colspan="2" style="padding: 16px; font-weight: bold; text-align: right; font-size: 15px;">الإجمالي الكلي:</td>
                    <td style="padding: 16px; text-align: center; font-weight: bold;">${grandTotalQuran}</td>
                    <td style="padding: 16px; text-align: center; font-weight: bold;">${grandTotalIslamic}</td>
                    <td style="padding: 16px; text-align: center; font-weight: bold;">-</td>
                    <td style="padding: 16px; text-align: center; font-weight: bold;">-</td>
                    <td style="padding: 16px; text-align: center; font-weight: 900; font-size: 16px; color: #a7f3d0;">${grandTotalCalculatedSessions}</td>
                    <td style="padding: 16px; text-align: center; font-weight: 900; font-size: 18px; color: #fde047;">${grandTotalAmount} ج.م</td>
                  </tr>
                </tfoot>
              ` : ''}
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      console.error("Sheet Render Error:", err);
      // ظهور رسالة واضحة في الصفحة لو حصلت مشكلة بدل ما تقف تماماً
      return `<div style="padding: 40px; color: #ef4444; text-align: center; background: #fee2e2; border-radius: 8px; margin: 20px;">
         <h3 style="margin-bottom:10px;">عذراً، حدث خطأ أثناء تحميل الشيت</h3>
         <p>${err.message}</p>
      </div>`;
    }
  };

  window.initMonthlySheetPage = function () {
    return;
  };
})();
