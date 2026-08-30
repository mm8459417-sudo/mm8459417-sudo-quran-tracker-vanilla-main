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
        createdAt: Date.now(),
        ...data,
      };
      await ref.set(payload);
      return payload;
    }

    // تعديل بيانات طالب
    async updateStudent(id, updates) {
      if (!id) throw new Error("معرف الطالب مطلوب للتحديث");
      const sanitizedUpdates = {
        ...updates,
        updatedAt: Date.now(),
      };
      await this.getStudentsCollection().doc(id).update(sanitizedUpdates);
      return { id, ...sanitizedUpdates };
    }

    // حذف طالب مع متعلقاته (جلسات ومجموعات)
    async deleteStudent(id) {
      if (!id) throw new Error("معرف الطالب مطلوب للحذف");
      const teacherDoc = this.getTeacherDoc();

      // حذف وثيقة الطالب
      await teacherDoc.collection("students").doc(id).delete();

      // حذف الجلسات التابعة وتحديث المجموعات دفعة واحدة
      const sessionsSnap = await teacherDoc
        .collection("sessions")
        .where("studentId", "==", id)
        .get();

      const groupsSnap = await teacherDoc
        .collection("groups")
        .where("studentIds", "array-contains", id)
        .get();

      const batch = db.batch();
      sessionsSnap.docs.forEach((doc) => batch.delete(doc.ref));
      groupsSnap.docs.forEach((doc) => {
        const data = doc.data() || {};
        const updated = (data.studentIds || []).filter((sid) => sid !== id);
        batch.update(doc.ref, { studentIds: updated });
      });

      await batch.commit();
      return { success: true, deletedId: id };
    }
  }

  window.studentRepository = new StudentRepository();
})();
