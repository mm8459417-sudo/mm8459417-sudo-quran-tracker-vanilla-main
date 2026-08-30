// ==========================================================
// خدمة السكرتير الذكي (Secretary Service)
// معالجة وحسابات المواعيد والمهام والحلقات الفائتة والمتأخرة
// دوال نقية بدون التعامل مع DOM أو واجهة المستخدم
// ==========================================================

(function () {
  "use strict";

  const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const GRACE_MINUTES = 15;
  const LATE_AFTER_DAYS = 1;
  const REPORT_LATE_AFTER_DAYS = 1;
  const OCCURRENCE_LOOKBACK_DAYS = 14;

  const STATUS_META = {
    scheduled:            { label: "مجدولة",            color: "var(--ink-3)" },
    pending_confirmation: { label: "بانتظار التأكيد",      color: "var(--amber)" },
    attendance_recorded:  { label: "تم احتساب الحضور",    color: "var(--accent)" },
    completed:            { label: "مكتملة",             color: "var(--green)" },
    absent_excused:       { label: "غياب بعذر",          color: "var(--amber)" },
    absent_unexcused:     { label: "غياب بدون عذر",       color: "var(--red)" },
    cancelled:            { label: "ملغاة/مؤجلة",        color: "var(--ink-3)" }
  };

  class SecretaryService {
    constructor() {
      this.DAYS_AR = DAYS_AR;
      this.STATUS_META = STATUS_META;
      this.GRACE_MINUTES = GRACE_MINUTES;
      this.LATE_AFTER_DAYS = LATE_AFTER_DAYS;
      this.REPORT_LATE_AFTER_DAYS = REPORT_LATE_AFTER_DAYS;
      this.OCCURRENCE_LOOKBACK_DAYS = OCCURRENCE_LOOKBACK_DAYS;
    }

    normalizeArabic(text) {
      if (!text) return "";
      return text.trim().replace(/[أإآ]/g, "ا").replace(/ة$/g, "ه");
    }

    timeToMinutes(timeStr) {
      if (!timeStr) return 0;
      if (timeStr.includes(":") && !/AM|PM|م|ص/.test(timeStr)) {
        let [h, m] = timeStr.split(":").map(Number);
        return (h || 0) * 60 + (m || 0);
      }
      let [time, period] = timeStr.split(" ");
      if (!time || !period) return 0;
      let [h, m] = time.split(":").map(Number);
      h = h || 0; m = m || 0;
      if ((period === "PM" || period === "م") && h !== 12) h += 12;
      if ((period === "AM" || period === "ص") && h === 12) h = 0;
      return h * 60 + m;
    }

    minutesToTimeStr(mins) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${this.pad(h)}:${this.pad(m)}:00`;
    }

    pad(n) {
      return (n || 0).toString().padStart(2, "0");
    }

    dateToStr(d) {
      return d.toISOString().split("T")[0];
    }

    addDays(date, delta) {
      const d = new Date(date);
      d.setDate(d.getDate() + delta);
      return d;
    }

    formatClock(date) {
      if (!date || isNaN(date.getTime())) return "--:--";
      let h = date.getHours();
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${this.pad(h)}:${this.pad(date.getMinutes())} ${ampm}`;
    }

    formatDateLabel(dateObj) {
      if (!dateObj || isNaN(dateObj.getTime())) return "تاريخ غير معروف";
      if (typeof window.formatArDate === "function") {
        try { return window.formatArDate(dateObj.toISOString()); } catch (e) {}
      }
      return dateObj.toLocaleDateString("ar-EG");
    }

    daysAgoLabel(n) {
      if (n <= 0) return "اليوم";
      if (n === 1) return "من يوم";
      if (n === 2) return "من يومين";
      if (n <= 10) return `من ${n} أيام`;
      return `من ${n} يوم`;
    }

    // استخراج مواعيد الحلقات الثابتة لجميع الطلاب والمجموعات
    getScheduleEntries(students = [], groups = []) {
      const entries = [];

      (students || []).forEach(student => {
        if (!student) return;
        const qEnabled = student.quranEnabled !== undefined ? student.quranEnabled : ((student.quranLimit || student.sessionLimit) > 0);
        const iEnabled = student.islamicEnabled !== undefined ? student.islamicEnabled : ((student.islamicLimit || 0) > 0);
        let schedules = [];

        if (qEnabled && Array.isArray(student.quranSchedule)) {
          schedules.push(...student.quranSchedule.map(s => ({ ...s, type: "قرآن", sessionType: "quran", icon: "ph-book-open-text", color: "-green" })));
        } else if (qEnabled && Array.isArray(student.schedule)) {
          schedules.push(...student.schedule.map(s => ({ ...s, type: "قرآن", sessionType: "quran", icon: "ph-book-open-text", color: "-green" })));
        }
        if (iEnabled && Array.isArray(student.islamicSchedule)) {
          schedules.push(...student.islamicSchedule.map(s => ({ ...s, type: "تربية", sessionType: "islamic", icon: "ph-heart", color: "-blue" })));
        }

        schedules.forEach(sched => {
          if (!sched || !sched.day || !sched.time) return;
          entries.push({
            mode: "individual",
            id: student.id,
            name: student.name || "بدون اسم",
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

      (groups || []).forEach(group => {
        if (!group) return;
        if (Array.isArray(group.schedule)) {
          group.schedule.forEach(sched => {
            if (!sched || !sched.day || !sched.time) return;
            entries.push({
              mode: "group",
              id: group.id,
              name: `مجموعة: ${group.name || "بدون اسم"}`,
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

    findSessionForOccurrence(sessions = [], mode, id, dateStr) {
      return (sessions || []).find(s => {
        if (!s || !s.date || !s.date.startsWith(dateStr)) return false;
        if (mode === "individual") return s.studentId === id;
        if (mode === "group") return s.groupId === id;
        return false;
      }) || null;
    }

    // توليد وتصنيف مواعيد الحلقات الفائتة والقادمة والحالية
    generateOccurrences({
      students = [],
      groups = [],
      sessions = [],
      tempSchedules = [],
      now = new Date(),
      lookbackDays = OCCURRENCE_LOOKBACK_DAYS,
      graceMinutes = GRACE_MINUTES,
      lateAfterDays = LATE_AFTER_DAYS
    } = {}) {
      const entries = this.getScheduleEntries(students, groups);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const occurrences = [];

      for (let back = 0; back <= lookbackDays; back++) {
        const occDate = this.addDays(now, -back);
        const occDateStr = this.dateToStr(occDate);
        const dayName = DAYS_AR[occDate.getDay()];

        // 1- رصد الحلقات الأساسية
        entries.forEach(entry => {
          if (this.normalizeArabic(entry.day) !== this.normalizeArabic(dayName)) return;
          if (this.findSessionForOccurrence(sessions, entry.mode, entry.id, occDateStr)) return;

          const sessionMinutes = this.timeToMinutes(entry.time);
          occurrences.push({
            ...entry,
            dateStr: occDateStr,
            minutes: sessionMinutes,
            daysAgo: back,
            taskKey: `${entry.mode}-${entry.id}-${occDateStr}`,
            isToday: back === 0
          });
        });

        // 2- رصد الحلقات التعويضية المؤقتة
        if (Array.isArray(tempSchedules)) {
          tempSchedules.forEach(tempSched => {
            if (tempSched.tempDateStr !== occDateStr) return;
            if (this.findSessionForOccurrence(sessions, tempSched.mode, tempSched.id, occDateStr)) return;

            const sessionMinutes = this.timeToMinutes(tempSched.tempTimeStr);
            occurrences.push({
              mode: tempSched.mode,
              id: tempSched.id,
              name: tempSched.name + " (تعويضية ⏳)",
              gender: tempSched.gender,
              day: dayName,
              time: tempSched.tempTimeStr,
              type: tempSched.type,
              sessionType: tempSched.sessionType,
              icon: tempSched.icon,
              color: tempSched.color,
              participants: tempSched.participants || [],
              dateStr: occDateStr,
              minutes: sessionMinutes,
              daysAgo: back,
              taskKey: `temp-${tempSched.mode}-${tempSched.id}-${occDateStr}`,
              isToday: back === 0
            });
          });
        }
      }

      const upcoming = [];
      const current = [];
      const late = [];

      occurrences.forEach(occ => {
        if (occ.isToday) {
          if (currentMinutes >= occ.minutes - graceMinutes) current.push(occ);
          else upcoming.push(occ);
        } else if (occ.daysAgo >= lateAfterDays) {
          late.push(occ);
        } else {
          current.push(occ);
        }
      });

      upcoming.sort((a, b) => a.minutes - b.minutes);
      current.sort((a, b) => (a.daysAgo - b.daysAgo) || (a.minutes - b.minutes));
      late.sort((a, b) => b.daysAgo - a.daysAgo);

      return { upcoming, current, late };
    }

    getPendingReportSessions(sessions = []) {
      const pending = (sessions || []).filter(s => s && s.isReportPending === true);
      pending.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      return pending.map((s, idx) => ({
        ...s,
        _locked: idx !== 0,
        _daysOld: Math.floor((Date.now() - new Date(s.date || Date.now()).getTime()) / 86400000)
      }));
    }

    computeSessionStatus(s) {
      if (!s) return "cancelled";
      if (s.cancelled) return "cancelled";
      if (s.attendance === "absent_excused") return "absent_excused";
      if (s.attendance === "absent_unexcused") return "absent_unexcused";
      return s.isReportPending ? "attendance_recorded" : "completed";
    }

    computeKPIs(tasks = { current: [], upcoming: [], late: [] }, pendingReports = [], sessions = [], now = new Date()) {
      const monthKey = `${now.getFullYear()}-${this.pad(now.getMonth() + 1)}`;

      const completedThisMonth = (sessions || []).filter(s => {
        if (!s || !s.date || !s.date.startsWith(monthKey)) return false;
        return this.computeSessionStatus(s) === "completed";
      }).length;

      return {
        current: (tasks.current || []).length,
        unrecordedReports: (pendingReports || []).length,
        upcoming: (tasks.upcoming || []).length,
        late: (tasks.late || []).length,
        completedThisMonth
      };
    }

    buildLogEvents({ tasks = { upcoming: [], current: [], late: [] }, sessions = [], students = [] } = {}) {
      const events = [];

      (tasks.upcoming || []).forEach(occ => {
        let tsVal = new Date(`${occ.dateStr}T${this.minutesToTimeStr(occ.minutes)}`).getTime();
        events.push({
          ts: isNaN(tsVal) ? Date.now() : tsVal,
          name: occ.name,
          sub: `حصة ${occ.type} · ${occ.time}`,
          statusKey: "scheduled",
          isLateReport: false,
          hasPartialAbsence: false
        });
      });

      (tasks.current || []).concat(tasks.late || []).forEach(occ => {
        let tsVal = new Date(`${occ.dateStr}T${this.minutesToTimeStr(occ.minutes)}`).getTime();
        events.push({
          ts: isNaN(tsVal) ? Date.now() : tsVal,
          name: occ.name,
          sub: `حصة ${occ.type} · ${occ.time} · ${this.daysAgoLabel(occ.daysAgo)}`,
          statusKey: "pending_confirmation",
          isLateReport: false,
          hasPartialAbsence: false
        });
      });

      (sessions || []).forEach(s => {
        if (!s) return;
        const statusKey = this.computeSessionStatus(s);
        const sDate = s.date ? new Date(s.date) : new Date();
        const daysOld = Math.floor((Date.now() - sDate.getTime()) / 86400000);
        const isGroup = !!s.groupId;
        const studentObj = (students || []).find(st => st && st.id === s.studentId);
        const name = isGroup ? `مجموعة: ${s.groupName || ""}` : (studentObj ? studentObj.name : "طالب");
        const partial = isGroup && Array.isArray(s.participants) && s.participants.some(p => p && (p.attendance === "absent_excused" || p.attendance === "absent_unexcused"));

        let sub = `حصة ${s.sessionType === "islamic" ? "تربية" : "قرآن"}`;
        if (partial) {
          const exCount = s.participants.filter(p => p && p.attendance === "absent_excused").length;
          const unCount = s.participants.filter(p => p && p.attendance === "absent_unexcused").length;
          sub += ` · غياب: ${exCount} بعذر / ${unCount} بدون عذر`;
        }

        events.push({
          ts: isNaN(sDate.getTime()) ? Date.now() : sDate.getTime(),
          name,
          sub,
          statusKey,
          isLateReport: statusKey === "attendance_recorded" && daysOld >= REPORT_LATE_AFTER_DAYS,
          hasPartialAbsence: partial
        });
      });

      events.sort((a, b) => b.ts - a.ts);
      return events;
    }

    filterLogEvents(events = [], filter = "all") {
      switch (filter) {
        case "completed": return events.filter(e => e.statusKey === "completed");
        case "incomplete": return events.filter(e => e.statusKey === "pending_confirmation");
        case "late_reports": return events.filter(e => e.isLateReport);
        case "absence": return events.filter(e => e.statusKey === "absent_excused" || e.statusKey === "absent_unexcused" || e.hasPartialAbsence);
        default: return events;
      }
    }
  }

  window.secretaryService = new SecretaryService();
})();
