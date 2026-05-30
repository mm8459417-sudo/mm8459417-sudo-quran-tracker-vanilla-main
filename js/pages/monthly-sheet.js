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
    const counts = buildCounts();
    const totalSessions = appState.students.reduce((sum, s) => sum + (counts[s.id] || 0), 0);

    return `
      <div>
        <!-- Header -->
        <div class="d-flex align-items-center gap-3 mb-5">
          <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--gold-bg);display:flex;align-items:center;justify-content:center;">
            <i class="ph-duotone ph-calendar-check" style="font-size: 20px; color: var(--gold-dark)"></i>
          </div>
          <div>
            <div style="font-weight:var(--fw-bold);font-size:var(--fs-lg);color:var(--text-primary);">الشيت الشهري</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);">متابعة الحضور والباقات</div>
          </div>
        </div>

        <!-- Month Navigation -->
        <div class="card-soft mb-4 d-flex justify-content-between align-items-center" style="background:linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.02));border-color:rgba(212,175,55,0.2);">
          <button class="btn btn-ghost" onclick="prevMonth()" style="font-size:var(--fs-xl);color:var(--gold);"><i class="ph-bold ph-caret-right"></i></button>
          <div style="text-align:center;">
            <div style="font-weight:var(--fw-bold);color:var(--text-primary);font-size:var(--fs-lg);font-family:var(--font-display);">${formatMonthLabel(appState.ui.year, appState.ui.month)}</div>
            <div style="font-size:var(--fs-xs);color:var(--gold-dark);font-weight:500;">إجمالي الحصص المسجلة: ${totalSessions}</div>
          </div>
          <button class="btn btn-ghost" onclick="nextMonth()" style="font-size:var(--fs-xl);color:var(--gold);"><i class="ph-bold ph-caret-left"></i></button>
        </div>

        <!-- Sheet -->
        <div id="monthly-sheet-box" class="card-soft mb-4" style="padding:0;overflow:hidden;">
          <div style="background:linear-gradient(135deg,var(--emerald),var(--emerald-dark));color:#fff;padding:var(--sp-5);text-align:center;">
            <div style="font-weight:var(--fw-bold);font-size:var(--fs-lg);">شيت حضور حلقة القرآن الكريم</div>
            <div style="font-size:var(--fs-xs);opacity:0.85;margin-top:var(--sp-1);">${formatMonthLabel(appState.ui.year, appState.ui.month)} · المعلم: ${appState.settings.teacherName}</div>
          </div>

          ${appState.students.length === 0 ? `
            <div class="elite-empty-state" style="padding: 40px 20px;">
              <div class="elite-empty-icon" style="width: 60px; height: 60px; font-size: 30px;"><i class="ph-duotone ph-users"></i></div>
              <div class="elite-empty-title" style="font-size: 20px;">لا يوجد طلاب مسجلين</div>
              <div class="elite-empty-desc" style="font-size: 14px;">قم بإضافة الطلاب لإصدار شيت الحضور الشهري.</div>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الطالب</th>
                    <th>الحضور</th>
                    <th>التقدم في الباقة</th>
                  </tr>
                </thead>
                <tbody>
                  ${appState.students
                    .map((s, i) => {
                      const c = counts[s.id] || 0;
                      const lim = s.sessionLimit || appState.settings.defaultLimit || 12;
                      const pct = Math.round((c / lim) * 100);
                      const barColor = pct >= 100 ? "var(--gold)" : pct >= 75 ? "var(--gold-light)" : "var(--emerald)";
                      return `
                        <tr style="transition:all 0.3s var(--ease-out);">
                          <td style="color:var(--text-muted);font-size:var(--fs-xs);">${i + 1}</td>
                          <td style="font-weight:var(--fw-semibold);font-size:15px;">${s.name}</td>
                          <td><span class="badge-soft" style="background:var(--emerald-bg);color:var(--emerald-dark);font-weight:700;">${c} / ${lim}</span></td>
                          <td>
                            <div class="d-flex justify-content-between" style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:var(--sp-1);">
                              <span style="font-weight:700;">${pct}%</span>
                              <span>${c >= lim ? "<i class='ph-fill ph-check-circle' style='color:var(--emerald);margin-left:4px;'></i>مكتمل" : `${lim - c} متبقي`}</span>
                            </div>
                            <div style="height:6px;background:rgba(15,157,122,0.1);border-radius:var(--r-full);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);position:relative;">
                              <div style="position:absolute;top:0;right:0;bottom:0;width:${Math.min(pct, 100)}%;background:linear-gradient(to left, ${pct >= 100 ? "var(--gold), var(--gold-light)" : "var(--emerald), var(--emerald-light)"});border-radius:var(--r-full);transition:width 0.8s cubic-bezier(0.16, 1, 0.3, 1);">
                                <div style="position:absolute;top:0;left:0;bottom:0;right:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);animation:shimmer 2s infinite;"></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")}
                  <tr style="background:var(--gold-bg);">
                    <td colspan="2" style="font-weight:var(--fw-bold);color:var(--text-primary);">الإجمالي الكلي</td>
                    <td colspan="2" style="font-weight:var(--fw-bold);text-align:center;color:var(--emerald-dark);">${totalSessions} حصة</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Export Actions -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-3);">
          <button class="btn btn-primary" onclick="exportMonthlySheetPdf()">
            <i class="ph-duotone ph-file-pdf" style="margin-left:4px;font-size:18px;"></i>
            PDF
          </button>
          <button class="btn btn-gold" onclick="exportMonthlySheetImage()">
            <i class="ph-duotone ph-image" style="margin-left:4px;font-size:18px;"></i>
            صورة
          </button>
          <button class="btn btn-outline" onclick="copyMonthlySheet()">
            <i class="ph-duotone ph-copy" style="margin-left:4px;font-size:18px;"></i>
            نسخ
          </button>
        </div>
      </div>
    `;
  };

  window.initMonthlySheetPage = function () {
    return;
  };
})();
