// ==========================================================
// خدمة تطبيق بيانات المجموعات (Group Application Service)
// تنظيم عمليات المجموعات وتطبيق قواعد التحقق والتطبيع
// دوال نقية بدون التعامل مع DOM وبدون تعديل مباشر على appState
// ==========================================================

(function () {
  "use strict";

  class GroupApplicationService {
    constructor() {
      this.SCHEMA_VERSION = 2;
    }

    // التحقق من صحة بيانات المجموعة
    validateGroupData(data) {
      if (!data || typeof data !== "object") {
        return { valid: false, error: "بيانات المجموعة غير صالحة" };
      }

      const name = (data.name || "").trim();
      if (!name) {
        return { valid: false, error: "اكتب اسم المجموعة أولاً" };
      }

      if (!Array.isArray(data.studentIds) || data.studentIds.length === 0) {
        return { valid: false, error: "اختر طلاب المجموعة" };
      }

      return { valid: true };
    }

    // تطبيع وتجهيز كائن المجموعة
    normalizeGroupPayload(data) {
      return {
        schemaVersion: this.SCHEMA_VERSION,
        name: (data.name || "").trim(),
        studentIds: Array.isArray(data.studentIds) ? [...data.studentIds] : [],
        archived: false,
      };
    }

    // إنشاء مجموعة جديدة
    async createGroup(data) {
      const validation = this.validateGroupData(data);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const payload = this.normalizeGroupPayload(data);

      try {
        if (!window.groupRepository) {
          throw new Error("GroupRepository غير متاح");
        }
        const createdGroup = await window.groupRepository.addGroup(payload);
        return { success: true, group: createdGroup };
      } catch (err) {
        console.error("Failed to create group in repository:", err);
        return { success: false, error: err.message || "فشل إنشاء المجموعة" };
      }
    }

    // تعديل بيانات مجموعة
    async updateGroup(groupId, updates) {
      if (!groupId) {
        return { success: false, error: "معرف المجموعة مطلوب" };
      }

      if (updates.name !== undefined || updates.studentIds !== undefined) {
        const validation = this.validateGroupData({
          name: updates.name !== undefined ? updates.name : "اسم افتراضي",
          studentIds: updates.studentIds !== undefined ? updates.studentIds : ["dummy"],
        });
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
      }

      const payload = {
        schemaVersion: this.SCHEMA_VERSION,
        ...updates,
      };
      if (payload.name) payload.name = payload.name.trim();

      try {
        if (!window.groupRepository) {
          throw new Error("GroupRepository غير متاح");
        }
        const updated = await window.groupRepository.updateGroup(groupId, payload);
        return { success: true, group: updated };
      } catch (err) {
        console.error("Failed to update group in repository:", err);
        return { success: false, error: err.message || "فشل تحديث بيانات المجموعة" };
      }
    }

    // أرشفة مجموعة بأمان دون المساس بالجلسات التاريخية
    async archiveGroup(groupId) {
      if (!groupId) {
        return { success: false, error: "معرف المجموعة مطلوب للأرشفة" };
      }

      try {
        if (!window.groupRepository) {
          throw new Error("GroupRepository غير متاح");
        }
        const result = await window.groupRepository.archiveGroup(groupId);
        return { success: true, groupId: result.id };
      } catch (err) {
        console.error("Failed to archive group:", err);
        return { success: false, error: err.message || "فشل أرشفة المجموعة" };
      }
    }

    // استعادة مجموعة من الأرشيف
    async restoreGroup(groupId) {
      if (!groupId) {
        return { success: false, error: "معرف المجموعة مطلوب للاستعادة" };
      }

      try {
        if (!window.groupRepository) {
          throw new Error("GroupRepository غير متاح");
        }
        const result = await window.groupRepository.restoreGroup(groupId);
        return { success: true, groupId: result.id };
      } catch (err) {
        console.error("Failed to restore group:", err);
        return { success: false, error: err.message || "فشل استعادة المجموعة" };
      }
    }
  }

  window.groupApplicationService = new GroupApplicationService();
})();
