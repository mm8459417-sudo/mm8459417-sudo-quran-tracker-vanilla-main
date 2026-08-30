// ==========================================
// خدمة إعدادات وملف المعلم (Teacher Settings Service)
// تطبيع وقراءة إعدادات المعلم (Profile / Preferences / Business Defaults)
// وفصل منطق المعالجة عن DOM و Firestore
// ==========================================

(function () {
  "use strict";

  class TeacherSettingsService {
    constructor() {
      this.DEFAULT_THEME_COLOR = "#0F9D7A";
      this.DEFAULT_DARK_MODE = false;
      this.DEFAULT_LIMIT = 12;
      this.DEFAULT_TEACHER_NAME = "المعلم";
    }

    // تطبيع الوثيقة الخام المأخوذة من Firestore أو التخزين
    normalizeTeacherData(rawDoc = {}, user = null) {
      const fallbackName = user
        ? user.displayName || (user.email ? user.email.split("@")[0] : this.DEFAULT_TEACHER_NAME)
        : this.DEFAULT_TEACHER_NAME;

      // 1. ملف المعلم الشخصي (Profile)
      const profile = {
        name: rawDoc.teacherName || fallbackName,
        phone: rawDoc.teacherPhone || "",
        email: rawDoc.email || (user ? user.email : "") || ""
      };

      // 2. تفضيلات واجهة المستخدم (UI Preferences)
      const preferences = {
        themeColor: rawDoc.themeColor || this.DEFAULT_THEME_COLOR,
        darkMode: rawDoc.darkMode !== undefined ? !!rawDoc.darkMode : this.DEFAULT_DARK_MODE
      };

      // 3. الإعدادات التشغيلية والمالية (Business Defaults)
      let packages = [];
      if (Array.isArray(rawDoc.packages)) {
        packages = rawDoc.packages;
      } else if (typeof rawDoc.packagesJSON === "string" && rawDoc.packagesJSON) {
        try {
          packages = JSON.parse(rawDoc.packagesJSON);
        } catch (e) {
          packages = [];
        }
      }

      const businessDefaults = {
        accountingPhone: rawDoc.accountingPhone || "",
        centerName: rawDoc.centerName || "",
        defaultLimit: Number(rawDoc.defaultLimit) || this.DEFAULT_LIMIT,
        packages,
        packagesJSON: rawDoc.packagesJSON || JSON.stringify(packages)
      };

      // الكائن المتوافق للواجهات الحالية
      const legacySettings = {
        ...rawDoc,
        teacherName: profile.name,
        teacherPhone: profile.phone,
        email: profile.email,
        themeColor: preferences.themeColor,
        darkMode: preferences.darkMode,
        accountingPhone: businessDefaults.accountingPhone,
        centerName: businessDefaults.centerName,
        defaultLimit: businessDefaults.defaultLimit,
        packages: businessDefaults.packages,
        packagesJSON: businessDefaults.packagesJSON
      };

      return {
        profile,
        preferences,
        businessDefaults,
        legacySettings
      };
    }

    // قراءة الإعدادات من التخزين المحلي (LocalStorage) ككاش للثيم والواجهة
    getCachedPreferences() {
      try {
        const stored = localStorage.getItem("appState");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.settings) {
            return {
              themeColor: parsed.settings.themeColor || this.DEFAULT_THEME_COLOR,
              darkMode: parsed.settings.darkMode !== undefined ? !!parsed.settings.darkMode : this.DEFAULT_DARK_MODE
            };
          }
        }
      } catch (e) {
        console.warn("Could not read cached preferences from localStorage", e);
      }
      return {
        themeColor: this.DEFAULT_THEME_COLOR,
        darkMode: this.DEFAULT_DARK_MODE
      };
    }

    // حفظ كاش التفضيلات في localStorage للاستجابة الفورية للمظهر
    cachePreferences(settings) {
      try {
        if (settings) {
          localStorage.setItem("appState", JSON.stringify({ settings }));
        }
      } catch (e) {
        console.warn("Could not cache preferences to localStorage", e);
      }
    }
  }

  window.teacherSettingsService = new TeacherSettingsService();
})();
