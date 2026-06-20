(function () {
  const ARABIC_DAYS = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];

  // ==========================================
  // إعدادات المظهر والوضع الليلي (تأمين الحماية من التحميل المبكر)
  // ==========================================
  function initThemeState() {
    if (!window.appState) window.appState = {};
    if (!window.appState.settings) window.appState.settings = {};
    if (!window.appState.settings.themeColor) window.appState.settings.themeColor = "#0F9D7A";
    if (window.appState.settings.darkMode === undefined) window.appState.settings.darkMode = false;
  }

  window.updateSetting = function (key, value) {
    initThemeState();
    window.appState.settings[key] = value;
    if (typeof saveData === 'function') saveData();
  };

  window.updateThemeColor = function (color) {
    initThemeState();
    window.appState.settings.themeColor = color;
    if (typeof saveData === 'function') saveData();
    applyTheme();
  };

 window.toggleDarkMode = function (isDark) {
    initThemeState();
    window.appState.settings.darkMode = isDark;
    if (typeof saveData === 'function') saveData();
    
    // تحديث فوري للكلاسات
    applyTheme();
    
    // حفظ التعديل في الداتابيز (عشان يفضل معاك لما تفتح من جهاز تاني)
    if (window.dbModule && window.dbModule.saveSettings) {
        window.dbModule.saveSettings(window.appState.settings).catch(e => console.error(e));
    }
  };
  // دالة ذكية لزرار الشمس والقمر في الهيدر
  window.toggleThemeSwitch = function() {
    if (!window.appState || !window.appState.settings) return;
    
    // 1. قراءة الحالة الحالية وعكسها
    const currentState = !!window.appState.settings.darkMode;
    const newState = !currentState;
    
    // 2. تشغيل الوضع الجديد
    window.toggleDarkMode(newState);
    
    // 3. حفظ الحالة في الذاكرة (عشان متضيعش لو عمل ريفرش)
    try {
      localStorage.setItem('appState', JSON.stringify(window.appState));
    } catch(e) { console.error("Error saving theme to local storage"); }
    
    // 4. تحديث زرار (السويتش) اللي موجود جوه صفحة الإعدادات لو كانت مفتوحة
    const settingsSwitch = document.querySelector('input[type="checkbox"][onchange*="toggleDarkMode"]');
    if (settingsSwitch) {
        settingsSwitch.checked = newState;
    }
  };

  window.applyTheme = function () {
    initThemeState();
    const themeColor = window.appState.settings.themeColor;
    const darkMode = window.appState.settings.darkMode;

    document.documentElement.style.setProperty('--emerald', themeColor);
    document.documentElement.style.setProperty('--emerald-dark', adjustColorBrightness(themeColor, -20));
    
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // تظبيط ألوان الرسوم البيانية (Chart.js) عالمياً بناءً على المظهر الحالي
    if (window.Chart) {
      if (darkMode) {
        Chart.defaults.color = '#CBD5E1'; 
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)'; 
      } else {
        Chart.defaults.color = '#475569'; 
        Chart.defaults.borderColor = 'rgba(15, 23, 42, 0.06)'; 
      }
      
      // لو المستخدم واقف في صفحة الإحصائيات حالياً، بنعمل إعادة رسم للشارت
      if (window.router && typeof router.render === 'function' && appState.ui && appState.ui.page === 'analysis') {
        router.render();
      }
    }
  };

  function adjustColorBrightness(col, amt) {
    let usePound = false;
    if (col[0] == "#") { col = col.slice(1); usePound = true; }
    let num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  }

  // ==========================================
  // الدوال الأصلية للمنصة (إدارة الطلاب والباقات والمجموعات)
  // ==========================================

  // 🚀 حماية ثلاثية الأبعاد لضمان عدم اختفاء الباقات أبداً
  function ensurePackagesExist() {
    initThemeState();
    
    // 1. الاسترجاع من الذاكرة المحلية (عشان لو الداتابيز مسحتها متختفيش من قدامك)
    if (window.__LOCAL_PACKAGES__) {
        window.appState.settings.packages = window.__LOCAL_PACKAGES__;
    } 
    // 2. الاسترجاع من النص (عشان لو السيرفر بيرفض الـ Arrays)
    else if (window.appState.settings.packagesJSON && typeof window.appState.settings.packagesJSON === 'string') {
        try {
            window.appState.settings.packages = JSON.parse(window.appState.settings.packagesJSON);
            window.__LOCAL_PACKAGES__ = window.appState.settings.packages;
        } catch(e) {
            window.appState.settings.packages = [];
        }
    } 
    // 3. الوضع الافتراضي
    else if (!window.appState.settings.packages || !Array.isArray(window.appState.settings.packages)) {
        window.appState.settings.packages = [];
    }

    return window.appState.settings.packages;
  }

  function ensureStudentForm() {
    const packages = ensurePackagesExist();
    if (!window.appState.ui.studentForm) {
      window.appState.ui.studentForm = {
        open: false,
        editId: null,
        name: "",
        phone: "",
        gender: "boy",
        packageId: packages.length > 0 ? packages[0].id : "",
        quranLimit: 8,
        islamicLimit: 4,
        maxAbsenceAllowed: 1, 
        groupLink: "",
        schedule: [],
      };
    }
    return window.appState.ui.studentForm;
  }

  function ensureGroupForm() {
    if (!window.appState.ui.groupForm) {
      window.appState.ui.groupForm = {
        open: false,
        editId: null,
        name: "",
        groupLink: "",
        studentIds: [],
      };
    }
    return window.appState.ui.groupForm;
  }

  function ensurePackageForm() {
    if (!window.appState.ui.packageForm) {
      window.appState.ui.packageForm = {
        open: false,
        editId: null,
        name: "",
        price: 70,
        studentIds: [], 
      };
    }
    return window.appState.ui.packageForm;
  }

  // ==========================================
  // Student Functions
  // ==========================================
  window.openStudentForm = function (studentId) {
    const form = ensureStudentForm();
    const packages = ensurePackagesExist();
    if (studentId) {
      const stu = window.appState.students.find((s) => s.id === studentId);
      if (stu) {
        form.editId = stu.id;
        form.name = stu.name || "";
        form.phone = stu.phone || "";
        form.gender = stu.gender || "boy";
        form.packageId = stu.packageId || (packages.length > 0 ? packages[0].id : "");
        form.quranLimit = stu.quranLimit !== undefined ? stu.quranLimit : 8;
        form.islamicLimit = stu.islamicLimit !== undefined ? stu.islamicLimit : 4;
        form.maxAbsenceAllowed = stu.maxAbsenceAllowed !== undefined ? stu.maxAbsenceAllowed : 1;
        form.groupLink = stu.groupLink || "";
        form.schedule = Array.isArray(stu.schedule) ? stu.schedule : [];
      }
    } else {
      form.editId = null;
      form.name = "";
      form.phone = "";
      form.gender = "boy";
      form.packageId = packages.length > 0 ? packages[0].id : "";
      form.quranLimit = 8;
      form.islamicLimit = 4;
      form.maxAbsenceAllowed = 1;
      form.groupLink = "";
      form.schedule = [];
    }
    form.open = true;
    router.render();
  };

  window.closeStudentForm = function () {
    ensureStudentForm().open = false;
    router.render();
  };

  window.updateStudentFormField = function (field, value) {
    const form = ensureStudentForm();
    form[field] = value;
    if (field === "gender" || field === "packageId") {
      router.render();
    }
  };

  window.addScheduleSlot = function () {
    const form = ensureStudentForm();
    const used = form.schedule.map((s) => s.day);
    const freeDay = ARABIC_DAYS.find((d) => !used.includes(d)) || "السبت";
    form.schedule.push({ day: freeDay, time: "17:00" });
    router.render();
  };

  window.updateScheduleSlot = function (idx, field, value) {
    const form = ensureStudentForm();
    if (!form.schedule[idx]) return;
    form.schedule[idx][field] = value;
  };

  window.removeScheduleSlot = function (idx) {
    const form = ensureStudentForm();
    form.schedule.splice(idx, 1);
    router.render();
  };

  window.saveStudentForm = async function () {
    const form = ensureStudentForm();
    if (!form.name.trim()) {
      showToast("اكتب اسم الطالب أولاً");
      return;
    }

    const packages = ensurePackagesExist();
    const selectedPackage = packages.find(p => p.id === form.packageId);
    const sessionPrice = selectedPackage ? selectedPackage.price : 70;

    const quranNum = parseInt(form.quranLimit, 10);
    const islamicNum = parseInt(form.islamicLimit, 10);
    const absNum = parseInt(form.maxAbsenceAllowed, 10);

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      gender: form.gender,
      packageId: form.packageId,
      sessionPrice: sessionPrice,
      quranLimit: isNaN(quranNum) ? 0 : quranNum,
      islamicLimit: isNaN(islamicNum) ? 0 : islamicNum,
      maxAbsenceAllowed: isNaN(absNum) ? 0 : absNum,
      sessionLimit: (isNaN(quranNum) ? 0 : quranNum) + (isNaN(islamicNum) ? 0 : islamicNum),
      groupLink: form.groupLink.trim(),
      schedule: form.schedule,
    };

    let isEdit = !!form.editId;
    let tempId = form.editId || `temp-${Date.now()}`;
    
    if (isEdit) {
      const idx = window.appState.students.findIndex(s => s.id === form.editId);
      if(idx !== -1) Object.assign(window.appState.students[idx], payload);
    } else {
      window.appState.students.push({ ...payload, id: tempId });
    }

    form.open = false;
    router.render();
    showToast(isEdit ? "تم تحديث الطالب بنجاح" : "تم إضافة الطالب بنجاح");

    try {
      if (isEdit) {
        await dbModule.updateStudent(form.editId, payload);
      } else {
        const addedStudent = await dbModule.addStudent(payload);
        if (addedStudent && addedStudent.id) {
            const tempIdx = window.appState.students.findIndex(s => s.id === tempId);
            if (tempIdx !== -1) window.appState.students[tempIdx].id = addedStudent.id;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.deleteStudent = async function (id) {
    if (!window.confirm("هل تريد حذف الطالب وكل بياناته؟")) return;
    
    window.appState.students = window.appState.students.filter(s => s.id !== id);
    router.render();
    showToast("تم حذف الطالب");

    try {
      await dbModule.deleteStudent(id);
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // Group Functions
  // ==========================================
  window.openGroupForm = function (groupId) {
    const form = ensureGroupForm();
    if (groupId) {
      const group = window.appState.groups.find((g) => g.id === groupId);
      if (group) {
        form.editId = group.id;
        form.name = group.name || "";
        form.groupLink = group.groupLink || "";
        form.studentIds = Array.isArray(group.studentIds) ? group.studentIds : [];
      }
    } else {
      form.editId = null;
      form.name = "";
      form.groupLink = "";
      form.studentIds = [];
    }
    form.open = true;
    router.render();
  };

  window.closeGroupForm = function () {
    ensureGroupForm().open = false;
    router.render();
  };

  window.updateGroupFormField = function (field, value) {
    const form = ensureGroupForm();
    form[field] = value;
  };

  window.toggleGroupMember = function (studentId, checked) {
    const form = ensureGroupForm();
    if (!form.studentIds) form.studentIds = [];
    if (checked) {
      if (!form.studentIds.includes(studentId)) form.studentIds.push(studentId);
    } else {
      form.studentIds = form.studentIds.filter((id) => id !== studentId);
    }
    router.render();
  };

  window.saveGroupForm = async function () {
    const form = ensureGroupForm();
    if (!form.name.trim()) {
      showToast("اكتب اسم المجموعة أولاً");
      return;
    }
    if (!form.studentIds || !form.studentIds.length) {
      showToast("اختر طلاب المجموعة");
      return;
    }

    const payload = {
      name: form.name.trim(),
      groupLink: form.groupLink.trim(),
      studentIds: form.studentIds,
    };

    let isEdit = !!form.editId;
    let tempId = form.editId || `temp-grp-${Date.now()}`;

    if (isEdit) {
      const idx = window.appState.groups.findIndex(g => g.id === form.editId);
      if(idx !== -1) Object.assign(window.appState.groups[idx], payload);
    } else {
      window.appState.groups.push({ ...payload, id: tempId });
    }

    form.open = false;
    router.render();
    showToast(isEdit ? "تم تحديث المجموعة" : "تم إنشاء المجموعة");

    try {
      if (isEdit) {
        await dbModule.updateGroup(form.editId, payload);
      } else {
        const addedGroup = await dbModule.addGroup(payload);
        if (addedGroup && addedGroup.id) {
            const tempIdx = window.appState.groups.findIndex(g => g.id === tempId);
            if (tempIdx !== -1) window.appState.groups[tempIdx].id = addedGroup.id;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.deleteGroup = async function (id) {
    if (!window.confirm("هل تريد حذف المجموعة؟")) return;
    
    window.appState.groups = window.appState.groups.filter(g => g.id !== id);
    router.render();
    showToast("تم حذف المجموعة");

    try {
      await dbModule.deleteGroup(id);
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // Package (Tiers) Functions
  // ==========================================
  window.openPackageForm = function (pkgId) {
    const form = ensurePackageForm();
    const packages = ensurePackagesExist();
    if (pkgId) {
      const pkg = packages.find((p) => p.id === pkgId);
      if (pkg) {
        form.editId = pkg.id;
        form.name = pkg.name || "";
        form.price = pkg.price || 70;
        form.studentIds = (window.appState.students || []).filter(s => s.packageId === pkg.id).map(s => s.id);
      }
    } else {
      form.editId = null;
      form.name = "";
      form.price = 70;
      form.studentIds = [];
    }
    form.open = true;
    router.render();
  };

  window.closePackageForm = function () {
    ensurePackageForm().open = false;
    router.render();
  };

  window.updatePackageFormField = function (field, value) {
    const form = ensurePackageForm();
    form[field] = value;
  };

  window.togglePackageStudent = function (studentId, checked) {
    const form = ensurePackageForm();
    if (!form.studentIds) form.studentIds = [];
    if (checked) {
      if (!form.studentIds.includes(studentId)) form.studentIds.push(studentId);
    } else {
      form.studentIds = form.studentIds.filter((id) => id !== studentId);
    }
    router.render();
  };

  window.savePackageForm = async function () {
    const form = ensurePackageForm();
    if (!form.name.trim()) {
      showToast("اكتب اسم الباقة أولاً");
      return;
    }

    const pkgData = {
      id: form.editId || `pkg-${Date.now()}`,
      name: form.name.trim(),
      price: parseFloat(form.price) || 0,
    };

    let packages = [...ensurePackagesExist()];
    
    if (form.editId) {
      const idx = packages.findIndex(p => p.id === form.editId);
      if (idx !== -1) packages[idx] = pkgData;
    } else {
      packages.push(pkgData);
    }

    window.appState.settings.packages = packages;
    window.appState.settings.packagesJSON = JSON.stringify(packages);
    window.__LOCAL_PACKAGES__ = packages;
    
    const studentsToUpdate = form.studentIds || [];
    (window.appState.students || []).forEach((stu) => {
        if (studentsToUpdate.includes(stu.id)) {
            stu.packageId = pkgData.id;
            stu.sessionPrice = pkgData.price;
        } else if (stu.packageId === pkgData.id) {
            stu.packageId = ""; 
            stu.sessionPrice = 70; 
        }
    });

    form.open = false;
    router.render();
    showToast("تم حفظ الباقة بنجاح");

    try {
      await dbModule.saveSettings(window.appState.settings);
      
      (window.appState.students || []).forEach((stu) => {
          if (studentsToUpdate.includes(stu.id) || stu.packageId === pkgData.id || stu.packageId === "") {
              dbModule.updateStudent(stu.id, { packageId: stu.packageId, sessionPrice: stu.sessionPrice }).catch(e => console.error(e));
          }
      });
    } catch (err) {
      console.error(err);
    }
  };

  window.deletePackage = async function (id) {
    if (!window.confirm("هل تريد حذف هذه الباقة؟")) return;
    
    let packages = ensurePackagesExist().filter(p => p.id !== id);
    window.appState.settings.packages = packages;
    window.appState.settings.packagesJSON = JSON.stringify(packages);
    window.__LOCAL_PACKAGES__ = packages;
    
    router.render();
    showToast("تم حذف الباقة");

    try {
      await dbModule.saveSettings(window.appState.settings); 
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // Settings Main
  // ==========================================
 window.saveSettings = async function () {
    const accountingPhone = document.getElementById("settings-phone").value.trim();
    const teacherName = document.getElementById("settings-teacher-name") ? document.getElementById("settings-teacher-name").value.trim() : (window.appState.settings.teacherName || "");
    const centerName = document.getElementById("settings-center-name") ? document.getElementById("settings-center-name").value.trim() : (window.appState.settings.centerName || "");
    
    // قراءة قيمة زرار التشغيل للغياب
    const enableUnexcusedAbsence = document.getElementById("settings-unexcused-absence") ? document.getElementById("settings-unexcused-absence").checked : false;

    window.appState.settings.accountingPhone = accountingPhone;
    window.appState.settings.teacherName = teacherName;
    window.appState.settings.centerName = centerName;
    window.appState.settings.enableUnexcusedAbsence = enableUnexcusedAbsence; // حفظ التفعيل
    window.appState.settings.packagesJSON = JSON.stringify(ensurePackagesExist());
    
    // مسح الـ defaultLimit القديم
    delete window.appState.settings.defaultLimit;
    
    router.render(); 
    showToast("تم حفظ الإعدادات الأساسية");

    try {
      await dbModule.saveSettings(window.appState.settings);
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // Renders
  // ==========================================
  function renderPackageForm(form) {
    return `
      <div class="card-soft account-card exec-animate" style="--stagger: 1; padding: 32px !important;">
        <div class="d-flex justify-content-between align-items-center mb-4" style="border-bottom: 2px solid rgba(16, 185, 129, 0.15); padding-bottom: 16px;">
          <h3 style="font-size:20px;font-weight:800;color:#065f46;font-family: var(--font-display);">
            ${form.editId ? "<i class='ph-duotone ph-pencil-simple' style='margin-left:8px;'></i>تعديل الباقة" : "<i class='ph-duotone ph-plus-circle' style='margin-left:8px;'></i>إضافة باقة جديدة"}
          </h3>
          <button type="button" class="btn btn-light rounded-circle" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;" onclick="closePackageForm()">✕</button>
        </div>

        <div class="form-group mb-4 exec-animate" style="--stagger: 2;">
          <input class="form-control account-custom-input" value="${form.name}" oninput="updatePackageFormField('name', this.value)" placeholder=" " />
          <label class="form-label">اسم الباقة (مثال: الباقة الفضية)</label>
          <div class="account-input-line"></div>
        </div>

        <div class="form-group mb-4 exec-animate" style="--stagger: 3;">
          <input type="number" class="form-control account-custom-input" value="${form.price}" oninput="updatePackageFormField('price', this.value)" placeholder=" " />
          <label class="form-label">سعر الحلقة (ج.م)</label>
          <div class="account-input-line"></div>
        </div>

        <div class="card-soft mb-4 exec-animate" style="--stagger: 4; background: rgba(240,253,244,0.5); border: 1px dashed rgba(16,185,129,0.4);">
          <div style="font-weight:var(--fw-bold);margin-bottom:16px;color:#065f46;"><i class="ph-duotone ph-users" style="margin-left:8px;"></i>ربط الطلاب بهذه الباقة (اختياري)</div>
          
          ${(!window.appState.students || window.appState.students.length === 0) ? `<div style="font-size: 13px; color: #94a3b8;">لا يوجد طلاب مسجلين لإضافتهم.</div>` : ''}
          
          <div class="d-grid gap-2" style="max-height: 250px; overflow-y: auto; padding-right: 5px;">
            ${(window.appState.students || [])
              .map(
                (s) => `
              <label class="form-check" style="display:flex;align-items:center;gap:12px;padding:10px;background:white;border-radius:10px;border:1px solid rgba(0,0,0,0.05);cursor:pointer;">
                <input class="form-check-input" style="width:20px;height:20px;margin-top:0;" type="checkbox" ${
                  (form.studentIds || []).includes(s.id) ? "checked" : ""
                } onchange="togglePackageStudent('${s.id}', this.checked)" />
                <span style="font-weight:600;font-size:14px;color:var(--text-primary);"><i class="ph-duotone ph-user" style="margin-left:4px;color:${s.gender === 'girl' ? 'var(--gold)' : 'var(--emerald)'}"></i>${s.name}</span>
              </label>
            `
              )
              .join("")}
          </div>
        </div>

        <button type="button" class="btn account-save-btn exec-animate" style="--stagger: 5; background: #059669; border: none; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);" onclick="savePackageForm()">
          <i class="ph-duotone ph-floppy-disk" style="margin-left:8px;"></i>${form.editId ? "حفظ التعديلات" : "إنشاء الباقة وربط الطلاب"}
        </button>
      </div>
    `;
  }

  function renderStudentForm(form) {
    const packages = ensurePackagesExist();
    return `
      <div class="card-soft account-card exec-animate" style="--stagger: 1; padding: 32px !important;">
        <div class="d-flex justify-content-between align-items-center mb-4" style="border-bottom: 2px solid rgba(212, 175, 55, 0.15); padding-bottom: 16px;">
          <h3 style="font-size:20px;font-weight:800;color:var(--gold);font-family: var(--font-display);">
            ${form.editId ? "<i class='ph-duotone ph-pencil-simple' style='margin-left:8px;'></i>تعديل بيانات الطالب" : "<i class='ph-duotone ph-plus-circle' style='margin-left:8px;'></i>إضافة طالب جديد"}
          </h3>
          <button type="button" class="btn btn-light rounded-circle" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;" onclick="closeStudentForm()">✕</button>
        </div>

        <div class="form-group mb-4 exec-animate" style="--stagger: 2;">
          <input class="form-control account-custom-input" value="${form.name}" oninput="updateStudentFormField('name', this.value)" placeholder=" " />
          <label class="form-label">اسم الطالب</label>
          <div class="account-input-line"></div>
        </div>

        <div class="mb-4 exec-animate" style="--stagger: 3;">
          <label style="font-size:15px;color:#94A3B8;font-weight:600;margin-bottom:12px;display:block;">النوع</label>
          <div class="d-flex gap-3">
            <button type="button" class="btn ${form.gender === "boy" ? "btn-primary" : "btn-outline"} flex-fill" onclick="updateStudentFormField('gender','boy')"><i class="ph-duotone ph-user" style="margin-left:4px;"></i>ولد</button>
            <button type="button" class="btn ${form.gender === "girl" ? "btn-gold" : "btn-outline"} flex-fill" onclick="updateStudentFormField('gender','girl')"><i class="ph-duotone ph-user" style="margin-left:4px;"></i>بنت</button>
          </div>
        </div>

        <div class="form-group mb-4 exec-animate" style="--stagger: 4;">
          <input class="form-control account-custom-input" value="${form.phone}" oninput="updateStudentFormField('phone', this.value)" dir="ltr" style="text-align: right;" placeholder=" " />
          <label class="form-label">واتساب ولي الأمر (اختياري)</label>
          <div class="account-input-line"></div>
        </div>

       <div class="card-soft mb-4" style="background: rgba(240,253,244,0.5); border: 1px solid rgba(16,185,129,0.2);">
          <div style="font-weight:var(--fw-bold);color:#065f46;margin-bottom:16px;"><i class="ph-duotone ph-wallet" style="margin-left:8px;"></i>النظام المالي والمسارات</div>
          
          <div class="mb-3">
            <label class="form-label" style="font-size: 13px;">تحديد الباقة المالية</label>
            <select class="form-select" onchange="updateStudentFormField('packageId', this.value)" style="border-color: #cbd5e1;">
              <option value="">-- بدون باقة --</option>
              ${packages.map(p => `<option value="${p.id}" ${form.packageId === p.id ? 'selected' : ''}>${p.name} (${p.price} ج.م/الحلقة)</option>`).join("")}
            </select>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label" style="font-size: 12px;">حد حصص القرآن (شهرياً)</label>
              <input type="number" class="form-control" value="${form.quranLimit}" oninput="updateStudentFormField('quranLimit', this.value)" />
            </div>
            <div class="col-6">
              <label class="form-label" style="font-size: 12px;">حد التربية (شهرياً)</label>
              <input type="number" class="form-control" value="${form.islamicLimit}" oninput="updateStudentFormField('islamicLimit', this.value)" />
            </div>
          </div>
          
          <div>
            <label class="form-label" style="font-size: 12px; color: #b45309;">الغياب بدون عذر المسموح (شهرياً)</label>
            <input type="number" class="form-control" value="${form.maxAbsenceAllowed}" oninput="updateStudentFormField('maxAbsenceAllowed', this.value)" placeholder="مثال: 1 حلقة" />
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">الغياب الذي يتخطى هذا الرقم سيتم احتسابه مالياً على الطالب.</div>
          </div>
        </div>

        <div class="card-soft mb-4 exec-animate" style="--stagger: 7; background: rgba(255,255,255,0.4); border: 1px dashed rgba(212,175,55,0.4);">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span style="font-weight:var(--fw-bold);color:var(--text-primary);"><i class="ph-duotone ph-calendar-blank" style="margin-left:8px;"></i>مواعيد الحلقة الأسبوعية</span>
            <button type="button" class="btn btn-outline btn-sm" onclick="addScheduleSlot()"><i class="ph-bold ph-plus" style="margin-left:4px;"></i>إضافة موعد</button>
          </div>
          ${form.schedule.length === 0 ? `<div style="color:#9ca3af;font-size:13px;text-align:center;padding:10px;">لا توجد مواعيد حتى الآن</div>` : ""}
          ${form.schedule
            .map(
              (slot, idx) => `
            <div class="d-flex gap-2 align-items-center mb-3">
              <select class="form-select" style="background: rgba(255,255,255,0.7) !important; border-color: rgba(0,0,0,0.05);" onchange="updateScheduleSlot(${idx}, 'day', this.value)">
                ${ARABIC_DAYS.map(
                  (d) => `<option value="${d}" ${d === slot.day ? "selected" : ""}>${d}</option>`
                ).join("")}
              </select>
              <input type="time" class="form-control" style="background: rgba(255,255,255,0.7) !important; border-color: rgba(0,0,0,0.05);" value="${slot.time}" oninput="updateScheduleSlot(${idx}, 'time', this.value)" />
              <button type="button" class="btn btn-danger" style="border-radius:var(--r-md);width:46px;height:46px;display:flex;align-items:center;justify-content:center;" onclick="removeScheduleSlot(${idx})">×</button>
            </div>
          `
            )
            .join("")}
        </div>

        <button type="button" class="btn account-save-btn exec-animate" style="--stagger: 8;" onclick="saveStudentForm()">
          <i class="ph-duotone ph-floppy-disk" style="margin-left:8px;"></i>${form.editId ? "حفظ التعديلات" : "إضافة الطالب"}
        </button>
      </div>
    `;
  }

  function renderGroupForm(form) {
    return `
      <div class="card-soft account-card exec-animate" style="--stagger: 1; padding: 32px !important;">
        <div class="d-flex justify-content-between align-items-center mb-4" style="border-bottom: 2px solid rgba(212, 175, 55, 0.15); padding-bottom: 16px;">
          <h3 style="font-size:20px;font-weight:800;color:var(--gold);font-family: var(--font-display);">
            ${form.editId ? "<i class='ph-duotone ph-pencil-simple' style='margin-left:8px;'></i>تعديل المجموعة" : "<i class='ph-duotone ph-plus-circle' style='margin-left:8px;'></i>إنشاء مجموعة جديدة"}
          </h3>
          <button type="button" class="btn btn-light rounded-circle" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;" onclick="closeGroupForm()">✕</button>
        </div>

        <div class="form-group mb-4 exec-animate" style="--stagger: 2;">
          <input class="form-control account-custom-input" value="${form.name}" oninput="updateGroupFormField('name', this.value)" placeholder=" " />
          <label class="form-label">اسم المجموعة</label>
          <div class="account-input-line"></div>
        </div>

        <div class="form-group mb-4 exec-animate" style="--stagger: 3;">
          <input class="form-control account-custom-input" value="${form.groupLink}" oninput="updateGroupFormField('groupLink', this.value)" dir="ltr" style="text-align: right;" placeholder=" " />
          <label class="form-label">رابط الجروب (اختياري)</label>
          <div class="account-input-line"></div>
        </div>

        <div class="card-soft mb-4 exec-animate" style="--stagger: 4; background: rgba(255,255,255,0.4); border: 1px dashed rgba(212, 175, 55, 0.4);">
          <div style="font-weight:var(--fw-bold);margin-bottom:16px;color:var(--text-primary);"><i class="ph-duotone ph-users" style="margin-left:8px;"></i>اختر طلاب المجموعة</div>
          <div class="d-grid gap-3">
            ${(window.appState.students || [])
              .map(
                (s) => `
              <label class="form-check" style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,0.6);border-radius:12px;border:1px solid rgba(0,0,0,0.03);cursor:pointer;transition:all 0.2s;">
                <input class="form-check-input" style="width:24px;height:24px;margin-top:0;" type="checkbox" ${
                  (form.studentIds || []).includes(s.id) ? "checked" : ""
                } onchange="toggleGroupMember('${s.id}', this.checked)" />
                <span style="font-weight:var(--fw-bold);font-size:var(--fs-md);color:var(--text-primary);"><i class="ph-duotone ph-user" style="margin-left:4px;color:${s.gender === 'girl' ? 'var(--gold)' : 'var(--emerald)'}"></i>${s.name}</span>
              </label>
            `
              )
              .join("")}
          </div>
        </div>

        <button type="button" class="btn account-save-btn exec-animate" style="--stagger: 5;" onclick="saveGroupForm()">
          <i class="ph-duotone ph-floppy-disk" style="margin-left:8px;"></i>${form.editId ? "حفظ التعديلات" : "إنشاء المجموعة"}
        </button>
      </div>
    `;
  }

  function renderSettingsMain() {
    const packages = ensurePackagesExist();
    
    return `
      <div class="card-soft account-card mb-4 exec-animate" style="--stagger: 1; padding: 32px !important;">
        <h3 class="account-section-title"><i class="ph-duotone ph-palette" style="margin-left:8px;"></i>المظهر والألوان</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.02); padding: 15px; border-radius: 12px;">
            <div>
              <div style="font-weight: bold; font-size: 14px; color: var(--text-primary);">الوضع الليلي (Dark Mode)</div>
              <div style="font-size: 12px; color: var(--text-muted);">إراحة العين في الإضاءة المنخفضة</div>
            </div>
            <label class="switch">
              <input type="checkbox" ${window.appState.settings && window.appState.settings.darkMode ? 'checked' : ''} onchange="toggleDarkMode(this.checked)">
              <span class="slider round"></span>
            </label>
          </div>
          <div style="background: rgba(0,0,0,0.02); padding: 15px; border-radius: 12px;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 5px; color: var(--text-muted);">اللون الأساسي للمنصة</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <input type="color" value="${window.appState.settings && window.appState.settings.themeColor ? window.appState.settings.themeColor : '#0F9D7A'}" onchange="updateThemeColor(this.value)" style="width: 50px; height: 40px; border: none; border-radius: 8px; cursor: pointer; padding: 0;">
              <button class="btn btn-outline" onclick="updateThemeColor('#0F9D7A'); router.render();">استعادة الافتراضي</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card-soft account-card mb-4 exec-animate" style="--stagger: 2; padding: 32px !important;">
        <h3 class="account-section-title"><i class="ph-duotone ph-gear-six" style="margin-left:8px;"></i>إعدادات المنصة</h3>
        
        <div class="form-group mb-4 exec-animate" style="--stagger: 2.1;">
          <input id="settings-teacher-name" type="text" class="form-control account-custom-input" value="${window.appState.settings && window.appState.settings.teacherName ? window.appState.settings.teacherName : ''}" placeholder=" " />
          <label class="form-label" for="settings-teacher-name">اسم المعلم (يظهر في التوقيع)</label>
          <div class="account-input-line"></div>
        </div>

        <div class="form-group mb-4 exec-animate" style="--stagger: 2.2;">
          <input id="settings-center-name" type="text" class="form-control account-custom-input" value="${window.appState.settings && window.appState.settings.centerName ? window.appState.settings.centerName : ''}" placeholder=" " />
          <label class="form-label" for="settings-center-name">اسم إدارة الحلقة</label>
          <div class="account-input-line"></div>
        </div>
        
        <div class="form-group mb-4 exec-animate" style="--stagger: 2.3;">
          <input id="settings-phone" class="form-control account-custom-input" dir="ltr" style="text-align: right;" value="${window.appState.settings && window.appState.settings.accountingPhone ? window.appState.settings.accountingPhone : ''}" placeholder=" " />
          <label class="form-label" for="settings-phone">رقم المحاسب (واتساب)</label>
          <div class="account-input-line"></div>
        </div>

        <div class="exec-animate" style="--stagger: 2.4; display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.02); padding: 15px; border-radius: 12px; margin-bottom: 24px;">
          <div>
            <div style="font-weight: bold; font-size: 14px; color: var(--text-primary);">تفعيل الغياب بدون عذر</div>
            <div style="font-size: 12px; color: var(--text-muted);">إذا تم التفعيل، سيتم إدراج الغياب في الحسابات والشيت الشهري.</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="settings-unexcused-absence" ${window.appState.settings && window.appState.settings.enableUnexcusedAbsence ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </div>
        
        <button type="button" class="btn account-save-btn exec-animate" style="--stagger: 2.5; margin-top: 0;" onclick="saveSettings()">
          <i class="ph-duotone ph-floppy-disk" style="margin-left:8px;"></i>حفظ الإعدادات
        </button>
      </div>

      <div class="card-soft account-card mb-4 exec-animate" style="--stagger: 5; padding: 32px !important;">
        <div class="d-flex justify-content-between align-items-center mb-4" style="border-bottom: 2px solid rgba(16, 185, 129, 0.15); padding-bottom: 16px;">
          <h3 style="font-size:var(--fs-xl);font-weight:var(--fw-extrabold);color:#065f46;margin:0;">
            <i class="ph-duotone ph-currency-circle-dollar" style="margin-left:8px;"></i>إدارة الباقات المالية
          </h3>
          <button type="button" class="btn" style="background:#059669; color:white;" onclick="openPackageForm()">
            <i class="ph-bold ph-plus" style="margin-left:4px;"></i>باقة جديدة
          </button>
        </div>
        
        ${packages.length === 0 ? `<div style="color:#94A3B8;text-align:center;padding:20px;font-size:15px;">لا توجد باقات. قم بإنشاء باقة لربط الطلاب بها.</div>` : ""}
        
        <div class="d-grid gap-3">
          ${packages.map((p, index) => {
            const stuCount = (window.appState.students || []).filter(s => s.packageId === p.id).length;
            return `
            <div class="card-soft exec-animate" style="--stagger: ${5 + (index * 0.2)}; padding:16px; background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:bold; color:#065f46; font-size:15px;">${p.name}</div>
                <div style="font-size:13px; color:#047857; margin-top:4px;">سعر الحلقة: <strong>${p.price} ج.م</strong> | مرتبط بـ: <strong>${stuCount} طالب</strong></div>
              </div>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline icon-btn" style="border-color:#10b981; color:#10b981;" onclick="openPackageForm('${p.id}')"><i class="ph-duotone ph-pencil-simple"></i></button>
                <button type="button" class="btn btn-danger icon-btn" onclick="deletePackage('${p.id}')"><i class="ph-duotone ph-trash"></i></button>
              </div>
            </div>
          `;}).join('')}
        </div>
      </div>

      <div class="card-soft account-card mb-4 exec-animate" style="--stagger: 6; padding: 32px !important;">
        <div class="d-flex justify-content-between align-items-center mb-4" style="border-bottom: 2px solid rgba(212, 175, 55, 0.15); padding-bottom: 16px;">
          <h3 style="font-size:var(--fs-xl);font-weight:var(--fw-extrabold);color:var(--text-primary);margin:0;">
            <i class="ph-duotone ph-users" style="margin-left:8px;"></i>إدارة الطلاب (${(window.appState.students || []).length})
          </h3>
          <button type="button" class="btn btn-primary" onclick="openStudentForm()">
            <i class="ph-bold ph-plus" style="margin-left:4px;"></i>طالب جديد
          </button>
        </div>
        
        ${(!window.appState.students || window.appState.students.length === 0) ? `<div style="color:#94A3B8;text-align:center;padding:20px;font-size:15px;">لا يوجد طلاب مسجلين بعد.</div>` : ""}
        
        <div class="d-grid gap-3">
          ${(window.appState.students || [])
            .map(
              (s, index) => {
                const pkg = packages.find(p => p.id === s.packageId);
                const pkgName = pkg ? pkg.name : "غير محدد";
                return `
            <div class="card-soft exec-animate" style="--stagger: ${7 + (index * 0.2)}; padding:16px; background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0,0,0,0.04); border-radius: 16px; transition: all 0.3s ease;">
              <div class="d-flex justify-content-between align-items-center">
                <div style="flex:1;">
                  <div style="font-weight:var(--fw-bold);font-size:var(--fs-md);color:var(--text-primary);margin-bottom:4px;"><i class="ph-duotone ph-user" style="margin-left:4px;color:${s.gender === 'girl' ? 'var(--gold)' : 'var(--emerald)'}"></i>${s.name}</div>
                  <div style="font-size:12px;color:var(--text-muted);display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;">
                    <span style="background:#f1f5f9;padding:2px 8px;border-radius:4px;">الباقة: <strong>${pkgName}</strong></span>
                    <span style="background:#f0fdf4;color:#065f46;padding:2px 8px;border-radius:4px;">قرآن: <strong>${s.quranLimit !== undefined ? s.quranLimit : 8}</strong></span>
                    <span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;">تربية: <strong>${s.islamicLimit !== undefined ? s.islamicLimit : 4}</strong></span>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-outline icon-btn" onclick="openStudentForm('${s.id}')"><i class="ph-duotone ph-pencil-simple"></i></button>
                  <button type="button" class="btn btn-danger icon-btn" onclick="deleteStudent('${s.id}')"><i class="ph-duotone ph-trash"></i></button>
                </div>
              </div>
            </div>
          `;}
            )
            .join("")}
        </div>
      </div>

      <div class="card-soft account-card exec-animate" style="--stagger: 8; padding: 32px !important;">
        <div class="d-flex justify-content-between align-items-center mb-4" style="border-bottom: 2px solid rgba(212, 175, 55, 0.15); padding-bottom: 16px;">
          <h3 style="font-size:var(--fs-xl);font-weight:var(--fw-extrabold);color:var(--text-primary);margin:0;">
            <i class="ph-duotone ph-users-three" style="margin-left:8px;"></i>إدارة المجموعات (${(window.appState.groups || []).length})
          </h3>
          <button type="button" class="btn btn-primary" onclick="openGroupForm()">
            <i class="ph-bold ph-plus" style="margin-left:4px;"></i>مجموعة جديدة
          </button>
        </div>
        
        ${(!window.appState.groups || window.appState.groups.length === 0) ? `<div style="color:#94A3B8;text-align:center;padding:20px;font-size:15px;">لا توجد مجموعات حالياً.</div>` : ""}
        
        <div class="d-grid gap-3">
          ${(window.appState.groups || [])
            .map((g, index) => {
              const members = (window.appState.students || []).filter((s) => g.studentIds?.includes(s.id));
              const names = members.map((m) => m.name).join("، ");
              return `
                <div class="card-soft exec-animate" style="--stagger: ${9 + (index * 0.2)}; padding:16px; background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0,0,0,0.04); border-radius: 16px; transition: all 0.3s ease;">
                  <div class="d-flex justify-content-between align-items-center">
                    <div style="flex:1; padding-left:12px;">
                      <div style="font-weight:var(--fw-bold);font-size:var(--fs-md);color:var(--text-primary);margin-bottom:4px;"><i class="ph-duotone ph-users" style="margin-left:4px;"></i>${g.name}</div>
                      <div style="font-size:var(--fs-xs);color:var(--text-muted);line-height:1.5;">${names || "بدون طلاب"}</div>
                    </div>
                    <div class="d-flex gap-2">
                      <button type="button" class="btn btn-outline icon-btn" onclick="openGroupForm('${g.id}')"><i class="ph-duotone ph-pencil-simple"></i></button>
                      <button type="button" class="btn btn-danger icon-btn" onclick="deleteGroup('${g.id}')"><i class="ph-duotone ph-trash"></i></button>
                    </div>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  window.renderSettingsPage = function () {
    ensurePackagesExist();

    const pkgForm = ensurePackageForm();
    if (pkgForm.open) return `<div class="account-profile-container" style="padding-top:20px;max-width:800px;">${renderPackageForm(pkgForm)}</div>`;
    
    const form = ensureStudentForm();
    if (form.open) return `<div class="account-profile-container" style="padding-top:20px;max-width:800px;">${renderStudentForm(form)}</div>`;
    
    const groupForm = ensureGroupForm();
    if (groupForm.open) return `<div class="account-profile-container" style="padding-top:20px;max-width:800px;">${renderGroupForm(groupForm)}</div>`;
    
    return `<div class="account-profile-container" style="padding-top:20px;max-width:800px;">${renderSettingsMain()}</div>`;
  };

  window.initSettingsPage = function () {
    if (typeof applyTheme === 'function') applyTheme();
    return;
  };

  // تشغيل آمن عند التحميل لا يسبب انهيار السكريبت
  try {
    if (typeof applyTheme === 'function') applyTheme();
  } catch (e) {
    console.log("AppState not ready yet, theme will apply on render.");
  }
})();
