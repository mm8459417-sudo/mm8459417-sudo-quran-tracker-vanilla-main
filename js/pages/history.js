(function () {
  window.openHistoryStudent = function (id) {
    appState.ui.historyStudentId = id;
    router.render();
  };

  window.backToHistoryList = function () {
    appState.ui.historyStudentId = null;
    router.render();
  };

  // 🔥 النسخة الجديدة والمطورة من دالة التعديل (بتحافظ على رقم الجلسة وكل الداتا 100%)
  window.editPastSession = function (id) {
    const session = appState.sessions.find((s) => s.id === id);
    if (!session) return;

    appState.activeTab = "form";
    appState.ui.editSessionId = id;

    // تجهيز الداتا وإرسالها للفورم بدون أي فقدان للمعلومات
    appState.ui.sessionForm = {
      scope: session.mode === "group" ? "group" : "individual",
      studentId: session.studentId || "",
      groupId: session.groupId || "",
      sessionNumber: session.packageSessionNum || 1, // ✅ حل مشكلة تصفير رقم الحلقة
      date: session.date ? session.date.split("T")[0] : new Date().toISOString().split("T")[0],
      sessionType: session.sessionType || "quran",
      
      quran: session.quran ? JSON.parse(JSON.stringify(session.quran)) : {
        hifz: { surah: "", from: "", to: "", rating: "", tajweed: [], notes: "" },
        recent: { surah: "", from: "", to: "", rating: "", tajweed: [], notes: "" },
        distant: { surah: "", from: "", to: "", rating: "", tajweed: [], notes: "" },
        tadabbur: { surah: "", attention: 0, interaction: 0 },
        closing: { overall: 0, achievement: 0, homework: { new: {}, recent: {}, distant: {} }, homeworkNotes: "" },
      },
      
      islamic: session.islamic ? JSON.parse(JSON.stringify(session.islamic)) : {
        categories: [],
        behavior: { attention: 0, interaction: 0 },
        homework: [] // ✅ حل مشكلة اختفاء الواجبات
      },
      
      group: session.groupForm ? JSON.parse(JSON.stringify(session.groupForm)) : { sync: true, rows: {} }, // ✅ حل مشكلة هيكل المجموعات
    };

    appState.ui.selectedStudentId = session.studentId || "";
    appState.ui.selectedGroupId = session.groupId || "";
    appState.ui.historyStudentId = null;

    window.scrollTo({ top: 0, behavior: "smooth" });
    router.render();
  };

  window.deleteSession = async function (id) {
    if (!window.confirm("هل تريد حذف الجلسة؟")) return;
    try {
      await dbModule.deleteSession(id);
      showToast("تم حذف الجلسة");
    } catch (err) {
      showToast("خطأ أثناء الحذف");
    }
  };

  // دالة مخصصة لفتح وقفل الأكورديون (Slide Toggle)
  window.toggleHistoryAccordion = function(headerElement) {
    const content = headerElement.nextElementSibling;
    const icon = headerElement.querySelector('.acc-icon');
    
    // لو مفتوح اقفله
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
      content.style.paddingTop = "0";
      content.style.paddingBottom = "0";
      icon.style.transform = "rotate(0deg)";
      headerElement.classList.remove('active');
    } 
    // لو مقفول افتحه
    else {
      content.style.maxHeight = content.scrollHeight + 100 + "px"; // 100 بكسل احتياطي
      content.style.paddingTop = "15px";
      content.style.paddingBottom = "15px";
      icon.style.transform = "rotate(180deg)";
      headerElement.classList.add('active');
    }
  };

  function renderStudentList() {
    if (!appState.students.length) {
      return `
        <div class="elite-empty-state">
          <div class="elite-empty-icon"><i class="ph-duotone ph-users-three"></i></div>
          <div class="elite-empty-title">لا يوجد طلاب مسجلين</div>
          <div class="elite-empty-desc">لم تقم بإضافة أي طلاب بعد، يمكنك إضافتهم من الإعدادات للبدء بمتابعتهم.</div>
        </div>
      `;
    }

    return `<div style="display:flex;flex-direction:column;gap:var(--sp-3);">${appState.students
      .map((s) => {
        const allSessions = getStudentSessions(s.id);
        const count = allSessions.length;
        const limit = s.sessionLimit || appState.settings.defaultLimit || 12;
        
        // حساب الباقات على الأساس الكلي (فردي + جماعي) للعرض الخارجي
        const pkgCount = count % limit === 0 && count > 0 ? limit : count % limit;
        const pct = limit ? Math.round((pkgCount / limit) * 100) : 0;
        
        const last = allSessions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        return `
          <div class="card-soft hover-elevation" style="cursor:pointer;" onclick="openHistoryStudent('${s.id}')">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div style="font-weight:var(--fw-bold);color:var(--text-primary);display:flex;align-items:center;gap:12px;">
                <div style="width:40px;height:40px;border-radius:12px;background:var(--emerald-bg);color:var(--emerald);display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:inset 0 0 0 1px rgba(15,157,122,0.2);">
                  <i class="ph-duotone ph-user"></i>
                </div>
                <div>
                  <div style="font-size:16px;">${s.name}</div>
                  <div style="font-size:12px;color:var(--text-muted);font-weight:500;">
                    ${last ? `<i class="ph-duotone ph-clock" style="margin-left:2px;"></i> ${last.dateAr || formatArDate(last.date)}` : "لا توجد جلسات"}
                  </div>
                </div>
              </div>
              <div style="text-align:left;">
                <span class="badge-soft badge-emerald" style="margin-bottom:6px;display:inline-block;">إجمالي: ${count} جلسة</span>
                <div style="font-size:12px;color:var(--text-muted);font-weight:600;">باقة: ${pkgCount} / ${limit}</div>
              </div>
            </div>
            <div style="position:relative;height:6px;background:rgba(15,157,122,0.1);border-radius:var(--r-full);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);">
              <div style="position:absolute;top:0;right:0;bottom:0;width:${Math.min(pct, 100)}%;background:linear-gradient(to left, ${pct >= 100 ? "var(--gold), var(--gold-light)" : "var(--emerald), var(--emerald-light)"});border-radius:var(--r-full);transition:width 1s cubic-bezier(0.16, 1, 0.3, 1);">
                <div style="position:absolute;top:0;left:0;bottom:0;right:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);animation:shimmer 2s infinite;"></div>
              </div>
            </div>
          </div>
        `;
      })
      .join("")}</div>`;
  }

  // دالة مساعدة لطباعة كارت الجلسة
  function renderSessionCard(s) {
    const packageNum = s.mode === "group" ? s.participant?.packageSessionNum : s.packageSessionNum;
    const groupLabel = s.mode === "group" ? s.groupName || "" : "";
    const quranDetails = s.mode === "group" && s.participant?.quran ? s.participant.quran : s;
    const borderColor = s.sessionType === "islamic" ? "var(--gold)" : "var(--emerald)";

    return `
      <div class="card-soft hover-elevation mb-3" style="position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;bottom:0;right:0;width:4px;background:${borderColor};border-radius:0;"></div>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex gap-2" style="flex-wrap:wrap;">
            <span class="badge-soft" style="background:rgba(255,255,255,0.7);border:1px solid rgba(0,0,0,0.05);">حصة ${packageNum || "-"}</span>
            <span class="badge-soft ${s.sessionType === "islamic" ? "badge-gold" : "badge-emerald"}">${s.sessionType === "islamic" ? "<i class='ph-duotone ph-books' style='margin-left:4px;'></i>تربية إسلامية" : "<i class='ph-duotone ph-book-open-text' style='margin-left:4px;'></i>قرآن كريم"}</span>
            ${groupLabel ? `<span class="badge-soft" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;"><i class='ph-duotone ph-users' style='margin-left:4px;'></i>${groupLabel}</span>` : ""}
          </div>
          <div style="font-size:13px;color:var(--text-muted);font-weight:500;display:flex;align-items:center;gap:4px;"><i class="ph-duotone ph-calendar-check"></i> ${s.dateAr || formatArDate(s.date)}</div>
        </div>

        ${s.sessionType === "islamic" ? `
          <div style="padding:12px;background:rgba(255,255,255,0.5);border-radius:12px;font-size:14px;color:var(--text-secondary);line-height:1.7;">
            <strong><i class="ph-duotone ph-tag" style="margin-left:4px;color:var(--gold);"></i>التصنيفات:</strong>
            ${s.islamic?.categories?.length
              ? s.islamic.categories.map((c) => c.label || "درس").join(" · ")
              : "—"}
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:8px;padding:12px;background:rgba(255,255,255,0.5);border-radius:12px;font-size:14px;color:var(--text-secondary);">
            ${quranDetails?.hifz?.surah ? `<div style="display:flex;align-items:center;gap:6px;"><i class="ph-duotone ph-star" style="color:var(--emerald);"></i><strong>تسميع:</strong> ${quranDetails.hifz.surah} (${quranDetails.hifz.from}-${quranDetails.hifz.to})</div>` : ""}
            ${quranDetails?.recent?.surah ? `<div style="display:flex;align-items:center;gap:6px;"><i class="ph-duotone ph-arrows-clockwise" style="color:#0284c7;"></i><strong>قريب:</strong> ${quranDetails.recent.surah} (${quranDetails.recent.from}-${quranDetails.recent.to})</div>` : ""}
            ${quranDetails?.distant?.surah ? `<div style="display:flex;align-items:center;gap:6px;"><i class="ph-duotone ph-clock" style="color:#92400e;"></i><strong>بعيد:</strong> ${quranDetails.distant.surah} (${quranDetails.distant.from}-${quranDetails.distant.to})</div>` : ""}
          </div>
        `}

        <div class="d-flex justify-content-between align-items-center mt-3 pt-3" style="border-top:1px dashed rgba(0,0,0,0.05);">
          <div style="display:flex;align-items:center;gap:6px;font-weight:700;color:var(--text-primary);">
            <span style="color:var(--gold);font-size:18px;"><i class="ph-fill ph-star"></i></span>
            التقييم: ${s.overall || 0}
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline btn-sm" onclick="editPastSession('${s.id}')">
              <i class="ph-duotone ph-pencil-simple"></i> تعديل
            </button>
            <button class="btn btn-outline btn-sm" style="color:#ef4444; border-color:#fee2e2; background:#fef2f2;" onclick="deleteSession('${s.id}')">
              <i class="ph-duotone ph-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderStudentTimeline(student) {
    const allSessions = getStudentSessions(student.id).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    if (!allSessions.length) {
      return `
        <div class="elite-empty-state">
          <div class="elite-empty-icon"><i class="ph-duotone ph-clock"></i></div>
          <div class="elite-empty-title">لا توجد جلسات</div>
          <div class="elite-empty-desc">لم يتم تسجيل أي جلسة لهذا الطالب حتى الآن.</div>
        </div>
      `;
    }

    // فصل الداتا (فردي وجماعي)
    const individualSessions = allSessions.filter(s => s.mode === "individual");
    const groupSessions = allSessions.filter(s => s.mode === "group");

    // ستايلز خاصة بالأكورديون
    const accStyles = `
      <style>
        .acc-header {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 16px 20px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        .acc-header:hover { border-color: #cbd5e1; box-shadow: 0 6px 12px rgba(0,0,0,0.05); }
        .acc-header.active { border-color: #10b981; border-bottom-left-radius: 0; border-bottom-right-radius: 0; margin-bottom: 0; }
        
        .acc-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0, 1, 0, 1), padding 0.4s ease;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-top: none;
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
          padding: 0 16px;
          margin-bottom: 20px;
        }
        .acc-icon { transition: transform 0.3s ease; font-size: 20px; color: #64748b; }
        
        .badge-count { font-size: 13px; font-weight: 800; padding: 4px 12px; border-radius: 999px; }
        .badge-count.ind { background: #d1fae5; color: #047857; }
        .badge-count.grp { background: #e0f2fe; color: #0369a1; }
      </style>
    `;

    // رسم القسم الفردي
    let indContent = individualSessions.length > 0 
      ? individualSessions.map(s => renderSessionCard(s)).join("")
      : `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:14px; font-weight:bold;">لا توجد حلقات فردية مسجلة.</div>`;

    // رسم القسم الجماعي
    let grpContent = groupSessions.length > 0 
      ? groupSessions.map(s => renderSessionCard(s)).join("")
      : `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:14px; font-weight:bold;">لا توجد حلقات جماعية مسجلة.</div>`;

    return `
      ${accStyles}
      <div style="display:flex;flex-direction:column;">
        
        <div>
          <div class="acc-header" onclick="toggleHistoryAccordion(this)">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:40px;height:40px;border-radius:12px;background:#ecfdf5;color:#10b981;display:flex;align-items:center;justify-content:center;font-size:20px;">
                <i class="ph-duotone ph-user"></i>
              </div>
              <div>
                <div style="font-size:16px; font-weight:800; color:#1e293b;">سجلات الحلقات الفردية</div>
                <div style="font-size:12px; color:#64748b; font-weight:600;">الجلسات المخصصة للطالب فقط</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:16px;">
              <span class="badge-count ind">${individualSessions.length} حلقة</span>
              <i class="ph-bold ph-caret-down acc-icon"></i>
            </div>
          </div>
          <div class="acc-content">
            ${indContent}
          </div>
        </div>

        <div>
          <div class="acc-header" onclick="toggleHistoryAccordion(this)">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:40px;height:40px;border-radius:12px;background:#f0f9ff;color:#0ea5e9;display:flex;align-items:center;justify-content:center;font-size:20px;">
                <i class="ph-duotone ph-users-three"></i>
              </div>
              <div>
                <div style="font-size:16px; font-weight:800; color:#1e293b;">سجلات الحلقات الجماعية</div>
                <div style="font-size:12px; color:#64748b; font-weight:600;">الجلسات ضمن المجموعات</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:16px;">
              <span class="badge-count grp">${groupSessions.length} حلقة</span>
              <i class="ph-bold ph-caret-down acc-icon"></i>
            </div>
          </div>
          <div class="acc-content">
            ${grpContent}
          </div>
        </div>

      </div>
    `;
  }

  window.renderHistoryPage = function () {
    if (!appState.ui.historyStudentId) {
      return `
        <div>
          <div class="d-flex align-items-center gap-3 mb-5">
            <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--emerald-bg);display:flex;align-items:center;justify-content:center;">
              <i class="ph-duotone ph-clock-counter-clockwise" style="font-size: 20px; color: var(--emerald)"></i>
            </div>
            <div>
              <div style="font-weight:var(--fw-bold);font-size:var(--fs-lg);color:var(--text-primary);">سجلات الطلاب</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);">تتبع سجل الحصص الفردية والجماعية</div>
            </div>
          </div>
          ${renderStudentList()}
        </div>
      `;
    }

    const student = appState.students.find((s) => s.id === appState.ui.historyStudentId);
    if (!student) return `<div class="card-soft">الطالب غير موجود</div>`;

    return `
      <div>
        <div class="d-flex justify-content-between align-items-center mb-5">
          <div class="d-flex align-items-center gap-3">
            <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--emerald-bg);display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:var(--emerald-dark);"><i class="ph-duotone ph-user"></i></div>
            <div>
              <div style="font-weight:var(--fw-bold);font-size:var(--fs-lg);color:var(--text-primary);">سجل ${student.name}</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);">جميع الحصص والتفاصيل المنفصلة</div>
            </div>
          </div>
          <button class="btn btn-outline" onclick="backToHistoryList()">
            <i class="ph-bold ph-arrow-right" style="margin-left:8px;"></i>
            رجوع
          </button>
        </div>
        ${renderStudentTimeline(student)}
      </div>
    `;
  };

  window.initHistoryPage = function () {
    return;
  };
})();
