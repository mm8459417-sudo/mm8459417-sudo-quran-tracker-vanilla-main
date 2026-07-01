(function () {
  // دالة تنظيف وتوحيد نصوص اللغة العربية (لضمان تطابق الأيام 100%)
  function normalizeArabic(text) {
    if (!text) return "";
    return text.trim()
      .replace(/[أإآ]/g, "ا") // تحويل أ، إ، آ إلى ا عادية
      .replace(/ة$/g, "ه");   // احتياطاً للتاء المربوطة والهاء
  }

  // دالة لضبط شكل الوقت وتحويله لنظام 12 ساعة
  function formatTime(timeStr) {
    if (!timeStr) return "--:--";
    if (timeStr.includes('م') || timeStr.includes('ص') || timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    let [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    if (isNaN(h)) return timeStr;
    let ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    
    // تنسيق الدقائق لتكون دائماً من رقمين (مثال: 05 بدل 5)
    let m = parseInt(minutes);
    let formattedM = m < 10 ? '0' + m : m;
    
    // تنسيق الساعات لتكون دائماً من رقمين (اختياري، يفضله البعض في التصميم الإنجليزي)
    let formattedH = h < 10 ? '0' + h : h;

    return `${formattedH}:${formattedM} ${ampm}`;
  }

  // دالة مساعدة لتحويل الوقت لدقائق لغرض الترتيب تصاعدياً
  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    // لو الوقت بنظام 24 ساعة (وهذا ما يتم حفظه في قاعدة البيانات من الـ input type="time")
    if (timeStr.includes(':') && !timeStr.includes('AM') && !timeStr.includes('PM') && !timeStr.includes('م') && !timeStr.includes('ص')) {
       let [h, m] = timeStr.split(':').map(Number);
       return h * 60 + m;
    }
    // لو الوقت بنظام 12 ساعة
    let [time, period] = timeStr.split(" ");
    if(!time || !period) return 0;
    let [h, m] = time.split(":").map(Number);
    if ((period === "PM" || period === "م") && h !== 12) h += 12;
    if ((period === "AM" || period === "ص") && h === 12) h = 0;
    return h * 60 + m;
  }

  window.renderSchedulePage = function () {
    // الأيام بالترتيب (من الأحد للسبت كما في تصميم Claude)
    const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

    let autoScheduleItems = [];
    let students = window.appState?.students || [];
    let sessions = window.appState?.sessions || [];

    // سحب البيانات من الطلاب وفصل القرآن عن التربية
    students.forEach((student) => {
        let studentSessionsCount = sessions.filter(s => s.participant && s.participant.id === student.id).length;

        // 1. استخراج مواعيد القرآن (أو المواعيد القديمة للطلاب اللي متحدثوش)
        if (student.quranEnabled !== false) {
            let qSched = (Array.isArray(student.quranSchedule) && student.quranSchedule.length > 0)
                ? student.quranSchedule 
                : (Array.isArray(student.schedule) ? student.schedule : []); // دعم للطلاب القدامى

            qSched.forEach(s => {
                if (s.day && s.time) {
                    autoScheduleItems.push({
                        type: 'quran',
                        day: s.day,
                        time: s.time,
                        student: student.name,
                        gender: student.gender,
                        sessionsCount: studentSessionsCount
                    });
                }
            });
        }

        // 2. استخراج مواعيد التربية
        if (student.islamicEnabled === true) {
            let iSched = Array.isArray(student.islamicSchedule) ? student.islamicSchedule : [];
            iSched.forEach(s => {
                if (s.day && s.time) {
                    autoScheduleItems.push({
                        type: 'islamic',
                        day: s.day,
                        time: s.time,
                        student: student.name,
                        gender: student.gender,
                        sessionsCount: studentSessionsCount
                    });
                }
            });
        }
    });

    // Icons from Claude's design
    const ICONS = {
      book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5C2 4.67 2.67 4 3.5 4H9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2V5.5Z"/><path d="M22 5.5C22 4.67 21.33 4 20.5 4H15a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22V5.5Z"/></svg>`,
      star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.7 19.8l1-6.1L3.3 9.4l6.1-.9L12 3Z"/></svg>`,
      empty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>`
    };

    const TYPE_META = {
      quran: { cardClass: "quran-card", badge: "قرآن كريم", icon: ICONS.book },
      islamic: { cardClass: "islamic-card", badge: "تربية وسلوك", icon: ICONS.star }
    };

    // تحديد يومنا الحالي (0 = الأحد, 6 = السبت)
    const todayIndex = new Date().getDay();

    // بناء أعمدة الجدول
    let daysHtml = DAYS.map((dayName, index) => {
      // فلترة الحلقات الخاصة بهذا اليوم (بناءً على الاسم الموحد)
      let daySessions = autoScheduleItems.filter(item => normalizeArabic(item.day) === normalizeArabic(dayName));

      // ترتيب الحلقات داخل اليوم الواحد تصاعدياً حسب الوقت
      daySessions.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

      // بناء كروت الحلقات
      let sessionsHtml = '';
      if (daySessions.length === 0) {
        sessionsHtml = `
          <div class="empty-state">
            ${ICONS.empty}<span>لا توجد حلقات مبرمجة</span>
          </div>`;
      } else {
        sessionsHtml = daySessions.map((session) => {
           const meta = TYPE_META[session.type];
           const formattedTime = formatTime(session.time);
           // الاكتفاء بالاسم الأول والثاني فقط
           const shortName = session.student.split(' ').slice(0, 2).join(' ');
           
           return `
             <div class="session-card ${meta.cardClass}" tabindex="0">
               <div class="card-top-row">
                 <div class="card-icon">${meta.icon}</div>
                 <span class="card-badge">${meta.badge}</span>
               </div>
               <div class="card-time">${formattedTime}</div>
               <div class="card-student">${shortName}</div>
             </div>
           `;
        }).join('');
      }

      // بناء العمود بالكامل
      return `
        <div class="day-column ${index === todayIndex ? 'is-today' : ''}">
          <div class="day-column-header">
            <span class="day-name">${dayName}</span>
            ${index === todayIndex
              ? '<span class="today-pill">اليوم</span>'
              : `<span class="session-count">${daySessions.length > 0 ? daySessions.length + ' حلقات' : ''}</span>`}
          </div>
          <div class="session-list">
             ${sessionsHtml}
          </div>
        </div>
      `;
    }).join('');

    const styles = `
      <style>
        :root {
          --bg-page: #F6F7F9;
          --surface: #FFFFFF;
          --surface-muted: #F1F3F6;
          --border-subtle: #E7EAEE;
          --text-primary: #1C232B;
          --text-secondary: #6B7280;
          --text-tertiary: #A1A8B3;

          --emerald-bg: #ECFDF5;
          --emerald-border: #B7EFD3;
          --emerald-strong: #059669;
          --emerald-deep: #047857;

          --sky-bg: #EFF8FF;
          --sky-border: #C3E6FB;
          --sky-strong: #0284C7;
          --sky-deep: #0369A1;

          --today-accent: #F59E0B;
          --today-accent-bg: #FFFBEB;

          --radius-lg: 20px;
          --radius-md: 14px;
          --radius-sm: 999px;

          --shadow-soft: 0 1px 2px rgba(20, 24, 33, 0.04), 0 8px 20px -12px rgba(20, 24, 33, 0.10);
          --shadow-hover: 0 4px 10px rgba(20, 24, 33, 0.06), 0 16px 32px -14px rgba(20, 24, 33, 0.18);

          --font-display: 'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif;
          --font-body: 'Cairo', 'Inter', system-ui, sans-serif;
        }

        .dashboard-shell {
          width: 100%;
          margin: 0 auto;
          direction: rtl; /* تفعيل اللغة العربية للواجهة */
          font-family: var(--font-body);
        }

        .dashboard-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
          padding: 0 12px;
        }

        .dashboard-header h1 {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.01em;
          margin: 0;
          color: var(--text-primary);
        }

        .dashboard-header p {
          margin: 0;
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .schedule-grid {
          display: grid;
          /* عكس اتجاه القراءة ليكون من اليمين لليسار في الـ Grid */
          grid-template-columns: repeat(7, minmax(220px, 1fr));
          gap: 16px;
          overflow-x: auto;
          padding: 4px 4px 16px 4px;
          scroll-snap-type: x proximity;
          direction: rtl; 
        }
        
        .schedule-grid::-webkit-scrollbar { height: 8px; }
        .schedule-grid::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        .day-column {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 220px;
          scroll-snap-align: start;
          position: relative;
          transition: box-shadow 0.25s ease;
        }

        .day-column.is-today {
          border-color: rgba(245, 158, 11, 0.4);
          background:
            linear-gradient(var(--surface), var(--surface)) padding-box,
            linear-gradient(180deg, rgba(245, 158, 11, 0.6), rgba(245, 158, 11, 0)) top / 100% 4px no-repeat border-box;
          padding-top: 15px;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.05);
        }

        .day-column-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .day-name {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.01em;
          color: var(--text-primary);
        }

        .today-pill {
          font-size: 11px;
          font-weight: 800;
          color: #B45309;
          background: var(--today-accent-bg);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
        }

        .session-count {
          font-size: 12px;
          color: var(--text-tertiary);
          font-weight: 700;
        }

        .session-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        /* --- Session Card base --- */
        .session-card {
          border-radius: var(--radius-md);
          padding: 14px 16px;
          border: 1px solid transparent;
          box-shadow: var(--shadow-soft);
          cursor: default;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .session-card:hover,
        .session-card:focus-visible {
          transform: translateY(-3px);
          box-shadow: var(--shadow-hover);
        }

        .session-card:focus-visible {
          outline: 2px solid var(--text-secondary);
          outline-offset: 2px;
        }

        .card-top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .card-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-icon svg { width: 16px; height: 16px; }

        .card-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          white-space: nowrap;
        }

        .card-time {
          font-family: monospace;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.01em;
          line-height: 1.2;
          direction: ltr; /* لضمان عرض الوقت الإنجليزي بشكل صحيح */
          text-align: right;
        }

        .card-student {
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        /* --- Quran card variant --- */
        .quran-card {
          background: var(--emerald-bg);
          border-color: var(--emerald-border);
        }
        .quran-card .card-icon { background: rgba(5, 150, 105, 0.12); color: var(--emerald-strong); }
        .quran-card .card-badge { background: rgba(5, 150, 105, 0.14); color: var(--emerald-deep); }
        .quran-card .card-time { color: var(--emerald-deep); }

        /* --- Islamic studies card variant --- */
        .islamic-card {
          background: var(--sky-bg);
          border-color: var(--sky-border);
        }
        .islamic-card .card-icon { background: rgba(2, 132, 199, 0.12); color: var(--sky-strong); }
        .islamic-card .card-badge { background: rgba(2, 132, 199, 0.14); color: var(--sky-deep); }
        .islamic-card .card-time { color: var(--sky-deep); }

        /* --- Empty state --- */
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1.5px dashed var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 24px 12px;
          color: var(--text-tertiary);
          background: var(--surface-muted);
        }

        .empty-state svg {
          width: 24px;
          height: 24px;
          opacity: 0.6;
        }

        .empty-state span {
          font-size: 13px;
          font-weight: 600;
          text-align: center;
        }

        @media (max-width: 980px) {
          .schedule-grid {
            grid-template-columns: none;
            grid-auto-flow: column;
            grid-auto-columns: minmax(260px, 1fr);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .session-card, .day-column { transition: none; }
        }
      </style>
    `;

    return `
      ${styles}
      <div class="dashboard-shell exec-animate" style="--stagger: 1;">
        <div class="dashboard-header">
           <div>
             <h1>الجدول الأسبوعي للحلقات</h1>
             <p>إجمالي ${autoScheduleItems.length} حلقة مسجلة (قرآن وتربية)</p>
           </div>
        </div>

        <div class="schedule-grid">
           ${daysHtml}
        </div>
      </div>
    `;
  };
})();
