class DatabaseModule {
  constructor() {
    this.teacherId = null;
    this.unsubStudents = null;
    this.unsubGroups = null;
    this.unsubSessions = null;
    this.unsubSettings = null;
  }

  setTeacherId(id) {
    this.teacherId = id;
  }

  clearSubscriptions() {
    if (this.unsubStudents) this.unsubStudents();
    if (this.unsubGroups) this.unsubGroups();
    if (this.unsubSessions) this.unsubSessions();
    if (this.unsubSettings) this.unsubSettings();
    this.unsubStudents = null;
    this.unsubGroups = null;
    this.unsubSessions = null;
    this.unsubSettings = null;
  }

  getTeacherDoc() {
    if (!this.teacherId) throw new Error("لم يتم تسجيل الدخول");
    return db.collection("teachers").doc(this.teacherId);
  }

  subscribeStudents(callback) {
    if (!this.teacherId) return;
    if (this.unsubStudents) this.unsubStudents();
    this.unsubStudents = this.getTeacherDoc()
      .collection("students")
      .orderBy("createdAt", "asc")
      .onSnapshot(
        (snap) => {
          const data = snap.docs.map((doc) => doc.data());
          callback(data);
        },
        (err) => console.error("Students snapshot error:", err)
      );
  }

  subscribeGroups(callback) {
    if (!this.teacherId) return;
    if (this.unsubGroups) this.unsubGroups();
    this.unsubGroups = this.getTeacherDoc()
      .collection("groups")
      .orderBy("createdAt", "asc")
      .onSnapshot(
        (snap) => {
          const data = snap.docs.map((doc) => doc.data());
          callback(data);
        },
        (err) => console.error("Groups snapshot error:", err)
      );
  }

  subscribeSessions(callback) {
    if (!this.teacherId) return;
    if (this.unsubSessions) this.unsubSessions();
    this.unsubSessions = this.getTeacherDoc()
      .collection("sessions")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snap) => {
          const data = snap.docs.map((doc) => doc.data());
          callback(data);
        },
        (err) => console.error("Sessions snapshot error:", err)
      );
  }

  subscribeSettings(callback) {
    if (!this.teacherId) return;
    if (this.unsubSettings) this.unsubSettings();
    this.unsubSettings = this.getTeacherDoc().onSnapshot(
      (doc) => {
        callback(doc.data() || {});
      },
      (err) => console.error("Settings snapshot error:", err)
    );
  }

  async addStudent(data) {
    const ref = this.getTeacherDoc().collection("students").doc();
    const payload = {
      id: ref.id,
      createdAt: Date.now(),
      ...data,
    };
    await ref.set(payload);
    return payload;
  }

  async addGroup(data) {
    const ref = this.getTeacherDoc().collection("groups").doc();
    const payload = {
      id: ref.id,
      createdAt: Date.now(),
      ...data,
    };
    await ref.set(payload);
    return payload;
  }

  async updateGroup(id, updates) {
    await this.getTeacherDoc().collection("groups").doc(id).update(updates);
  }

  async deleteGroup(id) {
    await this.getTeacherDoc().collection("groups").doc(id).delete();
  }

  async updateStudent(id, updates) {
    await this.getTeacherDoc().collection("students").doc(id).update(updates);
  }

  async deleteStudent(id) {
    const teacherDoc = this.getTeacherDoc();
    await teacherDoc.collection("students").doc(id).delete();

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
  }

  async addSession(data) {
    const ref = this.getTeacherDoc().collection("sessions").doc();
    const payload = {
      id: ref.id,
      createdAt: Date.now(),
      ...data,
    };
    await ref.set(payload);
    return payload;
  }

  async updateSession(id, updates) {
    await this.getTeacherDoc().collection("sessions").doc(id).update(updates);
  }

  async deleteSession(id) {
    await this.getTeacherDoc().collection("sessions").doc(id).delete();
  }

  async saveSettings(data) {
    await this.getTeacherDoc().set(
      {
        ...data,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }
}

window.dbModule = new DatabaseModule();
