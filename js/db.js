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
    if (window.studentRepository) {
      this.unsubStudents = window.studentRepository.subscribeStudents(callback);
    } else {
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
  }

  subscribeGroups(callback) {
    if (!this.teacherId) return;
    if (this.unsubGroups) this.unsubGroups();
    if (window.groupRepository) {
      this.unsubGroups = window.groupRepository.subscribeGroups(callback);
    } else {
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
  }

  subscribeSessions(callback) {
    if (!this.teacherId) return;
    if (this.unsubSessions) this.unsubSessions();
    if (window.sessionRepository) {
      this.unsubSessions = window.sessionRepository.subscribeOperationalState(callback);
    } else {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      this.unsubSessions = this.getTeacherDoc()
        .collection("sessions")
        .where("date", ">=", sevenDaysAgo)
        .orderBy("date", "desc")
        .limit(30)
        .onSnapshot(
          (snap) => {
            const data = snap.docs.map((doc) => doc.data());
            callback(data);
          },
          (err) => console.error("Sessions snapshot error:", err)
        );
    }
  }

  subscribeSettings(callback) {
    if (!this.teacherId) return;
    if (this.unsubSettings) this.unsubSettings();
    if (window.teacherRepository) {
      this.unsubSettings = window.teacherRepository.subscribeTeacher(callback);
    } else {
      this.unsubSettings = this.getTeacherDoc().onSnapshot(
        (doc) => {
          callback(doc.data() || {});
        },
        (err) => console.error("Settings snapshot error:", err)
      );
    }
  }

  async addStudent(data) {
    if (window.studentRepository) {
      return await window.studentRepository.addStudent(data);
    }
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
    if (window.groupRepository) {
      return await window.groupRepository.addGroup(data);
    }
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
    if (window.groupRepository) {
      return await window.groupRepository.updateGroup(id, updates);
    }
    await this.getTeacherDoc().collection("groups").doc(id).update(updates);
  }

  async deleteGroup(id) {
    if (window.groupRepository) {
      return await window.groupRepository.deleteGroup(id);
    }
    await this.getTeacherDoc().collection("groups").doc(id).delete();
  }

  async updateStudent(id, updates) {
    if (window.studentRepository) {
      return await window.studentRepository.updateStudent(id, updates);
    }
    await this.getTeacherDoc().collection("students").doc(id).update(updates);
  }

  async deleteStudent(id) {
    if (window.studentRepository) {
      return await window.studentRepository.deleteStudent(id);
    }
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
    if (window.sessionLifecycle) {
      return await window.sessionLifecycle.recordSession(data);
    }
    if (window.sessionRepository) {
      return await window.sessionRepository.addSession(data);
    }
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
    if (window.sessionRepository) {
      return await window.sessionRepository.updateSession(id, updates);
    }
    await this.getTeacherDoc().collection("sessions").doc(id).update(updates);
  }

  async deleteSession(id, options = {}) {
    if (window.sessionLifecycle) {
      return await window.sessionLifecycle.deleteSession(id, options);
    }
    if (window.sessionRepository) {
      return await window.sessionRepository.deleteSession(id);
    }
    await this.getTeacherDoc().collection("sessions").doc(id).delete();
  }

  async saveSettings(data) {
    if (window.teacherRepository) {
      return await window.teacherRepository.saveTeacherDoc(data);
    }
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
