// ============================================================
// محرك دورة حياة الجلسات والباقات (Session Lifecycle Engine)
// تنفيذ قواعد العمل الصارمة لترقيم الباقات وإعادة الترتيب والقفل التاريخي
// ============================================================

(function () {
  const HISTORICAL_LOCK_DAYS = 31;

  class SessionLifecycleEngine {
    constructor() {
      this.HISTORICAL_LOCK_DAYS = HISTORICAL_LOCK_DAYS;
    }

    // التحقق من صلاحية النافذة الزمنية (31 يوماً)
    isWithinHistoricalWindow(dateStr) {
      if (!dateStr) return true;
      const sessionTime = new Date(dateStr).getTime();
      if (isNaN(sessionTime)) return true;
      const now = Date.now();
      const diffDays = (now - sessionTime) / (1000 * 60 * 60 * 24);
      return diffDays <= this.HISTORICAL_LOCK_DAYS;
    }

    // حساب رقم الباقة التالي لطالب بناءً على حده وحالته المحفوظة
    async getNextPackageNum(studentId, explicitLimit = null) {
      if (!studentId) return 1;

      const student = (window.appState && window.appState.students)
        ? window.appState.students.find((s) => s.id === studentId)
        : null;

      const limit = explicitLimit ||
        (student && student.sessionLimit) ||
        (student && ((student.quranLimit || 0) + (student.islamicLimit || 0))) ||
        (window.appState?.settings?.defaultLimit) ||
        12;

      // إذا كان لدى الطالب رقم باقة مسجل في وثيقته
      if (student && typeof student.currentPackageNum === "number" && student.currentPackageNum > 0) {
        return (student.currentPackageNum % limit) + 1;
      }

      // التوافق الرجعي: استعلام آخر جلسة محتسبة لهذا الطالب
      try {
        const repo = window.sessionRepository;
        if (repo) {
          const allSessions = await repo.getAllSessionsForStudent(studentId);
          const consumedSessions = allSessions.filter((s) => {
            const isAbsent = s.attendance === "absent_excused" || s.attendance === "absent_unexcused" || (s.participant && s.participant.present === false);
            return !isAbsent;
          });

          if (consumedSessions.length === 0) return 1;

          // ترتيب تصاعدي حسب التاريخ لمعرفة آخر موضع
          consumedSessions.sort((a, b) => new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0));
          const lastSession = consumedSessions[consumedSessions.length - 1];
          const lastNum = (lastSession.mode === "group" && lastSession.participant)
            ? lastSession.participant.packageSessionNum
            : lastSession.packageSessionNum;

          if (typeof lastNum === "number" && lastNum > 0) {
            return (lastNum % limit) + 1;
          }

          return (consumedSessions.length % limit) + 1;
        }
      } catch (err) {
        console.warn("Failed to derive next package number, falling back to 1:", err);
      }

      return 1;
    }

    // إعادة حساب موضع الباقة عند تغيير حد الباقة (Rule 2.9)
    calculatePositionUnderNewLimit(oldPosition, oldLimitOrNewLimit, newLimit = null) {
      const targetLimit = (newLimit !== null && newLimit !== undefined) ? newLimit : oldLimitOrNewLimit;
      if (!targetLimit || targetLimit <= 0) return oldPosition || 1;
      const pos = oldPosition || 1;
      return 1 + ((pos - 1) % targetLimit);
    }

    // معالجة تسجيل جلسة جديدة فردية أو جماعية مع المحافظة على الذرية (Atomicity)
    async recordSession(sessionData, { isMiddleInsertion = false, autoReorder = true } = {}) {
      const repo = window.sessionRepository;
      if (!repo) throw new Error("مستودع الجلسات غير متاح");

      const teacherDoc = window.dbModule.getTeacherDoc();
      const batch = db.batch();
      const sessionsCol = teacherDoc.collection("sessions");
      const studentsCol = teacherDoc.collection("students");

      const newSessionRef = sessionsCol.doc();
      const isAbsent = sessionData.attendance === "absent_excused" || sessionData.attendance === "absent_unexcused";
      const isGroup = sessionData.mode === "group";

      let finalSessionPayload = {
        ...sessionData,
        id: newSessionRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!isGroup) {
        const studentId = sessionData.studentId;
        const student = window.appState?.students?.find((s) => s.id === studentId);
        const limit = (student && student.sessionLimit) || window.appState?.settings?.defaultLimit || 12;

        let packageSessionNum = null;
        if (!isAbsent) {
          packageSessionNum = sessionData.packageSessionNum || (await this.getNextPackageNum(studentId, limit));
          finalSessionPayload.packageSessionNum = packageSessionNum;

          // تحديث عداد الطالب ومركزه
          if (studentId) {
            const studentRef = studentsCol.doc(studentId);
            batch.set(
              studentRef,
              {
                currentPackageNum: packageSessionNum,
                lastSessionDate: sessionData.date || new Date().toISOString(),
                totalConsumedSessions: firebase.firestore.FieldValue.increment(1),
                updatedAt: Date.now(),
              },
              { merge: true }
            );
          }
        }
      } else {
        // حالة الجلسة الجماعية: تحديث كل طالب حاضر على حدة
        if (Array.isArray(sessionData.participants)) {
          for (const p of sessionData.participants) {
            if (p.present !== false && p.attendance !== "absent_excused" && p.attendance !== "absent_unexcused") {
              const studentRef = studentsCol.doc(p.studentId);
              batch.set(
                studentRef,
                {
                  currentPackageNum: p.packageSessionNum || 1,
                  lastSessionDate: sessionData.date || new Date().toISOString(),
                  totalConsumedSessions: firebase.firestore.FieldValue.increment(1),
                  updatedAt: Date.now(),
                },
                { merge: true }
              );
            }
          }
        }
      }

      batch.set(newSessionRef, finalSessionPayload);
      await batch.commit();

      repo.invalidateCache();
      return finalSessionPayload;
    }

    // حذف جلسة مع دعم الاختيار بين إعادة الترتيب أو الاحتفاظ بالأرقام (Rule 2.3, 2.4, 2.11)
    async deleteSession(sessionId, { reorder = false } = {}) {
      const repo = window.sessionRepository;
      if (!repo) throw new Error("مستودع الجلسات غير متاح");

      const session = await repo.getSession(sessionId);
      if (!session) throw new Error("الجلسة غير موجودة");

      const teacherDoc = window.dbModule.getTeacherDoc();
      const batch = db.batch();
      const sessionsCol = teacherDoc.collection("sessions");
      const studentsCol = teacherDoc.collection("students");

      // التحقق من القفل التاريخي (31 يوماً)
      const withinWindow = this.isWithinHistoricalWindow(session.date || session.createdAt);

      // حذف وثيقة الجلسة
      const sessionRef = sessionsCol.doc(sessionId);
      batch.delete(sessionRef);

      const isIndividual = session.mode === "individual" && session.studentId;
      const isConsumed = session.attendance !== "absent_excused" && session.attendance !== "absent_unexcused";

      if (isIndividual && isConsumed) {
        const studentId = session.studentId;
        const student = window.appState?.students?.find((s) => s.id === studentId);
        const limit = (student && student.sessionLimit) || window.appState?.settings?.defaultLimit || 12;

        // جلب جميع جلسات الطالب لتحديد هل الجلسة المحذوفة كانت الأخيرة
        const allSessions = await repo.getAllSessionsForStudent(studentId);
        const remainingConsumed = allSessions
          .filter((s) => s.id !== sessionId && s.attendance !== "absent_excused" && s.attendance !== "absent_unexcused")
          .sort((a, b) => new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0));

        // إذا طلب المعلم إعادة الترتيب وكانت العملية ضمن نافذة 31 يوماً
        if (reorder && withinWindow && remainingConsumed.length > 0) {
          const deletedDate = new Date(session.date || session.createdAt || 0).getTime();
          
          remainingConsumed.forEach((s) => {
            const sDate = new Date(s.date || s.createdAt || 0).getTime();
            if (sDate > deletedDate && s.packageSessionNum && s.packageSessionNum > 1) {
              const newNum = s.packageSessionNum - 1;
              const ref = sessionsCol.doc(s.id);
              batch.update(ref, { packageSessionNum: newNum, updatedAt: new Date().toISOString() });
            }
          });
        }

        // تحديث حالة الطالب في قاعدة البيانات
        const studentRef = studentsCol.doc(studentId);
        const lastRemaining = remainingConsumed.length > 0 ? remainingConsumed[remainingConsumed.length - 1] : null;
        const newCurrentNum = lastRemaining ? (lastRemaining.packageSessionNum || 1) : 0;

        batch.set(
          studentRef,
          {
            currentPackageNum: newCurrentNum,
            totalConsumedSessions: Math.max(0, remainingConsumed.length),
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }

      await batch.commit();
      repo.invalidateCache();
    }

    // تعديل حضور جلسة (Present <-> Absent) مع تطبيق القواعد الذكية (Rule 2.7, 2.8)
    async updateAttendance(sessionId, newAttendance, { reorder = true } = {}) {
      const repo = window.sessionRepository;
      const session = await repo.getSession(sessionId);
      if (!session) throw new Error("الجلسة غير موجودة");

      const oldAttendance = session.attendance || "present";
      if (oldAttendance === newAttendance) return session;

      const wasPresent = oldAttendance === "present";
      const isNowPresent = newAttendance === "present";
      const withinWindow = this.isWithinHistoricalWindow(session.date || session.createdAt);

      const teacherDoc = window.dbModule.getTeacherDoc();
      const batch = db.batch();
      const sessionsCol = teacherDoc.collection("sessions");
      const studentsCol = teacherDoc.collection("students");

      const sessionRef = sessionsCol.doc(sessionId);

      if (session.mode === "individual" && session.studentId) {
        const studentId = session.studentId;
        const student = window.appState?.students?.find((s) => s.id === studentId);
        const limit = (student && student.sessionLimit) || window.appState?.settings?.defaultLimit || 12;

        if (wasPresent && !isNowPresent) {
          // من حاضر إلى غائب: الجلسة لم تعد تستهلك باقة
          batch.update(sessionRef, {
            attendance: newAttendance,
            packageSessionNum: null,
            updatedAt: new Date().toISOString(),
          });

          if (reorder && withinWindow) {
            const allSessions = await repo.getAllSessionsForStudent(studentId);
            const sessionDate = new Date(session.date || session.createdAt || 0).getTime();

            allSessions
              .filter((s) => s.id !== sessionId && s.attendance !== "absent_excused" && s.attendance !== "absent_unexcused")
              .forEach((s) => {
                const sDate = new Date(s.date || s.createdAt || 0).getTime();
                if (sDate > sessionDate && s.packageSessionNum && s.packageSessionNum > 1) {
                  const sRef = sessionsCol.doc(s.id);
                  batch.update(sRef, { packageSessionNum: s.packageSessionNum - 1, updatedAt: new Date().toISOString() });
                }
              });
          }

          const studentRef = studentsCol.doc(studentId);
          batch.set(
            studentRef,
            {
              totalConsumedSessions: firebase.firestore.FieldValue.increment(-1),
              updatedAt: Date.now(),
            },
            { merge: true }
          );
        } else if (!wasPresent && isNowPresent) {
          // من غائب إلى حاضر: إدراج الجلسة في الترتيب
          const nextNum = await this.getNextPackageNum(studentId, limit);
          batch.update(sessionRef, {
            attendance: "present",
            packageSessionNum: nextNum,
            updatedAt: new Date().toISOString(),
          });

          const studentRef = studentsCol.doc(studentId);
          batch.set(
            studentRef,
            {
              currentPackageNum: nextNum,
              totalConsumedSessions: firebase.firestore.FieldValue.increment(1),
              updatedAt: Date.now(),
            },
            { merge: true }
          );
        }
      } else {
        batch.update(sessionRef, { attendance: newAttendance, updatedAt: new Date().toISOString() });
      }

      await batch.commit();
      repo.invalidateCache();
    }

    // إعادة ترتيب الباقة يدوياً لطالب (Manual Reorder within 31 days)
    async manualReorderStudentPackage(studentId) {
      if (!studentId) return;
      const repo = window.sessionRepository;
      const allSessions = await repo.getAllSessionsForStudent(studentId);
      const student = window.appState?.students?.find((s) => s.id === studentId);
      const limit = (student && student.sessionLimit) || window.appState?.settings?.defaultLimit || 12;

      // فرز الجلسات تصاعدياً
      const sorted = allSessions
        .filter((s) => s.attendance !== "absent_excused" && s.attendance !== "absent_unexcused")
        .sort((a, b) => new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0));

      const teacherDoc = window.dbModule.getTeacherDoc();
      const batch = db.batch();
      const sessionsCol = teacherDoc.collection("sessions");
      const studentsCol = teacherDoc.collection("students");

      let currentSeq = 0;
      sorted.forEach((s) => {
        // التحقق من أن التعديل يقع ضمن 31 يوماً
        const isLocked = !this.isWithinHistoricalWindow(s.date || s.createdAt);
        currentSeq = (currentSeq % limit) + 1;

        if (!isLocked && s.mode === "individual") {
          const sRef = sessionsCol.doc(s.id);
          batch.update(sRef, { packageSessionNum: currentSeq, updatedAt: new Date().toISOString() });
        }
      });

      const studentRef = studentsCol.doc(studentId);
      batch.set(
        studentRef,
        {
          currentPackageNum: currentSeq,
          totalConsumedSessions: sorted.length,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      await batch.commit();
      repo.invalidateCache();
    }
  }

  window.sessionLifecycle = new SessionLifecycleEngine();
})();
