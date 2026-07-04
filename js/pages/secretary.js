// ==========================================================
// شاشة السكرتير الذكي — مركز القيادة المتكامل (v3.0)
// Smart Secretary Command Center
// ==========================================================
//
// ملاحظات تكامل مهمة لمحمد (اقرأها قبل الدمج):
//
// 1) الشاشة بتتوقع إن appState.sessions فيها سجل الجلسات، وكل جلسة ليها:
//      { id, date (ISO string), mode: 'individual'|'group',
//        studentId? , groupId?, groupName?, sessionType: 'quran'|'islamic',
//        attendance: 'present'|'absent_excused'|'absent_unexcused'|'mixed',
//        isReportPending: boolean, participants? [{studentId, present, attendance, rating, notes}],
//        rating, notes, cancelled? }
//
// 2) "isReportPending: true" معناها الحضور اتسجل (وبالتالي الشيت المالي
//    اتحدّث) لكن التقرير الأكاديمي (التقييم) لسه ما اتسجلش. الغياب (absent_*)
//    بيتسجل مباشرة بـ isReportPending: false لأنه مش محتاج تقييم أكاديمي.
//
// 3) لما المعلم يختار "تسجيل التقرير الآن" بيتبعت حدث:
//      window.dispatchEvent(new CustomEvent('secretary:openEvaluation', { detail: { sessionId } }))
//    المفروض شاشة التقييم تسمع للحدث ده، وبعد ما تحفظ التقرير تحدّث
//    الجلسة (session.isReportPending = false) في appState + قاعدة البيانات.
//    لو الشاشة عايزة تحدّث السكرتير الذكي بعد كده تقدر تنادي:
//      window.refreshSecretaryPage()
//
// 4) "المتأخرة" = مواعيد فاتت من غير أي تسجيل حضور خالص (أكتر من يوم).
//    "التقارير المتأخرة" (فلتر في السجل) = جلسات اتسجل حضورها لكن التقرير
//    لسه معلق من أكتر من يوم.
//
// 5) لو appState أو dbModule أو showToast أو formatArDate مش موجودين،
//    الكود بيتعامل معاهم بأمان (Optional chaining / typeof checks).
//
// ==========================================================
(function () {
  "use strict";

  // ============================================================
  // 0) إعدادات عامة
  // ============================================================
  const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const GRACE_MINUTES = 15;          // فترة السماح قبل الموعد لعرض الحلقة في "الحالية"
  const LATE_AFTER_DAYS = 1;         // بعد مرور كام يوم من غير تسجيل تعتبر المهمة "متأخرة"
  const REPORT_LATE_AFTER_DAYS = 1;  // بعد كام يوم يعتبر التقرير المعلق "متأخر" في السجل
  const OCCURRENCE_LOOKBACK_DAYS = 14; // كام يوم نرجع بالبحث عن مواعيد فايتة

  // حالة الواجهة (بتتصفّر لو الصفحة اتعمل لها reload كامل من الراوتر)
  let activeMainTab = "tasks";       // 'tasks' | 'log'
  let activeSubTab = "current";      // 'current' | 'upcoming' | 'reports' | 'late'
  let activeLogFilter = "all";       // 'all' | 'completed' | 'incomplete' | 'late_reports' | 'absence'
  let absenceDrafts = {};            // { taskKey: { studentId: 'excused'|'unexcused' } }
  let expandedAbsence = null;        // taskKey اللي شاشة تقسيم الغياب بتاعته مفتوحة
  let pendingChoice = null;          // { taskKey, sessionId } لما نعرض اختيار "تسجيل التقرير الآن/لاحقاً"
  let lastTasks = { upcoming: [], current: [], late: [] }; // آخر نتيجة حسبناها (لاستخدامها وقت الحفظ)
  let clockStarted = false;

  // ============================================================
  // 1) دوال مساعدة عامة
  // ============================================================
  function normalizeArabic(text) {
    if (!text) return "";
    return text.trim().replace(/[أإآ]/g, "ا").replace(/ة$/g, "ه");
  }

  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    if (timeStr.includes(":") && !/AM|PM|م|ص/.test(timeStr)) {
      let [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    }
    let [time, period] = timeStr.split(" ");
    if (!time || !period) return 0;
    let [h, m] = time.split(":").map(Number);
    if ((period === "PM" || period === "م") && h !== 12) h += 12;
    if ((period === "AM" || period === "ص") && h === 12) h = 0;
    return h * 60 + m;
  }

  function minutesToTimeStr(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${pad(h)}:${pad(m)}:00`;
  }

  function pad(n) { return n.toString().padStart(2, "0"); }

  function dateToStr(d) { return d.toISOString().split("T")[0]; }

  function addDays(date, delta) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    return d;
  }

  function formatClock(date) {
    let h = date.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${pad(h)}:${pad(date.getMinutes())} ${ampm}`;
  }

  function formatDateLabel(dateObj) {
    if (typeof window.formatArDate === "function") {
      try { return window.formatArDate(dateObj.toISOString()); } catch (e) { /* تجاهل */ }
    }
    return dateObj.toLocaleDateString("ar-EG");
  }

  function daysAgoLabel(n) {
    if (n <= 0) return "اليوم";
    if (n === 1) return "من يوم";
    if (n === 2) return "من يومين";
    if (n <= 10) return `من ${n} أيام`;
    return `من ${n} يوم`;
  }

  function getStudentName(id) {
    const s = (window.appState?.students || []).find(st => st.id === id);
    return s ? s.name : "طالب محذوف";
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  function showToastSafe(msg) {
    if (typeof window.showToast === "function") window.showToast(msg);
  }

  // ============================================================
  // 2) محرك البيانات: جلب الجداول + توليد "الحوادث" (Occurrences)
  // ============================================================

  // كل مواعيد الطلاب + المجموعات في شكل موحّد (بدون فلترة على يوم معين)
  function getScheduleEntries() {
    const entries = [];
    const students = window.appState?.students || [];
    const groups = window.appState?.groups || [];

    students.forEach(student => {
      const qEnabled = student.quranEnabled !== undefined ? student.quranEnabled : ((student.quranLimit || student.sessionLimit) > 0);
      const iEnabled = student.islamicEnabled !== undefined ? student.islamicEnabled : ((student.islamicLimit || 0) > 0);
      let schedules = [];

      if (qEnabled && Array.isArray(student.quranSchedule)) {
        schedules.push(...student.quranSchedule.map(s => ({ ...s, type: "قرآن", sessionType: "quran", icon: "ph-book-open-text", color: "-green" })));
      } else if (qEnabled && Array.isArray(student.schedule)) { // توافق رجعي
        schedules.push(...student.schedule.map(s => ({ ...s, type: "قرآن", sessionType: "quran", icon: "ph-book-open-text", color: "-green" })));
      }
      if (iEnabled && Array.isArray(student.islamicSchedule)) {
        schedules.push(...student.islamicSchedule.map(s => ({ ...s, type: "تربية", sessionType: "islamic", icon: "ph-heart", color: "-blue" })));
      }

      schedules.forEach(sched => {
        entries.push({
          mode: "individual",
          id: student.id,
          name: student.name,
          gender: student.gender,
          day: sched.day,
          time: sched.time,
          type: sched.type,
          sessionType: sched.sessionType,
          icon: sched.icon,
          color: sched.color
        });
      });
    });

    groups.forEach(group => {
      if (Array.isArray(group.schedule)) {
        group.schedule.forEach(sched => {
          entries.push({
            mode: "group",
            id: group.id,
            name: `مجموعة: ${group.name}`,
            gender: "group",
            day: sched.day,
            time: sched.time,
            type: sched.type || "قرآن",
            sessionType: sched.sessionType || "quran",
            icon: "ph-users-three",
            color: "-amber",
            participants: group.studentIds || []
          });
        });
      }
    });

    return entries;
  }

  // هل فيه جلسة متسجلة فعلاً لهذا الموعد في تاريخ معين؟
  function findSessionForOccurrence(mode, id, dateStr) {
    const sessions = window.appState?.sessions || [];
    return sessions.find(s => {
      if (!s.date || !s.date.startsWith(dateStr)) return false;
      if (mode === "individual") return s.studentId === id;
      if (mode === "group") return s.groupId === id;
      return false;
    }) || null;
  }

  // بيولّد كل "الحوادث" (مواعيد فعلية بتاريخ) لآخر كذا يوم + النهاردة،
  // ويستبعد أي حادثة اتسجلت جلستها بالفعل، وبيصنّفها: قادمة / حالية / متأخرة
  function generateOccurrences() {
    const entries = getScheduleEntries();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const occurrences = [];

    for (let back = 0; back <= OCCURRENCE_LOOKBACK_DAYS; back++) {
      const occDate = addDays(now, -back);
      const occDateStr = dateToStr(occDate);
      const dayName = DAYS_AR[occDate.getDay()];

      entries.forEach(entry => {
        if (normalizeArabic(entry.day) !== normalizeArabic(dayName)) return;
        if (findSessionForOccurrence(entry.mode, entry.id, occDateStr)) return; // متسجلة بالفعل

        const sessionMinutes = timeToMinutes(entry.time);
        occurrences.push({
          ...entry,
          dateStr: occDateStr,
          minutes: sessionMinutes,
          daysAgo: back,
          taskKey: `${entry.mode}-${entry.id}-${occDateStr}`,
          isToday: back === 0
        });
      });
    }

    const upcoming = [];
    const current = [];
    const late = [];

    occurrences.forEach(occ => {
      if (occ.isToday) {
        if (currentMinutes >= occ.minutes - GRACE_MINUTES) current.push(occ);
        else upcoming.push(occ);
      } else if (occ.daysAgo >= LATE_AFTER_DAYS) {
        late.push(occ);
      } else {
        current.push(occ);
      }
    });

    upcoming.sort((a, b) => a.minutes - b.minutes);
    current.sort((a, b) => (a.daysAgo - b.daysAgo) || (a.minutes - b.minutes));
    late.sort((a, b) => b.daysAgo - a.daysAgo); // الأكثر تأخيراً فوق

    return { upcoming, current, late };
  }

  // ============================================================
  // 3) التقارير المعلقة (isReportPending)
  // ============================================================
  function getPendingReportSessions() {
    const sessions = (window.appState?.sessions || []).filter(s => s.isReportPending === true);
    sessions.sort((a, b) => new Date(a.date) - new Date(b.date)); // الأقدم أولاً
    return sessions.map((s, idx) => ({
      ...s,
      _locked: idx !== 0,
      _daysOld: Math.floor((Date.now() - new Date(s.date).getTime()) / 86400000)
    }));
  }

  // ============================================================
  // 4) حالة الجلسة (لأغراض السجل والتقارير)
  // ============================================================
  function computeSessionStatus(s) {
    if (s.cancelled) return "cancelled";
    if (s.attendance === "absent_excused") return "absent_excused";
    if (s.attendance === "absent_unexcused") return "absent_unexcused";
    return s.isReportPending ? "attendance_recorded" : "completed";
  }

  const STATUS_META = {
    scheduled:            { label: "مجدولة",            color: "var(--ink-3)" },
    pending_confirmation: { label: "بانتظار التأكيد",     color: "var(--amber)" },
    attendance_recorded:  { label: "تم احتساب الحضور",    color: "var(--accent)" },
    completed:            { label: "مكتملة",             color: "var(--green)" },
    absent_excused:       { label: "غياب بعذر",          color: "var(--amber)" },
    absent_unexcused:     { label: "غياب بدون عذر",       color: "var(--red)" },
    cancelled:            { label: "ملغاة",              color: "var(--ink-3)" }
  };

  // ============================================================
  // 5) الـ KPIs
  // ============================================================
  function computeKPIs(tasks, pendingReports) {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    const sessions = window.appState?.sessions || [];

    const completedThisMonth = sessions.filter(s => {
      if (!s.date || !s.date.startsWith(monthKey)) return false;
      return computeSessionStatus(s) === "completed";
    }).length;

    return {
      current: tasks.current.length,
      unrecordedReports: pendingReports.length,
      upcoming: tasks.upcoming.length,
      late: tasks.late.length,
      completedThisMonth
    };
  }

  // ============================================================
  // 6) بناء أحداث السجل الزمني (Log) من المهام + الجلسات
  // ============================================================
  function buildLogEvents(tasks) {
    const events = [];

    tasks.upcoming.forEach(occ => {
      events.push({
        ts: new Date(`${occ.dateStr}T${minutesToTimeStr(occ.minutes)}`).getTime(),
        name: occ.name,
        sub: `حصة ${occ.type} · ${occ.time}`,
        statusKey: "scheduled",
        isLateReport: false,
        hasPartialAbsence: false
      });
    });

    tasks.current.concat(tasks.late).forEach(occ => {
      events.push({
        ts: new Date(`${occ.dateStr}T${minutesToTimeStr(occ.minutes)}`).getTime(),
        name: occ.name,
        sub: `حصة ${occ.type} · ${occ.time} · ${daysAgoLabel(occ.daysAgo)}`,
        statusKey: "pending_confirmation",
        isLateReport: false,
        hasPartialAbsence: false
      });
    });

    (window.appState?.sessions || []).forEach(s => {
      const statusKey = computeSessionStatus(s);
      const daysOld = Math.floor((Date.now() - new Date(s.date).getTime()) / 86400000);
      const isGroup = !!s.groupId;
      const name = isGroup ? `مجموعة: ${s.groupName || ""}` : getStudentName(s.studentId);
      const partial = isGroup && Array.isArray(s.participants) && s.participants.some(p => p.attendance === "absent_excused" || p.attendance === "absent_unexcused");

      let sub = `حصة ${s.sessionType === "islamic" ? "تربية" : "قرآن"}`;
      if (partial) {
        const exCount = s.participants.filter(p => p.attendance === "absent_excused").length;
        const unCount = s.participants.filter(p => p.attendance === "absent_unexcused").length;
        sub += ` · غياب: ${exCount} بعذر / ${unCount} بدون عذر`;
      }

      events.push({
        ts: new Date(s.date).getTime(),
        name,
        sub,
        statusKey,
        isLateReport: statusKey === "attendance_recorded" && daysOld >= REPORT_LATE_AFTER_DAYS,
        hasPartialAbsence: partial
      });
    });

    events.sort((a, b) => b.ts - a.ts); // الأحدث فوق
    return events;
  }

  function filterLogEvents(events, filter) {
    switch (filter) {
      case "completed": return events.filter(e => e.statusKey === "completed");
      case "incomplete": return events.filter(e => e.statusKey === "pending_confirmation");
      case "late_reports": return events.filter(e => e.isLateReport);
      case "absence": return events.filter(e => e.statusKey === "absent_excused" || e.statusKey === "absent_unexcused" || e.hasPartialAbsence);
      default: return events;
    }
  }

  // ============================================================
  // 7) حفظ جلسة جديدة (نقطة مركزية واحدة)
  // ============================================================
  function saveSession(sessionData) {
    const session = { id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...sessionData };
    if (!window.appState) window.appState = {};
    if (!window.appState.sessions) window.appState.sessions = [];
    window.appState.sessions.push(session);

    if (window.dbModule && typeof window.dbModule.addSession === "function") {
      window.dbModule.addSession(session).catch(err => console.error(err));
    }
    showToastSafe("تم تسجيل الجلسة بنجاح");
    return session;
  }

  // ============================================================
  // 8) عناصر واجهة صغيرة قابلة لإعادة الاستخدام
  // ============================================================
  function emptyState(icon, text, color) {
    return `<div class="empty"><i class="ph-duotone ${icon}" style="font-size:32px;color:${color};margin-bottom:8px;display:block;"></i><br><span>${text}</span></div>`;
  }

  function kpiCard(icon, colorClass, value, label) {
    return `
      <div class="kpi ${colorClass}">
        <div class="icon"><i class="ph-duotone ${icon}"></i></div>
        <div class="value">${value}</div>
        <div class="label">${label}</div>
      </div>`;
  }

  function logFilterBtn(key, label) {
    const active = activeLogFilter === key ? "active" : "";
    return `<button class="log-filter-btn ${active}" data-logfilter="${key}">${label}</button>`;
  }

  function renderPostSaveChoice(occ) {
    return `
      <div class="card -green" data-key="${occ.taskKey}">
        <div class="avatar" style="--av1:#10b981;--av2:#a7f3d0;"><i class="ph-bold ph-check"></i></div>
        <div class="card-body">
          <div class="name">${escapeHtml(occ.name)}</div>
          <div class="meta">تم تسجيل الحضور ✅ — تسجل التقرير الأكاديمي دلوقتي ولا بعدين؟</div>
        </div>
        <div class="card-actions">
          <button class="btn -blue" data-action="report_now" data-key="${occ.taskKey}" data-session="${pendingChoice.sessionId}"><i class="ph-bold ph-note-pencil"></i>الآن</button>
          <button class="btn -ghost" data-action="report_later" data-key="${occ.taskKey}">لاحقاً</button>
        </div>
      </div>`;
  }

  function renderGroupAbsencePanel(occ) {
    const key = occ.taskKey;
    const draft = absenceDrafts[key] || {};
    const participants = occ.participants || [];

    const chip = (pid, state) => `<span class="chip -${state}" data-student="${pid}" data-key="${key}">${escapeHtml(getStudentName(pid))}</span>`;

    const excusedChips = participants.filter(pid => draft[pid] === "excused").map(pid => chip(pid, "excused")).join("") || `<span class="chip-empty">لا يوجد</span>`;
    const unexcusedChips = participants.filter(pid => draft[pid] === "unexcused").map(pid => chip(pid, "unexcused")).join("") || `<span class="chip-empty">لا يوجد</span>`;
    const presentChips = participants.filter(pid => !draft[pid] || draft[pid] === "present").map(pid => chip(pid, "present")).join("") || `<span class="chip-empty">لا يوجد</span>`;

    return `
      <div class="card -amber absence-card" data-key="${key}">
        <div class="absence-head">
          <div class="name">${escapeHtml(occ.name)} <span class="tag -amber">مجموعة</span></div>
          <div class="meta"><span class="time" dir="ltr">${occ.time}</span><span class="sep">·</span>حصة ${occ.type} · اضغط على اسم الطالب لتبديل حالته</div>
        </div>
        <div class="absence-grid">
          <div class="absence-col -excused">
            <div class="absence-col-title"><i class="ph-bold ph-note"></i>غياب بعذر</div>
            <div class="absence-col-body">${excusedChips}</div>
          </div>
          <div class="absence-col -unexcused">
            <div class="absence-col-title"><i class="ph-bold ph-x-circle"></i>بدون عذر</div>
            <div class="absence-col-body">${unexcusedChips}</div>
          </div>
        </div>
        <div class="absence-pool">
          <div class="absence-col-title -present"><i class="ph-bold ph-check-circle"></i>حاضر (الافتراضي)</div>
          <div class="absence-col-body">${presentChips}</div>
        </div>
        <div class="card-actions" style="width:100%; justify-content:flex-end; margin-top:12px;">
          <button class="btn -ghost" data-action="cancel_group_absence" data-key="${key}">إلغاء</button>
          <button class="btn -green" data-action="save_group_absence" data-key="${key}"><i class="ph-bold ph-check"></i>حفظ</button>
        </div>
      </div>`;
  }

  function renderTaskCard(occ, kind) {
    const key = occ.taskKey;

    if (expandedAbsence === key) return renderGroupAbsencePanel(occ);
    if (pendingChoice && pendingChoice.taskKey === key) return renderPostSaveChoice(occ);

    const isGroup = occ.mode === "group";
    const isFemale = occ.gender === "girl" || occ.gender === "female";
    const avColor1 = isGroup ? "#f59e0b" : (isFemale ? "#ec4899" : "#0ea5e9");
    const avColor2 = isGroup ? "#fef3c7" : (isFemale ? "#fbcfe8" : "#bae6fd");
    const init = isGroup ? '<i class="ph-bold ph-users-three"></i>' : escapeHtml(occ.name).substring(0, 2);
    const cardColorClass = isGroup ? "-amber" : occ.color;

    // جلب التاريخ الفعلي
    const exactDateStr = new Date(occ.dateStr).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' });
    const lateTag = kind === "late" ? `<span class="tag -red">متأخرة ${daysAgoLabel(occ.daysAgo)} (${exactDateStr})</span>` : "";
    const encodedTask = encodeURIComponent(JSON.stringify(occ));

    // 🔥 معرفة هل الحلقة دي تبع شهر فات ولا لأ
    const occDate = new Date(occ.dateStr);
    const now = new Date();
    const isPreviousMonth = occDate.getFullYear() < now.getFullYear() || (occDate.getFullYear() === now.getFullYear() && occDate.getMonth() < now.getMonth());

    // 🔥 زرار الحذف هيظهر بس لو الحلقة تبع شهر سابق
    const deleteBtnHtml = isPreviousMonth ? `<button class="btn" style="background:#fee2e2; color:#ef4444; padding: 8px;" data-action="cancel_task" title="حذف وتجاهل المهمة لأنها من شهر سابق"><i class="ph-bold ph-trash"></i></button>` : '';

    let actionsHtml;
    if (kind === "upcoming") {
      actionsHtml = `<div class="card-actions" style="color:var(--ink-3); font-weight:bold; font-size:12px;">مجدولة: ${exactDateStr}</div>`;
    } else if (isGroup) {
      actionsHtml = `
        <div class="card-actions action-buttons">
          <button class="btn -green" data-action="group_full"><i class="ph-bold ph-check"></i>تمت</button>
          <button class="btn -red-ghost" data-action="group_partial"><i class="ph-bold ph-users"></i>غياب</button>
          ${deleteBtnHtml}
        </div>`;
    } else {
      actionsHtml = `
        <div class="card-actions action-buttons">
          <button class="btn -green" data-action="ind_done"><i class="ph-bold ph-check"></i>تمت</button>
          <button class="btn -red-ghost" data-action="ind_absent_prompt"><i class="ph-bold ph-x"></i>غياب</button>
          ${deleteBtnHtml}
        </div>
        <div class="card-actions action-absent-options" style="display:none; width:100%; justify-content:flex-end;">
          <button class="btn" style="background:#f1f5f9; color:#475569;" data-action="ind_absent_excused">بعذر</button>
          <button class="btn -red-ghost" data-action="ind_absent_unexcused">بدون عذر</button>
          <button class="btn" style="background:transparent; color:#94a3b8; padding:8px; font-size:16px;" data-action="ind_cancel_absent"><i class="ph-bold ph-x"></i></button>
        </div>`;
    }

    return `
      <div class="card ${kind === "late" ? "-red" : cardColorClass}" data-key="${key}" data-task="${encodedTask}">
        <div class="avatar" style="--av1:${avColor1};--av2:${avColor2}">${init}</div>
        <div class="card-body">
          <div class="name">${escapeHtml(occ.name)} <span class="tag ${isGroup ? "-amber" : "-blue"}">${isGroup ? "مجموعة" : "فردي"}</span> ${lateTag}</div>
          <div class="meta"><span class="time" dir="ltr">${occ.time}</span><span class="sep">·</span>حصة ${occ.type}</div>
        </div>
        ${actionsHtml}
      </div>`;
  }

    return `
      <div class="card ${kind === "late" ? "-red" : cardColorClass}" data-key="${key}" data-task="${encodedTask}">
        <div class="avatar" style="--av1:${avColor1};--av2:${avColor2}">${init}</div>
        <div class="card-body">
          <div class="name">${escapeHtml(occ.name)} <span class="tag ${isGroup ? "-amber" : "-blue"}">${isGroup ? "مجموعة" : "فردي"}</span> ${lateTag}</div>
          <div class="meta"><span class="time" dir="ltr">${occ.time}</span><span class="sep">·</span>حصة ${occ.type}</div>
        </div>
        ${actionsHtml}
      </div>`;
  }

  function renderReportCard(s) {
    const isGroup = !!s.groupId;
    const name = isGroup ? `مجموعة: ${s.groupName || ""}` : getStudentName(s.studentId);
    const dateLabel = formatDateLabel(new Date(s.date));
    const lockedAttr = s._locked ? "disabled" : "";
    const lockedTitle = s._locked ? `title="يجب تسجيل الأقدم أولاً"` : "";

    return `
      <div class="card -blue ${s._locked ? "-locked" : ""}">
        <div class="avatar" style="--av1:#0ea5e9;--av2:#bae6fd;">${isGroup ? '<i class="ph-bold ph-users-three"></i>' : escapeHtml(name).substring(0, 2)}</div>
        <div class="card-body">
          <div class="name">${escapeHtml(name)} ${s._daysOld >= REPORT_LATE_AFTER_DAYS ? '<span class="tag -red">متأخر</span>' : ""}</div>
          <div class="meta"><span class="time" dir="ltr">${dateLabel}</span><span class="sep">·</span>حصة ${s.sessionType === "islamic" ? "تربية" : "قرآن"}</div>
        </div>
        <div class="card-actions">
          <button class="btn -blue" data-action="report_now" data-session="${s.id}" ${lockedAttr} ${lockedTitle}><i class="ph-bold ph-note-pencil"></i>تسجيل التقرير</button>
        </div>
      </div>`;
  }

  function renderLogItem(evt) {
    const meta = STATUS_META[evt.statusKey] || STATUS_META.scheduled;
    const dateObj = new Date(evt.ts);
    const timeStr = formatClock(dateObj);
    // جلب التاريخ الفعلي للسجل
    const exactDateStr = dateObj.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <div class="t-item">
        <div class="t-dot" style="--dot-color:${meta.color}"></div>
        <div class="t-card">
          <div>
            <div class="t-title">${escapeHtml(evt.name)} <span class="tag" style="background:${meta.color}22; color:${meta.color};">${meta.label}</span></div>
            <div class="t-sub">${escapeHtml(evt.sub)}</div>
          </div>
          <div class="t-time" style="text-align: left; line-height: 1.5;">
            <span style="color: var(--ink-2); font-size: 11px;">${exactDateStr}</span><br>
            <span>${timeStr}</span>
          </div>
        </div>
      </div>`;
  }

  // ============================================================
  // 9) الأنماط (CSS) — نفس الـ Design Tokens الأصلية + إضافات
  // ============================================================
  const SECRETARY_STYLES = `
  <style>
    :root{
      --bg:#F5F5F7;
      --surface:#FFFFFF;
      --surface-2:#FBFBFD;
      --ink:#1D1D1F;
      --ink-2:#6E6E73;
      --ink-3:#AEAEB2;
      --border:rgba(0,0,0,.07);
      --border-soft:rgba(0,0,0,.045);

      --accent:#0ea5e9;
      --accent-soft:rgba(14,165,233,.1);
      --accent-ink:#0369a1;

      --red:#ef4444;
      --red-soft:rgba(239,68,68,.1);
      --red-ink:#b91c1c;

      --amber:#f59e0b;
      --amber-soft:rgba(245,158,11,.12);
      --amber-ink:#b45309;

      --green:#10b981;
      --green-soft:rgba(16,185,129,.12);
      --green-ink:#047857;

      --violet:#8b5cf6;
      --violet-soft:rgba(139,92,246,.12);
      --violet-ink:#6d28d9;

      --shadow-xs:0 1px 2px rgba(0,0,0,.04);
      --shadow-sm:0 2px 8px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.04);
      --shadow-md:0 8px 24px rgba(0,0,0,.07), 0 2px 6px rgba(0,0,0,.04);

      --r-sm:10px;
      --r-md:16px;
      --r-lg:22px;
      --r-pill:999px;

      --font-display: 'Cairo', system-ui, sans-serif;
      --font-body: 'Cairo', system-ui, sans-serif;
      --font-mono: ui-monospace, monospace;
      --ease:cubic-bezier(.4,0,.2,1);
    }

    .sec-wrap { max-width: 1120px; margin: 0 auto; padding: 20px 0 80px; direction: rtl; font-family: var(--font-body); color: var(--ink); }
    .sec-wrap * { box-sizing: border-box; }
    .sec-wrap button { font-family: inherit; }

    .page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 32px; flex-wrap: wrap; }
    .page-head h1 { font-family: var(--font-display); font-size: 26px; font-weight: 800; margin: 0 0 6px; display: flex; align-items: center; gap: 10px; }
    .page-head h1 .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); flex-shrink: 0; }
    .page-head p { margin: 0; color: var(--ink-2); font-size: 14px; font-weight:bold;}

    .clock-chip { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--r-pill); padding: 8px 16px; font-family: var(--font-mono); font-size: 14px; color: var(--ink-2); box-shadow: var(--shadow-xs); display: flex; align-items: center; gap: 8px; font-weight:bold; direction:ltr; }

    .kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 34px; }
    .kpi { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--r-lg); padding: 20px; box-shadow: var(--shadow-sm); position: relative; overflow: hidden; transition: transform .3s var(--ease), box-shadow .3s var(--ease); }
    .kpi:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .kpi .icon { width: 36px; height: 36px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size:18px;}
    .kpi.-amber .icon { background: var(--amber-soft); color: var(--amber-ink); }
    .kpi.-ink .icon { background: rgba(29,29,31,.06); color: var(--ink); }
    .kpi.-blue .icon { background: var(--accent-soft); color: var(--accent-ink); }
    .kpi.-green .icon { background: var(--green-soft); color: var(--green-ink); }
    .kpi.-red .icon { background: var(--red-soft); color: var(--red-ink); }
    .kpi.-violet .icon { background: var(--violet-soft); color: var(--violet-ink); }

    .kpi .value { font-family: var(--font-display); font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
    .kpi .label { font-size: 13px; color: var(--ink-2); font-weight: 600; }

    .tabs-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; flex-wrap: wrap; gap: 14px; }
    .subtabs-row { display: flex; justify-content: flex-start; margin-bottom: 18px; }

    .segmented { position: relative; display: inline-flex; background: rgba(118,118,128,.12); border-radius: var(--r-pill); padding: 4px; gap: 2px; }
    .segmented .pill { position: absolute; top: 4px; bottom: 4px; right: 4px; width: 120px; background: var(--surface); border-radius: var(--r-pill); box-shadow: 0 2px 6px rgba(0,0,0,.12); transition: transform .3s var(--ease), width .3s var(--ease); }
    .segmented button { position: relative; z-index: 1; border: none; background: transparent; padding: 8px 18px; font-size: 13px; font-weight: 800; color: var(--ink-2); border-radius: var(--r-pill); cursor: pointer; transition: color .3s var(--ease); white-space: nowrap; display:inline-flex; align-items:center; gap:6px; }
    .segmented button.active { color: var(--ink); }
    .segmented.-sub button { padding: 7px 14px; font-size: 12px; }

    .count-badge { background: rgba(118,118,128,.18); color: var(--ink-2); font-size: 10px; font-weight: 800; padding: 1px 7px; border-radius: var(--r-pill); }
    .segmented button.active .count-badge { background: var(--accent-soft); color: var(--accent-ink); }

    .panel { display: none; }
    .panel.active { display: block; animation: fadeIn .4s var(--ease); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

    .cards { display: flex; flex-direction: column; gap: 10px; }

    .card { position: relative; display: flex; align-items: center; gap: 16px; background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--r-md); padding: 16px; box-shadow: var(--shadow-xs); transition: box-shadow .3s var(--ease), transform .3s var(--ease), opacity .4s var(--ease); overflow: hidden; flex-wrap:wrap;}
    .card:hover { box-shadow: var(--shadow-sm); }
    .card::before { content: ""; position: absolute; right: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px; }
    .card.-amber::before { background: var(--amber); }
    .card.-red::before { background: var(--red); }
    .card.-blue::before { background: var(--accent); }
    .card.-green::before { background: var(--green); }
    .card.-locked { opacity: .55; }
    .card.-resolved { opacity: .55; transform: scale(.99); }

    .avatar { width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; color: #fff; background: linear-gradient(150deg, var(--av1), var(--av2)); }

    .card-body { flex: 1; min-width: 150px; }
    .card-body .name { font-weight: 800; font-size: 14px; margin-bottom: 3px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .card-body .meta { font-size: 12px; color: var(--ink-2); font-weight:600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .card-body .meta .time { font-family: var(--font-mono); color: var(--ink); font-weight: 600; }
    .card-body .meta .sep { color: var(--ink-3); }

    .tag { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: var(--r-pill); letter-spacing: .02em; }
    .tag.-amber { background: var(--amber-soft); color: var(--amber-ink); }
    .tag.-red { background: var(--red-soft); color: var(--red-ink); }
    .tag.-blue { background: var(--accent-soft); color: var(--accent-ink); }

    .card-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .btn { border: none; cursor: pointer; font-weight: 800; font-size: 12px; padding: 8px 14px; border-radius: var(--r-sm); display: inline-flex; align-items: center; gap: 6px; transition: transform .15s var(--ease), filter .2s var(--ease); white-space: nowrap; }
    .btn:active { transform: scale(.95); }
    .btn.-green { background: var(--green); color: #fff; }
    .btn.-red-ghost { background: var(--red-soft); color: var(--red-ink); }
    .btn.-blue { background: var(--accent); color: #fff; }
    .btn.-ghost { background: rgba(118,118,128,.12); color: var(--ink-2); }
    .btn:disabled { opacity: .4; cursor: not-allowed; }
    .btn:disabled:active { transform: none; }

    .status-badge { font-size: 12px; font-weight: 800; padding: 6px 12px; border-radius: var(--r-pill); display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .status-badge.-green { background: var(--green-soft); color: var(--green-ink); }
    .status-badge.-red { background: var(--red-soft); color: var(--red-ink); }

    /* لوحة تقسيم الغياب للمجموعات */
    .absence-card { flex-direction: column; align-items: stretch; }
    .absence-head { margin-bottom: 12px; }
    .absence-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .absence-col { background: var(--surface-2); border: 1px dashed var(--border); border-radius: var(--r-md); padding: 10px; min-height: 64px; }
    .absence-col-title { font-size: 12px; font-weight: 800; color: var(--ink-2); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
    .absence-col-title.-present { color: var(--green-ink); }
    .absence-col-body { display: flex; flex-wrap: wrap; gap: 6px; min-height: 28px; }
    .absence-pool { background: var(--surface-2); border-radius: var(--r-md); padding: 10px; margin-top: 10px; }

    .chip { font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: var(--r-pill); cursor: pointer; user-select: none; transition: filter .2s var(--ease); border: 1px solid transparent; }
    .chip:hover { filter: brightness(.97); }
    .chip.-present { background: var(--green-soft); color: var(--green-ink); border-color: rgba(16,185,129,.25); }
    .chip.-excused { background: var(--amber-soft); color: var(--amber-ink); border-color: rgba(245,158,11,.3); }
    .chip.-unexcused { background: var(--red-soft); color: var(--red-ink); border-color: rgba(239,68,68,.3); }
    .chip-empty { font-size: 11px; color: var(--ink-3); font-weight: 600; padding: 5px 4px; }

    /* فلاتر السجل */
    .log-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
    .log-filter-btn { border: 1px solid var(--border-soft); background: var(--surface); color: var(--ink-2); font-size: 12px; font-weight: 800; padding: 7px 14px; border-radius: var(--r-pill); cursor: pointer; transition: all .2s var(--ease); }
    .log-filter-btn.active { background: var(--ink); color: #fff; border-color: var(--ink); }

    /* Activity log */
    .timeline { position: relative; padding-right: 28px; }
    .timeline::before { content: ""; position: absolute; right: 8px; top: 6px; bottom: 6px; width: 2px; background: var(--border); border-radius: 2px; }
    .t-item { position: relative; padding-bottom: 22px; }
    .t-item:last-child { padding-bottom: 0; }
    .t-dot { position: absolute; right: -28px; top: 2px; width: 18px; height: 18px; border-radius: 50%; background: var(--surface); border: 3px solid var(--dot-color); box-shadow: 0 0 0 4px var(--bg); }
    .t-card { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--r-md); padding: 12px 16px; box-shadow: var(--shadow-xs); display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
    .t-title { font-weight: 800; font-size: 13px; margin-bottom: 3px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .t-sub { font-size: 12px; color: var(--ink-2); font-weight:600; }
    .t-time { font-family: var(--font-mono); font-size: 11px; font-weight:bold; color: var(--ink-3); white-space: nowrap; padding-top: 2px; direction:ltr; }

    .empty { text-align:center; padding: 34px 10px; color: var(--ink-3); font-size: 13px; font-weight: 700; }

    @media (max-width: 980px) { .kpis { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 640px) {
      .kpis { grid-template-columns: 1fr 1fr; gap: 12px; }
      .absence-grid { grid-template-columns: 1fr; }
      .card { flex-wrap: wrap; }
      .page-head { flex-direction: column; align-items: flex-start; }
    }
    /* تصميم بار الشهور السابقة الذكي */
    .previous-months-toggle { display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px dashed #cbd5e1; padding: 12px 16px; border-radius: 10px; cursor: pointer; margin: 15px 0 10px 0; font-weight: bold; color: #64748b; transition: all 0.2s ease; }
    .previous-months-toggle:hover { background: #f1f5f9; color: #475569; border-color: #94a3b8; }
    .previous-months-container { border-right: 3px solid #cbd5e1; padding-right: 15px; margin-bottom: 20px; display: none; flex-direction: column; gap: 10px; }
    .previous-months-container.is-active { display: flex; animation: fadeIn .4s var(--ease); }
    .previous-months-toggle .icon-chevron { transition: transform 0.2s ease; }
    .previous-months-toggle.is-active .icon-chevron { transform: rotate(180deg); }
  </style>
  `;

  // ============================================================
  // 10) الصفحة الرئيسية
  // ============================================================
  window.renderSecretaryPage = function () {
    const now = new Date();
    const todayLabel = formatDateLabel(now);

    const tasks = generateOccurrences();
    lastTasks = tasks;
    const pendingReports = getPendingReportSessions();
    const kpis = computeKPIs(tasks, pendingReports);
    const logEventsAll = buildLogEvents(tasks);
    const logEvents = filterLogEvents(logEventsAll, activeLogFilter);

    const subtabCounts = {
      current: tasks.current.length,
      upcoming: tasks.upcoming.length,
      reports: pendingReports.length,
      late: tasks.late.length
    };

    let subPanelHtml = "";
    if (activeSubTab === "upcoming") {
      subPanelHtml = tasks.upcoming.length
        ? tasks.upcoming.map(o => renderTaskCard(o, "upcoming")).join("")
        : emptyState("ph-calendar-blank", "لا توجد حلقات قادمة اليوم", "var(--accent)");
    } else if (activeSubTab === "reports") {
      subPanelHtml = pendingReports.length
        ? pendingReports.map(renderReportCard).join("")
        : emptyState("ph-file-check", "لا توجد تقارير معلقة", "var(--violet)");
    } else if (activeSubTab === "late") {
      // 🔥 اللوجيك الجديد: تقسيم المهام المتأخرة لشهر حالي وشهور سابقة
      const currentMonthLateTasks = [];
      const previousMonthsLateTasks = [];
      
      const now = new Date();
      
      tasks.late.forEach(occ => {
        const occDate = new Date(occ.dateStr);
        const isPrevious = occDate.getFullYear() < now.getFullYear() || 
                           (occDate.getFullYear() === now.getFullYear() && occDate.getMonth() < now.getMonth());
        if (isPrevious) {
          previousMonthsLateTasks.push(occ);
        } else {
          currentMonthLateTasks.push(occ);
        }
      });

      // بناء الـ HTML الخاص بالشهر الحالي
      if (currentMonthLateTasks.length > 0) {
        subPanelHtml += currentMonthLateTasks.map(o => renderTaskCard(o, "late")).join("");
      } else if (previousMonthsLateTasks.length === 0) {
        subPanelHtml = emptyState("ph-check-circle", "لا توجد مهام متأخرة، عمل ممتاز!", "var(--green)");
      }

      // بناء الأكورديون الخاص بالشهور السابقة (لو فيه)
      if (previousMonthsLateTasks.length > 0) {
        subPanelHtml += `
          <div class="previous-months-toggle" data-action="toggle_previous_months">
            <span style="display:flex; align-items:center; gap:8px;">
              <i class="ph-bold ph-hourglass-high" style="color:#f59e0b;"></i>
              مهام متأخرة من شهور سابقة (${previousMonthsLateTasks.length})
            </span>
            <i class="ph-bold ph-caret-down icon-chevron"></i>
          </div>
          <div class="previous-months-container" id="previousMonthsContainer">
            ${previousMonthsLateTasks.map(o => renderTaskCard(o, "late")).join("")}
          </div>
        `;
      }
    } else {
      subPanelHtml = tasks.current.length
        ? tasks.current.map(o => renderTaskCard(o, "current")).join("")
        : emptyState("ph-check-circle", "لا توجد حلقات بانتظار التأكيد", "var(--green)");
    }

    const logHtml = logEvents.length
      ? `<div class="timeline">${logEvents.map(renderLogItem).join("")}</div>`
      : emptyState("ph-clock-counter-clockwise", "لا يوجد نشاط مطابق للفلتر", "var(--ink-3)");

    return `
      ${SECRETARY_STYLES}
      <div class="sec-wrap exec-animate" id="secretaryRoot" style="--stagger: 1;">

        <div class="page-head">
          <div>
            <h1><span class="dot"></span>السكرتير الذكي</h1>
            <p>مركز القيادة اليومي · <span>${todayLabel}</span></p>
          </div>
          <div class="clock-chip">
            <i class="ph-duotone ph-clock"></i>
            <span id="sec-clock">${formatClock(now)}</span>
          </div>
        </div>

        <div class="kpis">
          ${kpiCard("ph-hourglass", "-amber", kpis.current, "مهام حالية")}
          ${kpiCard("ph-file-text", "-violet", kpis.unrecordedReports, "تقارير غير مسجلة")}
          ${kpiCard("ph-calendar-plus", "-blue", kpis.upcoming, "حلقات قادمة")}
          ${kpiCard("ph-warning", "-red", kpis.late, "متأخرة")}
          ${kpiCard("ph-check-circle", "-green", kpis.completedThisMonth, "مكتملة هذا الشهر")}
        </div>

        <div class="tabs-row">
          <div class="segmented" data-segmented="main">
            <div class="pill"></div>
            <button data-tab="tasks" class="${activeMainTab === "tasks" ? "active" : ""}">مهام اليوم</button>
            <button data-tab="log" class="${activeMainTab === "log" ? "active" : ""}">سجل النشاط</button>
          </div>
        </div>

        <div class="panel ${activeMainTab === "tasks" ? "active" : ""}">
          <div class="subtabs-row">
            <div class="segmented -sub" data-segmented="sub">
              <div class="pill"></div>
              <button data-subtab="current" class="${activeSubTab === "current" ? "active" : ""}">حالية <span class="count-badge">${subtabCounts.current}</span></button>
              <button data-subtab="upcoming" class="${activeSubTab === "upcoming" ? "active" : ""}">قادمة <span class="count-badge">${subtabCounts.upcoming}</span></button>
              <button data-subtab="reports" class="${activeSubTab === "reports" ? "active" : ""}">تقارير معلقة <span class="count-badge">${subtabCounts.reports}</span></button>
              <button data-subtab="late" class="${activeSubTab === "late" ? "active" : ""}">متأخرة <span class="count-badge">${subtabCounts.late}</span></button>
            </div>
          </div>
          <div class="cards">${subPanelHtml}</div>
        </div>

        <div class="panel ${activeMainTab === "log" ? "active" : ""}">
          <div class="log-filters">
            ${logFilterBtn("all", "الكل")}
            ${logFilterBtn("completed", "المكتملة")}
            ${logFilterBtn("incomplete", "غير المكتملة")}
            ${logFilterBtn("late_reports", "التقارير المتأخرة")}
            ${logFilterBtn("absence", "الغياب")}
          </div>
          ${logHtml}
        </div>

      </div>
    `;
  };

  // ============================================================
  // 11) التفاعلات + إعادة الحساب/العرض
  // ============================================================
  function positionPill(seg) {
    const active = seg.querySelector("button.active");
    const pill = seg.querySelector(".pill");
    if (!active || !pill) return;
    const segRect = seg.getBoundingClientRect();
    const btnRect = active.getBoundingClientRect();
    pill.style.width = btnRect.width + "px";
    pill.style.transform = `translateX(${-(segRect.right - btnRect.right - 4)}px)`;
  }

  function refresh() {
    const root = document.getElementById("secretaryRoot");
    if (!root) return;
    const scrollY = window.scrollY;
    root.outerHTML = window.renderSecretaryPage();
    mount();
    window.scrollTo(0, scrollY);
  }

  function onSecretaryClick(e) {
    const tabBtn = e.target.closest("[data-tab]");
    if (tabBtn) { activeMainTab = tabBtn.dataset.tab; refresh(); return; }

    const subBtn = e.target.closest("[data-subtab]");
    if (subBtn) { activeSubTab = subBtn.dataset.subtab; refresh(); return; }

    const filterBtn = e.target.closest("[data-logfilter]");
    if (filterBtn) { activeLogFilter = filterBtn.dataset.logfilter; refresh(); return; }

    const chip = e.target.closest(".chip");
    if (chip) {
      const key = chip.dataset.key;
      const pid = chip.dataset.student;
      const draft = absenceDrafts[key] || (absenceDrafts[key] = {});
      const cur = draft[pid] || "present";
      const next = cur === "present" ? "excused" : (cur === "excused" ? "unexcused" : "present");
      if (next === "present") delete draft[pid]; else draft[pid] = next;
      refresh();
      return;
    }

    const btn = e.target.closest("button[data-action]");
    if (!btn || btn.disabled) return;
    const action = btn.dataset.action;
    // 🔥 كود فتح وقفل أرشيف الشهور السابقة
    const toggleBtn = e.target.closest("[data-action='toggle_previous_months']");
    if (toggleBtn) {
      toggleBtn.classList.toggle('is-active');
      const container = document.getElementById("previousMonthsContainer");
      if (container) {
        container.classList.toggle('is-active');
      }
      return;
    }
    const key = btn.dataset.key;
    const card = btn.closest(".card");

    if (action === "ind_absent_prompt") {
      card.querySelector(".action-buttons").style.display = "none";
      card.querySelector(".action-absent-options").style.display = "flex";
      return;
    }
    if (action === "ind_cancel_absent") {
      card.querySelector(".action-buttons").style.display = "flex";
      card.querySelector(".action-absent-options").style.display = "none";
      return;
    }

    if (action === "cancel_task") {
      const occ = JSON.parse(decodeURIComponent(card.dataset.task));
      saveSession({
        mode: occ.mode,
        studentId: occ.mode === "individual" ? occ.id : undefined,
        groupId: occ.mode === "group" ? occ.id : undefined,
        groupName: occ.mode === "group" ? occ.name.replace("مجموعة: ", "") : undefined,
        sessionType: occ.sessionType,
        attendance: "cancelled", // حالة مخصصة بتمنعها من التأثير على الشيت
        cancelled: true,
        isReportPending: false, // مفيش تقرير هيتكتب ليها
        rating: 0,
        notes: "تم إلغاء وتجاهل المهمة (تخص شهر سابق)",
        date: new Date(`${occ.dateStr}T${minutesToTimeStr(occ.minutes)}`).toISOString()
      });
      refresh();
      return;
    }
    
    if (action === "ind_done") {
      const occ = JSON.parse(decodeURIComponent(card.dataset.task));
      const session = saveSession({
        mode: "individual",
        studentId: occ.id,
        sessionType: occ.sessionType,
        attendance: "present",
        isReportPending: true,
        rating: 0,
        notes: "مسجلة بواسطة السكرتير الذكي (حضور)",
        date: new Date(`${occ.dateStr}T${minutesToTimeStr(occ.minutes)}`).toISOString()
      });
      pendingChoice = { taskKey: occ.taskKey, sessionId: session.id };
      refresh();
      return;
    }

    if (action === "ind_absent_excused" || action === "ind_absent_unexcused") {
      const occ = JSON.parse(decodeURIComponent(card.dataset.task));
      const attendance = action === "ind_absent_excused" ? "absent_excused" : "absent_unexcused";
      saveSession({
        mode: "individual",
        studentId: occ.id,
        sessionType: occ.sessionType,
        attendance,
        isReportPending: false,
        rating: 0,
        notes: `مسجلة بواسطة السكرتير الذكي (${attendance === "absent_excused" ? "غياب بعذر" : "غياب بدون عذر"})`,
        date: new Date(`${occ.dateStr}T${minutesToTimeStr(occ.minutes)}`).toISOString()
      });
      refresh();
      return;
    }

    if (action === "group_full") {
      const occ = JSON.parse(decodeURIComponent(card.dataset.task));
      const session = saveSession({
        mode: "group",
        groupId: occ.id,
        groupName: occ.name.replace("مجموعة: ", ""),
        sessionType: occ.sessionType,
        attendance: "present",
        isReportPending: true,
        participants: (occ.participants || []).map(pid => ({ studentId: pid, present: true, attendance: "present", rating: 0, notes: "" })),
        notes: "مسجلة بواسطة السكرتير الذكي (حضور كامل)",
        date: new Date(`${occ.dateStr}T${minutesToTimeStr(occ.minutes)}`).toISOString()
      });
      pendingChoice = { taskKey: occ.taskKey, sessionId: session.id };
      refresh();
      return;
    }

    if (action === "group_partial") {
      const occ = JSON.parse(decodeURIComponent(card.dataset.task));
      expandedAbsence = occ.taskKey;
      if (!absenceDrafts[occ.taskKey]) absenceDrafts[occ.taskKey] = {};
      refresh();
      return;
    }

    if (action === "cancel_group_absence") {
      expandedAbsence = null;
      delete absenceDrafts[key];
      refresh();
      return;
    }

    if (action === "save_group_absence") {
      const allOcc = [...lastTasks.current, ...lastTasks.late, ...lastTasks.upcoming];
      const occ = allOcc.find(o => o.taskKey === key);
      if (!occ) { expandedAbsence = null; refresh(); return; }

      const draft = absenceDrafts[key] || {};
      const participants = (occ.participants || []).map(pid => {
        const state = draft[pid] || "present";
        return { studentId: pid, present: state === "present", attendance: state, rating: 0, notes: "" };
      });
      const anyAbsent = participants.some(p => p.attendance !== "present");

      const session = saveSession({
        mode: "group",
        groupId: occ.id,
        groupName: occ.name.replace("مجموعة: ", ""),
        sessionType: occ.sessionType,
        attendance: anyAbsent ? "mixed" : "present",
        isReportPending: true,
        participants,
        notes: "مسجلة بواسطة السكرتير الذكي (حضور جزئي)",
        date: new Date(`${occ.dateStr}T${minutesToTimeStr(occ.minutes)}`).toISOString()
      });

      expandedAbsence = null;
      delete absenceDrafts[key];
      pendingChoice = { taskKey: occ.taskKey, sessionId: session.id };
      refresh();
      return;
    }

    if (action === "report_now") {
      const sessionId = btn.dataset.session;
      window.dispatchEvent(new CustomEvent("secretary:openEvaluation", { detail: { sessionId } }));
      if (window.router && typeof window.router.navigate === "function") {
        try { window.router.navigate("evaluation", { sessionId }); } catch (err) { /* تجاهل */ }
      }
      if (key) pendingChoice = null;
      refresh();
      return;
    }

    if (action === "report_later") {
      pendingChoice = null;
      showToastSafe("تم الحفظ، الحلقة بانتظار التقرير في قسم (تقارير معلقة)");
      refresh();
      return;
    }
  }

  function mount() {
    const root = document.getElementById("secretaryRoot");
    if (!root) return;

    root.addEventListener("click", onSecretaryClick);
    root.querySelectorAll("[data-segmented]").forEach(seg => setTimeout(() => positionPill(seg), 30));

    if (!clockStarted) {
      clockStarted = true;
      setInterval(() => {
        const el = document.getElementById("sec-clock");
        if (el) el.textContent = formatClock(new Date());
      }, 60000);
    }
  }

  window.initSecretaryPage = function () {
    mount();
  };

  // متاحة لأي شاشة تانية (مثلاً شاشة التقييم) عشان تحدّث السكرتير الذكي بعد
  // ما تحفظ تقرير أكاديمي وتخلي isReportPending = false
  window.refreshSecretaryPage = refresh;

})();
