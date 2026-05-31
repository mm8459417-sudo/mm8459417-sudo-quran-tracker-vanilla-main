(function () {
  // حالة فلتر الشيت (افتراضياً: شهر)
  if (!appState.ui.sheetFilter) {
    appState.ui.sheetFilter = "month"; // "month" or "week"
  }

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

  window.setSheetFilter = function (filter) {
    appState.ui.sheetFilter = filter;
    router.render();
  };

  window.renderMonthlySheetPage = function () {
    document.body.classList.add('monthly-active');

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

    // 1. تصفية الجلسات حسب الفلتر المختار (شهر أو أسبوع)
    const filteredSessions = appState.sessions.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      
      if (appState.ui.sheetFilter === "week") {
        // فلتر الأسبوع: آخر 7 أيام
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return d >= oneWeekAgo && d <= now;
      } else {
        // فلتر الشهر: نفس الشهر والسنة
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }
    });

    // متغيرات للإجمالي الكلي
    let grandTotalAmount = 0;
    let grandTotalCalculatedSessions = 0;
    let grandTotalQuran = 0;
    let grandTotalIslamic = 0;

    // 2. تجهيز بيانات الطلاب والعمليات الحسابية
    let tableData = appState.students.map(student => {
      const stdSessions = filteredSessions.filter(s => {
        // التحقق من أن الطالب مشارك في الجلسة (سواء فردي أو ضمن مجموعة)
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
      let excusedAbsenceCount = 0; // غياب بعذر

      stdSessions.forEach(s => {
        // استخراج حالة الحضور للطالب في هذه الجلسة
        let isPresent = true;
        let attendanceStatus = "present";
        
        if (s.mode === "group" && Array.isArray(s.participants)) {
            const p = s.participants.find(x => x.studentId === student.id);
            if (p && p.present === false) {
                isPresent = false;
                // افتراضياً نعتبره غياب بدون عذر في المجموعات ما لم يتم تحديد العذر مستقبلاً
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

      const totalAttended = quranCount + islamicCount;
      
      const sessionPrice = student.sessionPrice || 70;
      const maxAbsenceAllowed = student.maxAbsenceAllowed || 1;
      const groupName = student.group || "فردي (بدون مجموعة)";

      // حساب الحلقات المستحقة الدفع (الغياب اللي فوق الحد الأقصى بدون عذر)
      // الغياب بعذر لا يدخل في هذه الحسبة
      const payableAbsences = Math.max(0, unexcusedAbsenceCount - maxAbsenceAllowed);
      const totalCalculatedSessions = totalAttended + payableAbsences;
      const totalAmount = totalCalculatedSessions * sessionPrice;

      // جمع الإجماليات
      grandTotalAmount += totalAmount;
      grandTotalCalculatedSessions += totalCalculatedSessions;
      grandTotalQuran += quranCount;
      grandTotalIslamic += islamicCount;

      const ratedSessions = stdSessions.filter(s => {
         if(s.mode === "group" && Array.isArray(s.participants)) {
             const p = s.participants.find(x => x.studentId === student.id);
             return p && p.present !== false && p.overall;
         }
         return (!s.attendance || s.attendance === "present") && s.overall;
      });
      
      let sumRating = 0;
      ratedSessions.forEach(s => {
          if(s.mode === "group") {
             const p = s.participants.find(x => x.studentId === student.id);
             sumRating += p.overall;
          } else {
             sumRating += s.overall;
          }
      });

      const avgRating = ratedSessions.length ? (sumRating / ratedSessions.length).toFixed(1) : "-";

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

    // 4. توليد ألوان مميزة لكل مجموعة
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
          <td style="padding: 16px; text-align: center; color: var(--color-slate-600); font-weight: bold;">
             ${row.sessionPrice} <span style="font-size:10px;">ج.م</span>
          </td>
          <td style="padding: 16px; text-align: center;">${row.quranCount}</td>
          <td style="padding: 16px; text-align: center;">${row.islamicCount}</td>
          <td style="padding: 16px; text-align: center; color: #64748b;">${row.excusedAbsenceCount}</td>
          <td style="padding: 16px; text-align: center; color: #ef4444; font-weight: bold;">
            ${row.unexcusedAbsenceCount} <br><span style="font-size:10px; color:#94a3b8; font-weight:normal;">(مُحاسب على ${row.payableAbsences})</span>
          </td>
          <td style="padding: 16px; text-align: center;">
            <span style="background: var(--color-slate-100); padding: 4px 10px; border-radius: 6px; font-weight: bold; color: #0284c7;">
              ${row.totalCalculatedSessions}
            </span>
          </td>
          <td style="padding: 16px; text-align: center; font-weight: 900; font-size: 16px; color: #0f9d7a;">
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
          
          <div class="d-flex gap-2">
            <div style="background: var(--color-slate-100); padding: 4px; border-radius: 8px; display: flex; gap: 4px;">
              <button onclick="setSheetFilter('month')" style="border: none; background: ${appState.ui.sheetFilter === 'month' ? 'white' : 'transparent'}; color: ${appState.ui.sheetFilter === 'month' ? 'var(--color-slate-800)' : 'var(--color-slate-500)'}; box-shadow: ${appState.ui.sheetFilter === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s;">
                حصاد الشهر
              </button>
              <button onclick="setSheetFilter('week')" style="border: none; background: ${appState.ui.sheetFilter === 'week' ? 'white' : 'transparent'}; color: ${appState.ui.sheetFilter === 'week' ? 'var(--color-slate-800)' : 'var(--color-slate-500)'}; box-shadow: ${appState.ui.sheetFilter === 'week' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s;">
                حصاد الأسبوع
              </button>
            </div>
            
            <button class="btn btn-outline" onclick="window.print()"><i class="ph-duotone ph-printer"></i> طباعة</button>
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
  };

  window.initMonthlySheetPage = function () {
    return;
  };
})();
