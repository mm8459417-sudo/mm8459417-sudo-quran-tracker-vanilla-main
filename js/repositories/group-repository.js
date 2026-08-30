// ==========================================
// مستودع بيانات المجموعات (Group Repository)
// إدارة استعلامات وعمليات المجموعات في Firestore
// ==========================================

(function () {
  class GroupRepository {
    constructor() {
      this.unsubGroups = null;
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

    getGroupsCollection() {
      return this.getTeacherDoc().collection("groups");
    }

    // جلب مجموعة محددة بالمعرف
    async getGroup(groupId) {
      if (!groupId) return null;
      const doc = await this.getGroupsCollection().doc(groupId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    // جلب قائمة جميع المجموعات
    async getGroups() {
      const snap = await this.getGroupsCollection().orderBy("createdAt", "asc").get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    // الاشتراك الحي في قائمة المجموعات
    subscribeGroups(callback, onError) {
      const teacherId = this.getTeacherId();
      if (!teacherId) return () => {};

      if (this.unsubGroups) {
        this.unsubGroups();
        this.unsubGroups = null;
      }

      this.unsubGroups = this.getGroupsCollection()
        .orderBy("createdAt", "asc")
        .onSnapshot(
          (snap) => {
            const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            if (typeof callback === "function") callback(data);
          },
          (err) => {
            console.error("Groups subscription error:", err);
            if (typeof onError === "function") onError(err);
          }
        );

      return () => {
        if (this.unsubGroups) {
          this.unsubGroups();
          this.unsubGroups = null;
        }
      };
    }

    // إضافة مجموعة جديدة
    async addGroup(data) {
      const ref = this.getGroupsCollection().doc();
      const payload = {
        id: ref.id,
        createdAt: Date.now(),
        ...data,
      };
      await ref.set(payload);
      return payload;
    }

    // تعديل بيانات مجموعة
    async updateGroup(id, updates) {
      if (!id) throw new Error("معرف المجموعة مطلوب للتحديث");
      const sanitizedUpdates = {
        ...updates,
        updatedAt: Date.now(),
      };
      await this.getGroupsCollection().doc(id).update(sanitizedUpdates);
      return { id, ...sanitizedUpdates };
    }

    // حذف مجموعة
    async deleteGroup(id) {
      if (!id) throw new Error("معرف المجموعة مطلوب للحذف");
      await this.getGroupsCollection().doc(id).delete();
      return { success: true, deletedId: id };
    }
  }

  window.groupRepository = new GroupRepository();
})();
