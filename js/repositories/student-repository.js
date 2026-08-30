// ==========================================
// مستودع بيانات الطلاب (Student Repository)
// إدارة استعلامات وعمليات الطلاب في Firestore
// ==========================================

(function () {
  class StudentRepository {
    constructor() {
      this.unsubStudents = null;
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

    getStudentsCollection() {
      return this.getTeacherDoc().collection("students");
    }

    // جلب طالب محدد بالمعرف
    async getStudent(studentId) {
      if (!studentId) return null;
      const doc = await this.getStudentsCollection().doc(studentId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    // جلب قائمة جميع الطلاب
    async getStudents() {
      const snap = await this.getStudentsCollection().orderBy("createdAt", "asc").get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    // الاشتراك الحي في قائمة الطلاب
    subscribeStudents(callback, onError) {
      const teacherId = this.getTeacherId();
      if (!teacherId) return () => {};

      if (this.unsubStudents) {
        this.unsubStudents();
        this.unsubStudents = null;
      }

      this.unsubStudents = this.getStudentsCollection()
        .orderBy("createdAt", "asc")
        .onSnapshot(
          (snap) => {
            const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            if (typeof callback === "function") callback(data);
          },
          (err) => {
            console.error("Students subscription error:", err);
            if (typeof onError === "function") onError(err);
          }
        );

      return () => {
        if (this.unsubStudents) {
          this.unsubStudents();
          this.unsubStudents = null;
        }
      };
    }

    // إضافة طالب جديد
    async addStudent(data) {
      const ref = this.getStudentsCollection().doc();
      const payload = {
        id: ref.id,
        schemaVersion: 2,
        archived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...data,
      };
      await ref.set(payload);
      return payload;
    }

    // تعديل بيانات طالب
    async updateStudent(id, updates) {
      if (!id) throw new Error("معرف الطالب مطلوب للتحديث");
      const sanitizedUpdates = {
        schemaVersion: 2,
        ...updates,
        updatedAt: Date.now(),
      };
      await this.getStudentsCollection().doc(id).update(sanitizedUpdates);
      return { id, ...sanitizedUpdates };
    }

    // أرشفة طالب بأمان (Safe Archive) دون المساس بالجلسات التاريخية
    async archiveStudent(id) {
      if (!id) throw new Error("معرف الطالب مطلوب للأرشفة");
      const timestamp = Date.now();
      const updates = {
        archived: true,
        archivedAt: new Date(timestamp).toISOString(),
        archivedAtTimestamp: timestamp,
        updatedAt: timestamp,
      };
      await this.getStudentsCollection().doc(id).update(updates);
      return { id, ...updates };
    }

    // استعادة طالب من الأرشيف
    async restoreStudent(id) {
      if (!id) throw new Error("معرف الطالب مطلوب للاستعادة");
      const timestamp = Date.now();
      const updates = {
        archived: false,
        restoredAt: new Date(timestamp).toISOString(),
        updatedAt: timestamp,
      };
      await this.getStudentsCollection().doc(id).update(updates);
      return { id, ...updates };
    }

    // حذف طالب (حذف آمن بالأرشفة للحفاظ على سجلات الجلسات والشيت المالي)
    async deleteStudent(id) {
      return await this.archiveStudent(id);
    }
  }

  window.studentRepository = new StudentRepository();
})();
