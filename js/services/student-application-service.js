// ==========================================================
// خدمة تطبيق بيانات الطلاب (Student Application Service)
// تنظيم عمليات الطلاب وتطبيق قواعد التحقق والتطبيع
// دوال نقية بدون التعامل مع DOM وبدون تعديل مباشر على appState
// ==========================================================

(function () {
  "use strict";

  class StudentApplicationService {
    constructor() {
      this.SCHEMA_VERSION = 2;
    }

    // التحقق من صحة بيانات الطالب
    validateStudentData(data) {
      if (!data || typeof data !== "object") {
        return { valid: false, error: "بيانات الطالب غير صالحة" };
      }

      const name = (data.name || "").trim();
      if (!name) {
        return { valid: false, error: "اكتب اسم الطالب أولاً" };
      }

      if (data.quranEnabled && (!data.quranLimit || Number(data.quranLimit) <= 0)) {
        return { valid: false, error: "يجب إدخال عدد حصص القرآن" };
      }

      if (data.islamicEnabled && (!data.islamicLimit || Number(data.islamicLimit) <= 0)) {
        return { valid: false, error: "يجب إدخال عدد حصص التربية" };
      }

      return { valid: true };
    }

    // فحص تعارض المواعيد مع الطلاب الآخرين
    checkScheduleConflict(scheduleArray = [], typeLabel = "", excludeStudentId = null, allStudents = []) {
      if (!Array.isArray(scheduleArray)) return null;

      for (const slot of scheduleArray) {
        if (!slot || !slot.day || !slot.time) continue;
        for (const student of allStudents) {
          if (!student || student.archived) continue;
          if (student.id === excludeStudentId) continue;

          const qSched = Array.isArray(student.quranSchedule) ? student.quranSchedule : [];
          const iSched = Array.isArray(student.islamicSchedule) ? student.islamicSchedule : [];
          const oldSched = Array.isArray(student.schedule) ? student.schedule : [];
          const allSchedules = [...qSched, ...iSched, ...oldSched];

          for (const s of allSchedules) {
            if (s && s.day === slot.day && s.time === slot.time) {
              return `هذا الموعد (${slot.day} الساعة ${slot.time}) مستخدم بالفعل مع الطالب: ${student.name}`;
            }
          }
        }
      }
      return null;
    }

    // تطبيع وتجهيز كائن الطالب للحفظ
    normalizeStudentPayload(form, packagesList = []) {
      const individualPackage = packagesList.find((p) => p.id === form.individualPackageId);
      const groupPackage = packagesList.find((p) => p.id === form.groupPackageId);

      const sessionPrice = individualPackage
        ? parseFloat(individualPackage.price) || 0
        : parseFloat(form.sessionPrice) || 70;
      const groupSessionPrice = groupPackage
        ? parseFloat(groupPackage.price) || 0
        : parseFloat(form.groupSessionPrice) || 70;

      const quranNum = form.quranEnabled ? parseInt(form.quranLimit, 10) : 0;
      const islamicNum = form.islamicEnabled ? parseInt(form.islamicLimit, 10) : 0;
      const absNum = parseInt(form.maxAbsenceAllowed, 10);

      const quranLimit = isNaN(quranNum) ? 0 : quranNum;
      const islamicLimit = isNaN(islamicNum) ? 0 : islamicNum;
      const sessionLimit = quranLimit + islamicLimit;

      return {
        schemaVersion: this.SCHEMA_VERSION,
        name: (form.name || "").trim(),
        phone: (form.phone || "").trim(),
        gender: form.gender || "boy",
        individualPackageId: form.individualPackageId || "",
        groupPackageId: form.groupPackageId || "",
        packageId: form.individualPackageId || form.groupPackageId || "",
        sessionPrice,
        groupSessionPrice,
        quranEnabled: !!form.quranEnabled,
        islamicEnabled: !!form.islamicEnabled,
        quranLimit,
        islamicLimit,
        quranSchedule: form.quranEnabled && Array.isArray(form.quranSchedule) ? form.quranSchedule : [],
        islamicSchedule: form.islamicEnabled && Array.isArray(form.islamicSchedule) ? form.islamicSchedule : [],
        maxAbsenceAllowed: isNaN(absNum) ? 0 : absNum,
        enableUnexcusedAbsence: form.enableUnexcusedAbsence !== undefined ? !!form.enableUnexcusedAbsence : true,
        sessionLimit,
        groupLink: form.groupLink || "",
        archived: false,
      };
    }

    // إنشاء طالب جديد
    async createStudent(formData, packagesList = [], allStudents = []) {
      const validation = this.validateStudentData(formData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      if (formData.quranEnabled) {
        const conflict = this.checkScheduleConflict(formData.quranSchedule, "القرآن", null, allStudents);
        if (conflict) return { success: false, error: conflict };
      }
      if (formData.islamicEnabled) {
        const conflict = this.checkScheduleConflict(formData.islamicSchedule, "التربية", null, allStudents);
        if (conflict) return { success: false, error: conflict };
      }

      const payload = this.normalizeStudentPayload(formData, packagesList);
      payload.currentPackageNum = 0;
      payload.totalConsumedSessions = 0;

      try {
        if (!window.studentRepository) {
          throw new Error("StudentRepository غير متاح");
        }
        const createdStudent = await window.studentRepository.addStudent(payload);
        return { success: true, student: createdStudent };
      } catch (err) {
        console.error("Failed to create student in repository:", err);
        return { success: false, error: err.message || "فشل حفظ بيانات الطالب" };
      }
    }

    // تعديل بيانات طالب
    async updateStudent(studentId, updates, existingStudent = null, packagesList = [], allStudents = []) {
      if (!studentId) {
        return { success: false, error: "معرف الطالب مطلوب" };
      }

      let payload = { ...updates };

      // إذا كانت التحديثات قادمة من نموذج الطالب الكامل
      if (updates.name !== undefined) {
        const validation = this.validateStudentData(updates);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        if (updates.quranEnabled) {
          const conflict = this.checkScheduleConflict(updates.quranSchedule, "القرآن", studentId, allStudents);
          if (conflict) return { success: false, error: conflict };
        }
        if (updates.islamicEnabled) {
          const conflict = this.checkScheduleConflict(updates.islamicSchedule, "التربية", studentId, allStudents);
          if (conflict) return { success: false, error: conflict };
        }

        payload = this.normalizeStudentPayload(updates, packagesList);

        // عند تغيير سعة الباقة يتم إعادة ضبط موضع الجلسة الحالية وفق قواعد محرك الجلسات
        if (existingStudent) {
          const oldLimit = existingStudent.sessionLimit || 12;
          const newLimit = payload.sessionLimit;
          if (newLimit > 0 && oldLimit > 0 && newLimit !== oldLimit) {
            const currentPos = existingStudent.currentPackageNum || 0;
            if (
              currentPos > 0 &&
              window.sessionLifecycle &&
              typeof window.sessionLifecycle.calculatePositionUnderNewLimit === "function"
            ) {
              payload.currentPackageNum = window.sessionLifecycle.calculatePositionUnderNewLimit(currentPos, newLimit);
            }
          }
        }
      }

      try {
        if (!window.studentRepository) {
          throw new Error("StudentRepository غير متاح");
        }
        const updated = await window.studentRepository.updateStudent(studentId, payload);
        return { success: true, student: updated };
      } catch (err) {
        console.error("Failed to update student in repository:", err);
        return { success: false, error: err.message || "فشل تحديث بيانات الطالب" };
      }
    }

    // أرشفة طالب مع الحفاظ التام على الجلسات وإزالته من المجموعات النشطة
    async archiveStudent(studentId, activeGroups = null) {
      if (!studentId) {
        return { success: false, error: "معرف الطالب مطلوب للأرشفة" };
      }

      try {
        if (!window.studentRepository) {
          throw new Error("StudentRepository غير متاح");
        }

        // 1. أرشفة الطالب في المستودع
        const result = await window.studentRepository.archiveStudent(studentId);

        // 2. الحصول على المجموعات النشطة تلقائياً إذا لم تُمرر
        let groupsToCheck = activeGroups;
        if (!Array.isArray(groupsToCheck) || groupsToCheck.length === 0) {
          if (window.appState && Array.isArray(window.appState.groups)) {
            groupsToCheck = window.appState.groups.filter((g) => !g.archived);
          } else if (window.groupRepository && typeof window.groupRepository.getGroups === "function") {
            try {
              const allGroups = await window.groupRepository.getGroups();
              groupsToCheck = (allGroups || []).filter((g) => !g.archived);
            } catch (e) {
              groupsToCheck = [];
            }
          }
        }

        // 3. إزالة الطالب من المجموعات النشطة إن وجدت للحفاظ على تكامل العضوية
        if (Array.isArray(groupsToCheck) && window.groupRepository) {
          for (const group of groupsToCheck) {
            if (group && Array.isArray(group.studentIds) && group.studentIds.includes(studentId)) {
              const updatedStudentIds = group.studentIds.filter((sid) => sid !== studentId);
              await window.groupRepository.updateGroup(group.id, {
                studentIds: updatedStudentIds,
              }).catch((e) => console.warn(`Could not remove student from group ${group.id}:`, e));
            }
          }
        }

        return { success: true, studentId: result.id };
      } catch (err) {
        console.error("Failed to archive student:", err);
        return { success: false, error: err.message || "فشل أرشفة الطالب" };
      }
    }

    // استعادة طالب من الأرشيف
    async restoreStudent(studentId) {
      if (!studentId) {
        return { success: false, error: "معرف الطالب مطلوب للاستعادة" };
      }

      try {
        if (!window.studentRepository) {
          throw new Error("StudentRepository غير متاح");
        }
        const result = await window.studentRepository.restoreStudent(studentId);
        return { success: true, studentId: result.id };
      } catch (err) {
        console.error("Failed to restore student:", err);
        return { success: false, error: err.message || "فشل استعادة الطالب" };
      }
    }
  }

  window.studentApplicationService = new StudentApplicationService();
})();
