// ==========================================
// شاشة السكرتير الذكي (Smart Secretary Engine v2.0)
// ==========================================
(function () {
  "use strict";

  // دالة مساعدة لتوحيد النصوص (للأيام)
  function normalizeArabic(text) {
    if (!text) return "";
    return text.trim().replace(/[أإآ]/g, "ا").replace(/ة$/g, "ه");
  }

  // تحويل الوقت من "HH:MM AM/PM" أو "HH:MM" إلى دقائق لتسهيل المقارنة
  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    if (timeStr.includes(':') && !timeStr.includes('AM') && !timeStr.includes('PM') && !timeStr.includes('م') && !timeStr.includes('ص')) {
       let [h, m] = timeStr.split(':').map(Number);
       return h * 60 + m;
    }
    let [time, period] = timeStr.split(" ");
    if(!time || !period) return 0;
    let [h, m] = time.split(":").map(Number);
    if ((period === "PM" || period === "م") && h !== 12) h += 12;
    if ((period === "AM" || period === "ص") && h === 12) h = 0;
    return h * 60 + m;
  }

  const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  
  // 🔥 المحرك الأساسي: جلب مهام اليوم من الطلاب والمجموعات 🔥
  function getTodayTasks() {
    const todayIndex = new Date().getDay();
    const todayName = DAYS_AR[todayIndex];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let pending = [];
    let upcoming = [];

    const students = window.appState?.students || [];
    const groups = window.appState?.groups || [];
    const sessions = window.appState?.sessions || [];
    
    // التاريخ اليوم بصيغة YYYY-MM-DD للمقارنة مع الجلسات المسجلة
    const todayString = now.toISOString().split("T")[0];

    // دالة مساعدة لمعرفة هل تم تسجيل الجلسة دي النهاردة ولا لأ
    const isSessionRecorded = (id, mode) => {
       return sessions.some(s => {
          if (!s.date || !s.date.startsWith(todayString)) return false;
          if (mode === "individual") return s.studentId === id;
          if (mode === "group") return s.groupId === id;
          return false;
       });
    };

    // 1. جلب مهام الطلاب الفردية
    students.forEach(student => {
      let schedules = [];
      const qEnabled = student.quranEnabled !== undefined ? student.quranEnabled : ((student.quranLimit || student.sessionLimit) > 0);
      const iEnabled = student.islamicEnabled !== undefined ? student.islamicEnabled : ((student.islamicLimit || 0) > 0);

      if (qEnabled && Array.isArray(student.quranSchedule)) {
        schedules.push(...student.quranSchedule.map(s => ({...s, type: 'قرآن', sessionType: 'quran', icon: 'ph-book-open-text', color: '-green'})));
      } else if (qEnabled && Array.isArray(student.schedule)) { // توافق رجعي
        schedules.push(...student.schedule.map(s => ({...s, type: 'قرآن', sessionType: 'quran', icon: 'ph-book-open-text', color: '-green'})));
      }
      
      if (iEnabled && Array.isArray(student.islamicSchedule)) {
        schedules.push(...student.islamicSchedule.map(s => ({...s, type: 'تربية', sessionType: 'islamic', icon: 'ph-heart', color: '-blue'})));
      }

      schedules.forEach(sched => {
        if (normalizeArabic(sched.day) === normalizeArabic(todayName)) {
          // لو الجلسة متسجلة أصلاً النهاردة، عديها (متعرضهاش كمهام)
          if (isSessionRecorded(student.id, "individual")) return;

          let sessionMinutes = timeToMinutes(sched.time);
          let taskObj = {
            mode: "individual",
            id: student.id,
            name: student.name,
            gender: student.gender,
            time: sched.time,
            type: sched.type,
            sessionType: sched.sessionType,
            icon: sched.icon,
            color: sched.color,
            minutes: sessionMinutes
          };

          // فترة سماح 15 دقيقة قبل الموعد عشان تبدأ تظهر في "بانتظار التأكيد"
          if (currentMinutes >= sessionMinutes - 15) pending.push(taskObj);
          else upcoming.push(taskObj);
        }
      });
    });

    // 2. جلب مهام المجموعات (لو إنت ضايف ليهم مواعيد - افتراضياً بنعتبر المجموعة ليها نفس نظام المواعيد)
    // لاحظ: لو إنت لسه مضفتش حقل "مواعيد" للمجموعات، الكود ده هيكون جاهز ليها مستقبلاً.
    groups.forEach(group => {
       if (group.schedule && Array.isArray(group.schedule)) {
          group.schedule.forEach(sched => {
             if (normalizeArabic(sched.day) === normalizeArabic(todayName)) {
                if (isSessionRecorded(group.id, "group")) return;

                let sessionMinutes = timeToMinutes(sched.time);
                let taskObj = {
                   mode: "group",
                   id: group.id,
                   name: `مجموعة: ${group.name}`,
                   gender: "group",
                   time: sched.time,
                   type: sched.type || 'قرآن',
                   sessionType: sched.sessionType || 'quran',
                   icon: 'ph-users-three',
                   color: '-amber', // لون مميز للمجموعات
                   minutes: sessionMinutes,
                   participants: group.studentIds || []
                };

                if (currentMinutes >= sessionMinutes - 15) pending.push(taskObj);
                else upcoming.push(taskObj);
             }
          });
       }
    });

    // ترتيب المهام حسب الوقت
    pending.sort((a, b) => a.minutes - b.minutes);
    upcoming.sort((a, b) => a.minutes - b.minutes);

    return { pending, upcoming };
  }

  window.renderSecretaryPage = function () {
    const todayDate = new Date();
    const todayLabel = typeof formatArDate === "function" ? formatArDate(todayDate.toISOString()) : todayDate.toLocaleDateString('ar-EG');
    
    const tasks = getTodayTasks();
    const pendingCount = tasks.pending.length;
    const upcomingCount = tasks.upcoming.length;
    const reportsCount = 0; // سيتم ربطها بالتقارير المعلقة لاحقاً
    const totalToday = pendingCount + upcomingCount + reportsCount;

    // بناء كروت Pending (بانتظار التأكيد)
    let pendingHtml = tasks.pending.length > 0 ? tasks.pending.map(task => {
        let isGroup = task.mode === 'group';
        let isFemale = task.gender === 'girl' || task.gender === 'female';
        
        let avColor1 = isGroup ? '#f59e0b' : (isFemale ? '#ec4899' : '#0ea5e9');
        let avColor2 = isGroup ? '#fef3c7' : (isFemale ? '#fbcfe8' : '#bae6fd');
        let init = isGroup ? '<i class="ph-bold ph-users-three"></i>' : task.name.substring(0, 2);
        let tagColor = isGroup ? '-amber' : '-blue';

        // داتا مخفية هنستخدمها في الحفظ
        let encodedTask = encodeURIComponent(JSON.stringify(task));

        return `
        <div class="card ${isGroup ? '-amber' : task.color}" data-task="${encodedTask}">
          <div class="avatar" style="--av1:${avColor1};--av2:${avColor2}">${init}</div>
          <div class="card-body">
            <div class="name">${task.name} <span class="tag ${tagColor}">${isGroup ? 'مجموعة' : 'فردي'}</span></div>
            <div class="meta"><span class="time" dir="ltr">${task.time}</span><span class="sep">·</span>حصة ${task.type}</div>
          </div>
          <div class="card-actions action-buttons">
            <button class="btn -green" data-action="done"><i class="ph-bold ph-check"></i>حضور</button>
            <button class="btn -red-ghost" data-action="absent_prompt"><i class="ph-bold ph-x"></i>غياب</button>
          </div>
          <div class="card-actions action-absent-options" style="display:none; width:100%; justify-content:flex-end;">
            <button class="btn" style="background:#f1f5f9; color:#475569;" data-action="absent_excused">بعذر</button>
            <button class="btn -red-ghost" data-action="absent_unexcused">بدون عذر</button>
            <button class="btn" style="background:transparent; color:#94a3b8; padding:8px; font-size:16px;" data-action="cancel_absent"><i class="ph-bold ph-x"></i></button>
          </div>
        </div>
        `;
    }).join('') : `<div class="empty"><i class="ph-duotone ph-check-circle" style="font-size:32px; color:var(--green); margin-bottom:8px; display:block;"></i><br><span>لا توجد حلقات معلقة حالياً</span></div>`;

    // بناء كروت Upcoming (قادمة)
    let upcomingHtml = tasks.upcoming.length > 0 ? tasks.upcoming.map(task => {
        let isGroup = task.mode === 'group';
        let isFemale = task.gender === 'girl' || task.gender === 'female';
        
        let avColor1 = isGroup ? '#f59e0b' : (isFemale ? '#ec4899' : '#0ea5e9');
        let avColor2 = isGroup ? '#fef3c7' : (isFemale ? '#fbcfe8' : '#bae6fd');
        let init = isGroup ? '<i class="ph-bold ph-users-three"></i>' : task.name.substring(0, 2);

        return `
        <div class="card ${isGroup ? '-amber' : task.color} -info">
          <div class="avatar" style="--av1:${avColor1};--av2:${avColor2}">${init}</div>
          <div class="card-body">
            <div class="name">${task.name}</div>
            <div class="meta"><span class="time" dir="ltr">${task.time}</span><span class="sep">·</span>حصة ${task.type}</div>
          </div>
          <div class="card-actions" style="color:var(--ink-3); font-weight:bold; font-size:12px;">قادمة لاحقاً</div>
        </div>
        `;
    }).join('') : `<div class="empty"><i class="ph-duotone ph-calendar-blank" style="font-size:32px; color:var(--accent); margin-bottom:8px; display:block;"></i><br><span>لا توجد حلقات قادمة اليوم</span></div>`;


    const claudeStyles = `
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

      .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 34px; }
      .kpi { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--r-lg); padding: 20px; box-shadow: var(--shadow-sm); position: relative; overflow: hidden; transition: transform .3s var(--ease), box-shadow .3s var(--ease); }
      .kpi:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
      .kpi .icon { width: 36px; height: 36px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size:18px;}
      .kpi.-amber .icon { background: var(--amber-soft); color: var(--amber-ink); }
      .kpi.-ink .icon { background: rgba(29,29,31,.06); color: var(--ink); }
      .kpi.-blue .icon { background: var(--accent-soft); color: var(--accent-ink); }
      .kpi.-green .icon { background: var(--green-soft); color: var(--green-ink); }

      .kpi .value { font-family: var(--font-display); font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
      .kpi .label { font-size: 13px; color: var(--ink-2); font-weight: 600; }

      .tabs-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; flex-wrap: wrap; gap: 14px; }
      .segmented { position: relative; display: inline-flex; background: rgba(118,118,128,.12); border-radius: var(--r-pill); padding: 4px; gap: 2px; }
      .segmented .pill { position: absolute; top: 4px; bottom: 4px; right: 4px; width: 120px; background: var(--surface); border-radius: var(--r-pill); box-shadow: 0 2px 6px rgba(0,0,0,.12); transition: transform .3s var(--ease), width .3s var(--ease); }
      .segmented button { position: relative; z-index: 1; border: none; background: transparent; padding: 8px 18px; font-size: 13px; font-weight: 800; color: var(--ink-2); border-radius: var(--r-pill); cursor: pointer; transition: color .3s var(--ease); white-space: nowrap; }
      .segmented button.active { color: var(--ink); }

      .today-chip { font-size: 12px; font-weight:bold; color: var(--ink-2); background: var(--surface); border: 1px solid var(--border-soft); padding: 6px 14px; border-radius: var(--r-pill); box-shadow: var(--shadow-xs); }

      .panel { display: none; }
      .panel.active { display: block; animation: fadeIn .4s var(--ease); }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

      .section { margin-bottom: 30px; }
      .section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding: 0 2px; }
      .section-head h2 { font-family: var(--font-display); font-size: 16px; font-weight: 800; margin: 0; }
      .section-head .count { font-size: 12px; font-weight: 800; padding: 2px 9px; border-radius: var(--r-pill); }
      .section.-pending .count { background: var(--amber-soft); color: var(--amber-ink); }
      .section.-reports .count { background: var(--red-soft); color: var(--red-ink); }
      .section.-upcoming .count { background: var(--accent-soft); color: var(--accent-ink); }

      .cards { display: flex; flex-direction: column; gap: 10px; }

      .card { position: relative; display: flex; align-items: center; gap: 16px; background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--r-md); padding: 16px; box-shadow: var(--shadow-xs); transition: box-shadow .3s var(--ease), transform .3s var(--ease), opacity .4s var(--ease); overflow: hidden; flex-wrap:wrap;}
      .card:hover { box-shadow: var(--shadow-sm); }
      .card::before { content: ""; position: absolute; right: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px 0 0 4px; }
      .card.-amber::before { background: var(--amber); }
      .card.-red::before { background: var(--red); }
      .card.-blue::before { background: var(--accent); }
      .card.-green::before { background: var(--green); }
      .card.-resolved { opacity: .55; transform: scale(.99); }
      .card.-leaving { opacity: 0; transform: translateX(-14px) scale(.97); max-height: 0; padding-top: 0; padding-bottom: 0; margin: 0; border-width: 0; }

      .avatar { width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; color: #fff; background: linear-gradient(150deg, var(--av1), var(--av2)); }

      .card-body { flex: 1; min-width: 150px; }
      .card-body .name { font-weight: 800; font-size: 14px; margin-bottom: 3px; display: flex; align-items: center; gap: 8px; }
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

      .status-badge { font-size: 12px; font-weight: 800; padding: 6px 12px; border-radius: var(--r-pill); display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
      .status-badge.-green { background: var(--green-soft); color: var(--green-ink); }
      .status-badge.-red { background: var(--red-soft); color: var(--red-ink); }

      /* Activity log */
      .timeline { position: relative; padding-right: 28px; }
      .timeline::before { content: ""; position: absolute; right: 8px; top: 6px; bottom: 6px; width: 2px; background: linear-gradient(var(--border), var(--border)); border-radius: 2px; }
      .t-item { position: relative; padding-bottom: 22px; }
      .t-item:last-child { padding-bottom: 0; }
      .t-dot { position: absolute; right: -28px; top: 2px; width: 18px; height: 18px; border-radius: 50%; background: var(--surface); border: 3px solid var(--dot-color); box-shadow: 0 0 0 4px var(--bg); }
      .t-card { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--r-md); padding: 12px 16px; box-shadow: var(--shadow-xs); display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
      .t-card.-new { animation: slideIn .5s var(--ease); }
      @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      .t-title { font-weight: 800; font-size: 13px; margin-bottom: 3px; }
      .t-sub { font-size: 12px; color: var(--ink-2); font-weight:600; }
      .t-time { font-family: var(--font-mono); font-size: 11px; font-weight:bold; color: var(--ink-3); white-space: nowrap; padding-top: 2px; direction:ltr; }

      @media (max-width: 880px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 640px) {
        .kpis { grid-template-columns: 1fr 1fr; gap: 12px; }
        .card { flex-wrap: wrap; }
        .page-head { flex-direction: column; align-items: flex-start; }
      }
    </style>
    `;

    return `
      ${claudeStyles}
      <div class="sec-wrap exec-animate" style="--stagger: 1;">
        
        <div class="page-head">
          <div>
            <h1><span class="dot"></span>السكرتير الذكي</h1>
            <p>موجز مهام اليوم · <span>${todayLabel}</span></p>
          </div>
          <div class="clock-chip">
            <i class="ph-duotone ph-clock"></i>
            <span id="sec-clock">--:--</span>
          </div>
        </div>

        <div class="kpis">
          <div class="kpi -amber">
            <div class="icon"><i class="ph-duotone ph-hourglass"></i></div>
            <div class="value" id="kpiPending">${pendingCount}</div>
            <div class="label">مهام معلقة</div>
          </div>
          <div class="kpi -ink">
            <div class="icon"><i class="ph-duotone ph-file-text"></i></div>
            <div class="value" id="kpiReports">${reportsCount}</div>
            <div class="label">تقارير غياب</div>
          </div>
          <div class="kpi -blue">
            <div class="icon"><i class="ph-duotone ph-calendar-plus"></i></div>
            <div class="value" id="kpiUpcoming">${upcomingCount}</div>
            <div class="label">حلقات قادمة</div>
          </div>
          <div class="kpi -green">
            <div class="icon"><i class="ph-duotone ph-check-circle"></i></div>
            <div class="value"><span id="kpiCompletion">0</span>%</div>
            <div class="label">معدل الإنجاز</div>
          </div>
        </div>

        <div class="tabs-row">
          <div class="segmented" id="sec-segmented">
            <div class="pill" id="sec-pill"></div>
            <button class="active" data-tab="tasks" id="tabBtnTasks">مهام اليوم</button>
            <button data-tab="log" id="tabBtnLog">سجل النشاط</button>
          </div>
          <div class="today-chip" id="pendingChip">${pendingCount > 0 ? `${pendingCount} بانتظار التأكيد` : 'لا توجد مهام'}</div>
        </div>

        <!-- TASKS PANEL -->
        <div class="panel active" id="panel-tasks">
          
          <div class="section -pending">
            <div class="section-head">
              <h2>بانتظار التأكيد</h2>
              <span class="count" id="countPending">${pendingCount}</span>
            </div>
            <div class="cards" id="pendingList">
               ${pendingHtml}
            </div>
          </div>

          <div class="section -upcoming">
            <div class="section-head">
              <h2>قادمة لاحقاً</h2>
              <span class="count" id="countUpcoming">${upcomingCount}</span>
            </div>
            <div class="cards" id="upcomingList">
               ${upcomingHtml}
            </div>
          </div>

        </div>

        <!-- LOG PANEL -->
        <div class="panel" id="panel-log">
          <div class="timeline" id="sec-timeline">
             <div class="empty" id="emptyLog"><i class="ph-duotone ph-clock-counter-clockwise" style="font-size:32px; color:var(--ink-3); margin-bottom:8px; display:block;"></i><br><span>لا يوجد نشاط مسجل اليوم</span></div>
          </div>
        </div>

      </div>
    `;
  };

  // دالة تشغيل الأوامر الديناميكية للسكرتير
  window.initSecretaryPage = function () {
    // 1. الساعة
    function pad(n) { return n.toString().padStart(2, "0"); }
    function renderClock() {
      const clockEl = document.getElementById("sec-clock");
      if (!clockEl) return;
      const now = new Date();
      let h = now.getHours();
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      clockEl.textContent = `${pad(h)}:${pad(now.getMinutes())} ${ampm}`;
    }
    renderClock();
    setInterval(renderClock, 60000);

    // 2. التابات
    const segmented = document.getElementById("sec-segmented");
    const pill = document.getElementById("sec-pill");
    const tabBtns = segmented?.querySelectorAll("button");
    const panels = { tasks: document.getElementById("panel-tasks"), log: document.getElementById("panel-log") };

    function movePill(btn) {
      if (!segmented || !pill || !btn) return;
      const segRect = segmented.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      pill.style.width = btnRect.width + "px";
      pill.style.transform = `translateX(${-(segRect.right - btnRect.right - 4)}px)`;
    }

    tabBtns?.forEach(btn => {
      btn.addEventListener("click", () => {
        tabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        Object.entries(panels).forEach(([key, el]) => {
            if(el) el.classList.toggle("active", key === btn.dataset.tab);
        });
        movePill(btn);
      });
    });

    if(tabBtns && tabBtns.length > 0) setTimeout(() => movePill(tabBtns[0]), 100);

    // 3. التفاعلات (تسجيل الحضور والغياب)
    let state = {
      pending: document.querySelectorAll('#pendingList .card').length,
      completedToday: 0
    };
    let totalInitial = state.pending;

    function recalc() {
      const kpiPending = document.getElementById("kpiPending");
      const kpiCompletion = document.getElementById("kpiCompletion");
      const countPending = document.getElementById("countPending");
      const pendingChip = document.getElementById("pendingChip");

      if(kpiPending) kpiPending.textContent = state.pending;
      if(countPending) countPending.textContent = state.pending;
      if(pendingChip) {
          pendingChip.textContent = state.pending > 0 ? `${state.pending} بانتظار التأكيد` : "تم إنجاز كل المهام";
      }
      if(kpiCompletion && totalInitial > 0) {
          const rate = Math.round((state.completedToday / totalInitial) * 100);
          kpiCompletion.textContent = rate;
      }
    }

    function addLogEntry(color, title, sub) {
      const timeline = document.getElementById("sec-timeline");
      const emptyLog = document.getElementById("emptyLog");
      if(emptyLog) emptyLog.remove();

      const now = new Date();
      let h = now.getHours();
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      const timeStr = `${pad(h)}:${pad(now.getMinutes())} ${ampm}`;

      const item = document.createElement("div");
      item.className = "t-item";
      item.innerHTML = `
        <div class="t-dot" style="--dot-color:${color}"></div>
        <div class="t-card -new">
          <div>
            <div class="t-title">${title}</div>
            <div class="t-sub">${sub}</div>
          </div>
          <div class="t-time">${timeStr}</div>
        </div>`;
      timeline.insertBefore(item, timeline.firstChild);
    }

    const tasksPanel = document.getElementById('panel-tasks');
    if(tasksPanel) {
        tasksPanel.addEventListener("click", (e) => {
          const btn = e.target.closest("button[data-action]");
          if(!btn) return;
          
          const action = btn.dataset.action;
          const card = btn.closest(".card");
          if (!card) return;

          const taskData = JSON.parse(decodeURIComponent(card.dataset.task));
          const name = taskData.name;
          const context = `حصة ${taskData.type} · ${taskData.time}`;
          const isDone = action === "done";
          
          // إظهار خيارات الغياب
          if (action === "absent_prompt") {
             card.querySelector('.action-buttons').style.display = 'none';
             card.querySelector('.action-absent-options').style.display = 'flex';
             return;
          }
          
          // التراجع عن الغياب
          if (action === "cancel_absent") {
             card.querySelector('.action-buttons').style.display = 'flex';
             card.querySelector('.action-absent-options').style.display = 'none';
             return;
          }

          let attendanceStatus = "present";
          if (action === "absent_excused") attendanceStatus = "absent_excused";
          if (action === "absent_unexcused") attendanceStatus = "absent_unexcused";

          const actionsEl = card.querySelector(".card-actions");
          // إخفاء كل الأزرار ووضع الـ Badge
          card.querySelectorAll('.card-actions').forEach(el => el.style.display = 'none');
          
          const badgeEl = document.createElement('div');
          badgeEl.className = 'card-actions';
          badgeEl.innerHTML = isDone
            ? `<span class="status-badge -green"><i class="ph-bold ph-check"></i>تم التسجيل</span>`
            : `<span class="status-badge -red"><i class="ph-bold ph-x"></i>سُجل غياب</span>`;
          card.appendChild(badgeEl);
          
          card.classList.remove("-amber", "-blue");
          card.classList.add(isDone ? "-green" : "-red", "-resolved");

          state.pending -= 1;
          state.completedToday += 1;
          recalc();

          let logActionStr = isDone ? "حضور" : (attendanceStatus === "absent_excused" ? "غياب (بعذر)" : "غياب (بدون عذر)");
          addLogEntry(
            isDone ? "var(--green)" : "var(--red)",
            `تم تسجيل ${logActionStr}: ${name}`,
            `(${context}) - مكتملة`
          );

          // 🔥 تسجيل الجلسة فعلياً في قاعدة البيانات 🔥
          if (window.appState) {
              const newSession = {
                  id: `sess-${Date.now()}`,
                  date: new Date().toISOString(),
                  mode: taskData.mode,
                  sessionType: taskData.sessionType,
                  attendance: attendanceStatus,
                  rating: isDone ? 5 : 0, 
                  notes: `مسجلة بواسطة السكرتير الذكي (${logActionStr})`
              };

              if (taskData.mode === "individual") {
                  newSession.studentId = taskData.id;
              } else if (taskData.mode === "group") {
                  newSession.groupId = taskData.id;
                  newSession.groupName = taskData.name.replace('مجموعة: ', '');
                  newSession.participants = (taskData.participants || []).map(pid => ({
                      studentId: pid,
                      present: isDone,
                      attendance: attendanceStatus,
                      rating: isDone ? 5 : 0,
                      notes: ""
                  }));
              }

              if(!window.appState.sessions) window.appState.sessions = [];
              window.appState.sessions.push(newSession);
              
              if(window.dbModule && window.dbModule.addSession) {
                  window.dbModule.addSession(newSession).catch(err => console.error(err));
              }
              if(typeof showToast === 'function') showToast("تم تسجيل الجلسة بنجاح");
          }

          setTimeout(() => {
              card.classList.add("-leaving");
              setTimeout(() => card.remove(), 400);
          }, 1000);
        });
    }
  };

})();
