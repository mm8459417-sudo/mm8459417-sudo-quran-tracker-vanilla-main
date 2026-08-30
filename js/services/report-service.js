// ==========================================================
// خدمة التقارير والشيت الشهري (Reporting Service)
// تجميع إحصائيات الحضور، مصفوفة الشيت الشهري، وتحليلات الأداء
// دوال نقية بدون التعامل مع DOM أو واجهة المستخدم
// ==========================================================

(function () {
  "use strict";

  class ReportService {
    // --------------------------------------------------------
    // 1. أدوات مساعدة ونطاقات عامة
    // --------------------------------------------------------

    normalizeStudentSessions(sessions = []) {
      return (sessions || []).map((s) => {
        if (s.participant && typeof s.participant.overall === "number") {
          return { ...s, overall: s.participant.overall };
        }
        return s;
      });
    }

    filterSessionsByMonth(sessions = [], month, year) {
      return (sessions || []).filter((s) => {
        if (!s || !s.date) return false;
        const d = new Date(s.date);
        return d.getMonth() === month && d.getFullYear() === year;
      });
    }

    calcAverage(sessions = []) {
      if (!sessions || !sessions.length) return 0;
      return sessions.reduce((sum, s) => sum + (s.overall || 0), 0) / sessions.length;
    }

    buildChartData(sessions = []) {
      return (sessions || []).slice(-20).map((s, i) => ({
        label: i + 1,
        value: s.overall || 0
      }));
    }

    getStudentQuranLimit(student, defaultLimit = 12) {
      if (!student) return 0;
      const raw = student.quranLimit !== undefined && student.quranLimit !== null
        ? student.quranLimit
        : student.sessionLimit;
      return Number(raw) || 0;
    }

    getStudentIslamicLimit(student) {
      if (!student) return 0;
      return Number(student.islamicLimit) || 0;
    }

    getTotalStudentLimit(student, defaultLimit = 12) {
      if (!student) return defaultLimit;
      const qLimit = Number(student.quranLimit) || 0;
      const iLimit = Number(student.islamicLimit) || 0;
      if (qLimit > 0 || iLimit > 0) return qLimit + iLimit;
      return Number(student.sessionLimit) || defaultLimit;
    }

    getMinimumThreshold(packageLimit) {
      if (packageLimit >= 6) return 4;
      if (packageLimit >= 3) return 3;
      return 0;
    }

    detectGender(student) {
      if (!student) return false;
      if (student.gender === "girl" || student.gender === "female") return true;
      if (student.gender === "boy") return false;
      const firstName = (student.name || "").split(" ")[0];
      const femaleEndings = ["ة", "اء", "ى"];
      const femaleNames = ["مريم", "زينب", "هند", "سعاد", "ريم", "نور", "فاطمة", "عائشة", "خديجة", "آمنة", "سارة", "حفصة", "رقية"];
      if (femaleEndings.some((end) => firstName.endsWith(end)) || femaleNames.includes(firstName)) {
        return true;
      }
      return false;
    }

    getDefaultCertTexts(student) {
      const isFemale = this.detectGender(student);
      const genderSuffix = isFemale ? "ها" : "ه";
      const defaultIntro = `تتقدم إدارة حلقات الصحبة والمعلم بخالص الشكر والتقدير إلى الطالب المتميز`;
      const defaultReason = `وذلك لتميز${genderSuffix} الواضح وتفوق${genderSuffix} في حفظ كتاب الله\nسائلين المولى عز وجل أن يجعل${genderSuffix} من أهل القرآن`;
      return { defaultIntro, defaultReason };
    }

    // --------------------------------------------------------
    // 2. حسابات الشيت الشهري وتجميع الحضور
    // --------------------------------------------------------

    buildMonthlyCountsMap(sessions = [], year, month) {
      const map = {};
      (sessions || []).forEach((s) => {
        if (!s || !s.date) return;
        const d = new Date(s.date);
        if (d.getFullYear() === year && d.getMonth() + 1 === month) {
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

    generateMonthlySheetText({
      students = [],
      counts = {},
      tempAdjustments = {},
      monthName = "",
      year = new Date().getFullYear(),
      teacherName = "غير محدد",
      defaultLimit = 12
    } = {}) {
      const lines = [
        "📋 شيت حضور الحلقات",
        `📅 ${monthName} / ${year}`,
        `المعلم: ${teacherName}`,
        "─────────────────────────",
        ...students
          .filter(s => !(tempAdjustments[s.id] && tempAdjustments[s.id].printExcluded))
          .map((s, i) => {
            const c = counts[s.id] || 0;
            const lim = this.getTotalStudentLimit(s, defaultLimit);
            return `${i + 1}. ${s.name}   ${c} / ${lim} حصة`;
          }),
      ];
      return lines.join("\n");
    }

    calculateMonthlySheetData({
      students = [],
      sessions = [],
      packagesList = [],
      tempAdjustments = {},
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear(),
      sheetFilter = "month"
    } = {}) {
      const filteredSessions = (sessions || []).filter(s => {
        if (!s || !s.date) return false;
        const d = new Date(s.date);
        if (sheetFilter === "week") {
          const now = new Date();
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return d >= oneWeekAgo && d <= now;
        } else {
          return (d.getMonth() + 1) === month && d.getFullYear() === year;
        }
      });

      let grandTotalAmount = 0;
      let grandTotalCalculatedSessions = 0;
      let grandTotalQuran = 0;
      let grandTotalIslamic = 0;
      let grandTotalIndividual = 0;
      let grandTotalGroup = 0;

      const tableData = (students || []).map(student => {
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

        const adj = tempAdjustments[student.id] || {};
        const printExcluded = adj.printExcluded || false;

        quranCount = Math.max(0, quranCount + (adj.quran || 0));
        islamicCount = Math.max(0, islamicCount + (adj.islamic || 0));
        individualCount = Math.max(0, individualCount + (adj.individual || 0));
        groupCount = Math.max(0, groupCount + (adj.group || 0));

        const indPkg = packagesList.find(p => p.id === student.individualPackageId);
        const grpPkg = packagesList.find(p => p.id === student.groupPackageId);
        const fallbackPkg = packagesList.find(p => p.id === student.packageId);

        let sessionPriceInd = indPkg ? indPkg.price : (fallbackPkg ? fallbackPkg.price : (student.sessionPrice || 70));
        let sessionPriceGrp = grpPkg ? grpPkg.price : (student.groupSessionPrice !== undefined ? student.groupSessionPrice : sessionPriceInd);

        const maxAbsenceAllowed = student.maxAbsenceAllowed !== undefined ? student.maxAbsenceAllowed : 1;
        const enableUnexcusedAbsence = student.enableUnexcusedAbsence !== undefined ? student.enableUnexcusedAbsence : true;

        let payableAbsences = 0;
        if (enableUnexcusedAbsence) {
          payableAbsences = Math.max(0, unexcusedAbsenceCount - maxAbsenceAllowed);
        }

        let totalCalculatedSessions = individualCount + groupCount + payableAbsences;
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

      return {
        tableData,
        grandTotals: {
          grandTotalAmount,
          grandTotalCalculatedSessions,
          grandTotalQuran,
          grandTotalIslamic,
          grandTotalIndividual,
          grandTotalGroup
        }
      };
    }

    // --------------------------------------------------------
    // 3. حسابات سياق التحليل والإحصاءات الفردية
    // --------------------------------------------------------

    computeAnalysisContext({
      students = [],
      sessions = [],
      selectedStudentId = "all",
      analysisMode = "quran",
      month = new Date().getMonth(),
      year = new Date().getFullYear()
    } = {}) {
      let mode = analysisMode === "islamic" ? "islamic" : "quran";
      const student = selectedStudentId === "all" ? null : students.find((s) => s.id === selectedStudentId);

      const baseSessions = selectedStudentId === "all"
        ? sessions.slice()
        : this.normalizeStudentSessions(
            sessions.map((session) => {
              if (session.mode === "group") {
                const participant = session.participants?.find(
                  (p) => p.studentId === selectedStudentId && p.present !== false
                );
                if (!participant) return null;
                return { ...session, participant, overall: participant.overall };
              }
              if (session.studentId === selectedStudentId) return session;
              return null;
            }).filter(Boolean)
          ).sort((a, b) => new Date(a.date) - new Date(b.date));

      const monthSessions = this.filterSessionsByMonth(baseSessions, month, year).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      const quranMonthSessions = monthSessions.filter((s) => s.sessionType !== "islamic");
      const islamicMonthSessions = monthSessions.filter((s) => s.sessionType === "islamic");

      let quranLimit = 0;
      let islamicLimit = 0;
      let canToggleMode = false;
      let hasNoPackage = false;

      if (student) {
        quranLimit = this.getStudentQuranLimit(student);
        islamicLimit = this.getStudentIslamicLimit(student);

        if (quranLimit > 0 && islamicLimit === 0) {
          mode = "quran";
        } else if (islamicLimit > 0 && quranLimit === 0) {
          mode = "islamic";
        } else if (quranLimit > 0 && islamicLimit > 0) {
          canToggleMode = true;
        } else {
          hasNoPackage = true;
          mode = "quran";
        }
      } else {
        canToggleMode = true;
      }

      const targetSessions = mode === "quran" ? quranMonthSessions : islamicMonthSessions;
      const packageLimit = student ? (mode === "quran" ? quranLimit : islamicLimit) : null;
      const minThreshold = student && !hasNoPackage ? this.getMinimumThreshold(packageLimit) : null;

      const executedCount = targetSessions.length;
      const avgRatingNum = this.calcAverage(targetSessions);
      const avgRating = avgRatingNum.toFixed(1);

      let meetsMinimum = false;
      if (student && !hasNoPackage) {
        meetsMinimum = minThreshold === 0 ? executedCount >= 1 : executedCount >= minThreshold;
      }

      let status = null;
      if (student && !hasNoPackage && executedCount > 0) {
        if (!meetsMinimum) {
          status = {
            key: "waiting",
            icon: "⏳",
            title: "بانتظار استكمال الحد الأدنى",
            detail: `تم تنفيذ ${executedCount} من أصل ${minThreshold} حلقات كحد أدنى مطلوب لبدء التحليل هذا الشهر.`,
          };
        } else if (avgRatingNum >= 4.0) {
          status = {
            key: "eligible",
            icon: "✅",
            title: "مؤهل لإصدار شهادة تفوق",
            detail: `تم تنفيذ ${executedCount} حلقة بمتوسط تقييم ${avgRating} من 5.`,
          };
        } else {
          status = {
            key: "low",
            icon: "❌",
            title: "التقييم أقل من المطلوب",
            detail: `تم تنفيذ ${executedCount} حلقة${minThreshold > 0 ? ` (الحد الأدنى ${minThreshold})` : ""}، لكن متوسط التقييم ${avgRating} أقل من 4.0 المطلوب لإصدار الشهادة.`,
          };
        }
      }

      const showReward = !!(student && !hasNoPackage && executedCount > 0 && meetsMinimum && avgRatingNum >= 4.0);

      return {
        selectedId: selectedStudentId,
        student,
        mode,
        canToggleMode,
        hasNoPackage,
        month,
        year,
        quranLimit,
        islamicLimit,
        packageLimit,
        minThreshold,
        monthSessions,
        quranMonthSessions,
        islamicMonthSessions,
        targetSessions,
        executedCount,
        avgRating,
        avgRatingNum,
        status,
        showReward,
      };
    }

    // --------------------------------------------------------
    // 4. ملخص تقدم الطالب في السجل التاريخي
    // --------------------------------------------------------

    calculateStudentHistorySummary(student, defaultLimit = 12) {
      if (!student) return { count: 0, limit: defaultLimit, currentPkgNum: 0, pct: 0 };
      const count = typeof student.totalConsumedSessions === "number" ? student.totalConsumedSessions : 0;
      const limit = this.getTotalStudentLimit(student, defaultLimit);
      const currentPkgNum = typeof student.currentPackageNum === "number" && student.currentPackageNum > 0
        ? student.currentPackageNum
        : (count % limit || 0);
      const pct = limit ? Math.round((currentPkgNum / limit) * 100) : 0;
      return { count, limit, currentPkgNum, pct };
    }
  }

  window.reportService = new ReportService();
})();
