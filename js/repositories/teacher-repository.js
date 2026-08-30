// ==========================================
// مستودع بيانات وإعدادات المعلم (Teacher Repository)
// إدارة استعلامات وعمليات المعلم في Firestore
// ==========================================

(function () {
  "use strict";

  class TeacherRepository {
    constructor() {
      this.unsubTeacher = null;
    }

    getTeacherId() {
      if (window.dbModule && window.dbModule.teacherId) {
        return window.dbModule.teacherId;
      }
      if (window.appState && window.appState.user) {
        return window.appState.user.uid;
      }
      if (window.authModule && window.authModule.user) {
        return window.authModule.user.uid;
      }
      return null;
    }

    getTeacherDoc() {
      const teacherId = this.getTeacherId();
      if (!teacherId || typeof db === "undefined" || !db) {
        throw new Error("قاعدة البيانات غير مهيأة أو لم يتم تسجيل الدخول");
      }
      return db.collection("teachers").doc(teacherId);
    }

    // جلب بيانات وثيقة المعلم كـ raw data
    async getTeacherRawDoc() {
      const doc = await this.getTeacherDoc().get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    // الاشتراك في وثيقة المعلم
    subscribeTeacher(callback, onError) {
      const teacherId = this.getTeacherId();
      if (!teacherId) return () => {};

      if (this.unsubTeacher) {
        this.unsubTeacher();
        this.unsubTeacher = null;
      }

      this.unsubTeacher = this.getTeacherDoc().onSnapshot(
        (doc) => {
          const raw = doc.exists ? doc.data() : {};
          if (typeof callback === "function") {
            callback(raw);
          }
        },
        (err) => {
          console.error("Teacher snapshot error:", err);
          if (typeof onError === "function") onError(err);
        }
      );

      return () => {
        if (this.unsubTeacher) {
          this.unsubTeacher();
          this.unsubTeacher = null;
        }
      };
    }

    // حفظ أو دمج إعدادات وبيانات المعلم في فايرستور
    async saveTeacherDoc(data) {
      const teacherDoc = this.getTeacherDoc();
      const payload = {
        ...data,
        updatedAt: Date.now()
      };
      await teacherDoc.set(payload, { merge: true });
      return payload;
    }

    // تحديث الملف الشخصي
    async updateProfile({ teacherName, teacherPhone, email } = {}) {
      const updates = {};
      if (teacherName !== undefined) updates.teacherName = teacherName;
      if (teacherPhone !== undefined) updates.teacherPhone = teacherPhone;
      if (email !== undefined) updates.email = email;
      return await this.saveTeacherDoc(updates);
    }

    // تحديث تفضيلات المظهر
    async updatePreferences({ themeColor, darkMode } = {}) {
      const updates = {};
      if (themeColor !== undefined) updates.themeColor = themeColor;
      if (darkMode !== undefined) updates.darkMode = darkMode;
      return await this.saveTeacherDoc(updates);
    }

    // تحديث الإعدادات التشغيلية والباقات
    async updateBusinessDefaults({ accountingPhone, centerName, packages, packagesJSON, defaultLimit } = {}) {
      const updates = {};
      if (accountingPhone !== undefined) updates.accountingPhone = accountingPhone;
      if (centerName !== undefined) updates.centerName = centerName;
      if (packages !== undefined) updates.packages = packages;
      if (packagesJSON !== undefined) updates.packagesJSON = packagesJSON;
      if (defaultLimit !== undefined) updates.defaultLimit = defaultLimit;
      return await this.saveTeacherDoc(updates);
    }
  }

  window.teacherRepository = new TeacherRepository();
})();
