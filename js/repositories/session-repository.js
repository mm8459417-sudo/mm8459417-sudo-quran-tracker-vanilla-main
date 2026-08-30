// ==========================================
// مستودع بيانات الجلسات (Session Repository)
// إدارة استعلامات الجلسات المؤطرة والتخزين المؤقت
// ==========================================

(function () {
  class SessionRepository {
    constructor() {
      this.cache = new Map();
      this.cacheTimeouts = new Map();
      this.DEFAULT_TTL = 3 * 60 * 1000; // 3 دقائق للتخزين المؤقت في الذاكرة
      this.scopedUnsubscribe = null;
    }

    getTeacherId() {
      if (window.dbModule && window.dbModule.teacherId) {
        return window.dbModule.teacherId;
      }
      if (window.appState && window.appState.user) {
        return window.appState.user.uid;
      }
      return null;
    }

    getSessionsCollection() {
      const teacherId = this.getTeacherId();
      if (!teacherId || typeof db === "undefined" || !db) {
        throw new Error("قاعدة البيانات غير مهيأة أو لم يتم تسجيل الدخول");
      }
      return db.collection("teachers").doc(teacherId).collection("sessions");
    }

    // إدارة الكاش
    setCache(key, data, ttl = this.DEFAULT_TTL) {
      this.cache.set(key, data);
      if (this.cacheTimeouts.has(key)) {
        clearTimeout(this.cacheTimeouts.get(key));
      }
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.cacheTimeouts.delete(key);
      }, ttl);
      this.cacheTimeouts.set(key, timer);
    }

    getCache(key) {
      return this.cache.has(key) ? this.cache.get(key) : null;
    }

    invalidateCache(pattern = null) {
      if (!pattern) {
        this.cache.clear();
        this.cacheTimeouts.forEach((timer) => clearTimeout(timer));
        this.cacheTimeouts.clear();
        return;
      }
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          if (this.cacheTimeouts.has(key)) {
            clearTimeout(this.cacheTimeouts.get(key));
            this.cacheTimeouts.delete(key);
          }
        }
      }
    }

    // جلب جلسة مفردة
    async getSession(sessionId) {
      if (!sessionId) return null;
      const cacheKey = `session:${sessionId}`;
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      try {
        const doc = await this.getSessionsCollection().doc(sessionId).get();
        if (!doc.exists) return null;
        const data = { id: doc.id, ...doc.data() };
        this.setCache(cacheKey, data);
        return data;
      } catch (err) {
        console.error("Error fetching session:", err);
        throw err;
      }
    }

    // جلب أحدث الجلسات للعمليات اليومية (محدودة بـ N)
    async getRecentSessions(limitCount = 10, forceRefresh = false) {
      const cacheKey = `recent:${limitCount}`;
      if (!forceRefresh) {
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
      }

      try {
        const snap = await this.getSessionsCollection()
          .orderBy("date", "desc")
          .limit(limitCount)
          .get();

        const sessions = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        this.setCache(cacheKey, sessions);
        return sessions;
      } catch (err) {
        // محاولة بديلة إذا كان الترتيب بـ createdAt
        try {
          const snap = await this.getSessionsCollection()
            .orderBy("createdAt", "desc")
            .limit(limitCount)
            .get();
          const sessions = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          this.setCache(cacheKey, sessions);
          return sessions;
        } catch (innerErr) {
          console.error("Error fetching recent sessions:", innerErr);
          return [];
        }
      }
    }

    // جلب جلسات طالب معين مع دعم التصفح والتقسيم (Pagination)
    async getSessionsByStudent(studentId, { limitCount = 20, lastDoc = null } = {}) {
      if (!studentId) return { sessions: [], lastDoc: null, hasMore: false };

      const cacheKey = `student:${studentId}:${limitCount}:${lastDoc ? lastDoc.id : "initial"}`;
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      try {
        // استعلام الجلسات الفردية للطالب
        let query = this.getSessionsCollection()
          .where("studentId", "==", studentId)
          .orderBy("date", "desc")
          .limit(limitCount + 1);

        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        const snap = await query.get();
        const docs = snap.docs;
        const hasMore = docs.length > limitCount;
        const resultDocs = hasMore ? docs.slice(0, limitCount) : docs;
        const nextLastDoc = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

        const sessions = resultDocs.map((d) => ({ id: d.id, ...d.data() }));
        const result = { sessions, lastDoc: nextLastDoc, hasMore };

        this.setCache(cacheKey, result);
        return result;
      } catch (err) {
        console.error("Error fetching student sessions:", err);
        return { sessions: [], lastDoc: null, hasMore: false };
      }
    }

    // جلب جميع جلسات الطالب (فردي وجماعي) لخط السجل الزمني
    async getAllSessionsForStudent(studentId, forceRefresh = false) {
      if (!studentId) return [];
      const cacheKey = `student_all:${studentId}`;
      if (!forceRefresh) {
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
      }

      try {
        // 1. الجلسات الفردية
        const indSnap = await this.getSessionsCollection()
          .where("studentId", "==", studentId)
          .get();

        const indSessions = indSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // 2. الجلسات الجماعية (بحث في الجلسات الجماعية المعلم)
        // لتجنب جلب كل شيء: نستعلم جلسات المجموعات فقط أو الجلسات التي تحتوي mode == group
        const grpSnap = await this.getSessionsCollection()
          .where("mode", "==", "group")
          .get();

        const grpSessions = [];
        grpSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.participants)) {
            const p = data.participants.find((part) => part.studentId === studentId);
            if (p) {
              grpSessions.push({
                id: doc.id,
                ...data,
                participant: p,
              });
            }
          }
        });

        const combined = [...indSessions, ...grpSessions].sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt || 0).getTime();
          const dateB = new Date(b.date || b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        this.setCache(cacheKey, combined);
        return combined;
      } catch (err) {
        console.error("Error fetching all student sessions:", err);
        return [];
      }
    }

    // جلب الجلسات المؤطرة بنطاق زمني [startDate, endDate)
    async getSessionsByDateRange(startDateStr, endDateStr, forceRefresh = false) {
      if (!startDateStr || !endDateStr) return [];
      const cacheKey = `range:${startDateStr}:${endDateStr}`;
      if (!forceRefresh) {
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
      }

      try {
        const snap = await this.getSessionsCollection()
          .where("date", ">=", startDateStr)
          .where("date", "<", endDateStr)
          .orderBy("date", "desc")
          .get();

        const sessions = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        this.setCache(cacheKey, sessions);
        return sessions;
      } catch (err) {
        console.error(`Error fetching sessions for range ${startDateStr} - ${endDateStr}:`, err);
        return [];
      }
    }

    // جلب جلسات شهر محدد (للشيت المالي والتحليل)
    async getSessionsByMonth(year, month, forceRefresh = false) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const pad = (n) => String(n).padStart(2, "0");

      const startDateStr = `${y}-${pad(m)}-01`;
      let nextYear = y;
      let nextMonth = m + 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = y + 1;
      }
      const endDateStr = `${nextYear}-${pad(nextMonth)}-01`;

      const cacheKey = `month:${y}-${pad(m)}`;
      if (!forceRefresh) {
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
      }

      const sessions = await this.getSessionsByDateRange(startDateStr, endDateStr, forceRefresh);
      this.setCache(cacheKey, sessions);
      return sessions;
    }

    // جلب نافذة السكرتير الذكي (مثلاً آخر 14 يوماً من اليوم)
    async getSecretaryWindowSessions(lookbackDays = 14, forceRefresh = false) {
      const now = new Date();
      const pastDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
      const pastDateStr = pastDate.toISOString().split("T")[0];
      
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const cacheKey = `secretary:${lookbackDays}:${pastDateStr}`;
      if (!forceRefresh) {
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
      }

      try {
        const snap = await this.getSessionsCollection()
          .where("date", ">=", pastDateStr)
          .where("date", "<=", tomorrowStr)
          .get();

        const sessions = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        this.setCache(cacheKey, sessions);
        return sessions;
      } catch (err) {
        console.error("Error fetching secretary window sessions:", err);
        return [];
      }
    }

    // استعلام التقارير المعلقة
    async getPendingReportSessions(forceRefresh = false) {
      const cacheKey = "pending_reports";
      if (!forceRefresh) {
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
      }

      try {
        const snap = await this.getSessionsCollection()
          .where("isReportPending", "==", true)
          .get();

        const sessions = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        sessions.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
        this.setCache(cacheKey, sessions);
        return sessions;
      } catch (err) {
        console.error("Error fetching pending report sessions:", err);
        return [];
      }
    }

    // إضافة جلسة جديدة
    async addSession(sessionData) {
      const col = this.getSessionsCollection();
      const docRef = col.doc();
      const payload = {
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...sessionData,
      };

      await docRef.set(payload);
      this.invalidateCache();
      return payload;
    }

    // تحديث جلسة
    async updateSession(sessionId, updates) {
      if (!sessionId) throw new Error("معرف الجلسة مفقود");
      const docRef = this.getSessionsCollection().doc(sessionId);
      const payload = {
        updatedAt: new Date().toISOString(),
        ...updates,
      };

      await docRef.update(payload);
      this.invalidateCache();
      return payload;
    }

    // حذف جلسة
    async deleteSession(sessionId) {
      if (!sessionId) throw new Error("معرف الجلسة مفقود");
      await this.getSessionsCollection().doc(sessionId).delete();
      this.invalidateCache();
    }

    // استعادة جلسة محذوفة
    async restoreSession(sessionId, sessionData) {
      if (!sessionId) throw new Error("معرف الجلسة مفقود");
      const docRef = this.getSessionsCollection().doc(sessionId);
      const payload = {
        ...sessionData,
        id: sessionId,
        restoredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await docRef.set(payload);
      this.invalidateCache();
      return payload;
    }

    // اشتراك خفيف في الجلسات التشغيلية النشطة والتقارير المعلقة فقط (وليس الأرشيف بالكامل)
    subscribeOperationalState(callback) {
      if (this.scopedUnsubscribe) {
        this.scopedUnsubscribe();
        this.scopedUnsubscribe = null;
      }

      const teacherId = this.getTeacherId();
      if (!teacherId || typeof db === "undefined" || !db) return () => {};

      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startDateStr = sevenDaysAgo.toISOString().split("T")[0];

      try {
        const unsub = this.getSessionsCollection()
          .where("date", ">=", startDateStr)
          .orderBy("date", "desc")
          .limit(30)
          .onSnapshot(
            (snap) => {
              const sessions = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              this.invalidateCache("recent");
              this.invalidateCache("secretary");
              this.invalidateCache("pending_reports");
              callback(sessions);
            },
            (err) => {
              console.warn("Operational sessions listener warning:", err);
            }
          );

        this.scopedUnsubscribe = unsub;
        return unsub;
      } catch (e) {
        console.error("Failed to attach scoped subscription:", e);
        return () => {};
      }
    }
  }

  window.sessionRepository = new SessionRepository();
})();
