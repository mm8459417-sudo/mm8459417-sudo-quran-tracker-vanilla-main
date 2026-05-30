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

  function ensureStudentForm() {
    if (!appState.ui.studentForm) {
      appState.ui.studentForm = {
        open: false,
        editId: null,
        name: "",
        phone: "",
        gender: "boy",
        sessionLimit: appState.settings.defaultLimit || 12,
        groupLink: "",
        schedule: [],
      };
    }
    return appState.ui.studentForm;
  }

  function ensureGroupForm() {
    if (!appState.ui.groupForm) {
      appState.ui.groupForm = {
        open: false,
        editId: null,
        name: "",
        groupLink: "",
        studentIds: [],
      };
    }
    return appState.ui.groupForm;
  }

  window.openStudentForm = function (studentId) {
    const form = ensureStudentForm();
    if (studentId) {
      const stu = appState.students.find((s) => s.id === studentId);
      if (stu) {
        form.editId = stu.id;
        form.name = stu.name || "";
        form.phone = stu.phone || "";
        form.gender = stu.gender || "boy";
        form.sessionLimit = stu.sessionLimit || 12;
        form.groupLink = stu.groupLink || "";
        form.schedule = Array.isArray(stu.schedule) ? stu.schedule : [];
      }
    } else {
      form.editId = null;
      form.name = "";
      form.phone = "";
      form.gender = "boy";
      form.sessionLimit = appState.settings.defaultLimit || 12;
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
    if (field === "gender") {
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

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      gender: form.gender,
      sessionLimit: parseInt(form.sessionLimit, 10) || 12,
      groupLink: form.groupLink.trim(),
      schedule: form.schedule,
    };

    try {
      if (form.editId) {
        await dbModule.updateStudent(form.editId, payload);
        showToast("تم تحديث الطالب");
      } else {
        await dbModule.addStudent(payload);
        showToast("تم إضافة الطالب");
      }
      form.open = false;
      router.render();
    } catch (err) {
      showToast("خطأ أثناء حفظ الطالب");
      console.error(err);
    }
  };

  window.openGroupForm = function (groupId) {
    const form = ensureGroupForm();
    if (groupId) {
      const group = appState.groups.find((g) => g.id === groupId);
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
    if (!form.studentIds.length) {
      showToast("اختر طلاب المجموعة");
      return;
    }

    const payload = {
      name: form.name.trim(),
      groupLink: form.groupLink.trim(),
      studentIds: form.studentIds,
    };

    try {
      if (form.editId) {
        await dbModule.updateGroup(form.editId, payload);
        showToast("تم تحديث المجموعة");
      } else {
        await dbModule.addGroup(payload);
        showToast("تم إنشاء المجموعة");
      }
      form.open = false;
      router.render();
    } catch (err) {
      showToast("خطأ أثناء حفظ المجموعة");
      console.error(err);
    }
  };

  window.deleteGroup = async function (id) {
    if (!window.confirm("هل تريد حذف المجموعة؟")) return;
    try {
      await dbModule.deleteGroup(id);
      showToast("تم حذف المجموعة");
    } catch (err) {
      showToast("خطأ أثناء حذف المجموعة");
    }
  };

  window.deleteStudent = async function (id) {
    if (!window.confirm("هل تريد حذف الطالب وكل بياناته؟")) return;
    try {
      await dbModule.deleteStudent(id);
      showToast("تم حذف الطالب");
    } catch (err) {
      showToast("خطأ أثناء الحذف");
    }
  };

  window.saveSettings = async function () {
    const defaultLimit = parseInt(document.getElementById("settings-limit").value, 10) || 12;
    const accountingPhone = document.getElementById("settings-phone").value.trim();

    try {
      await dbModule.saveSettings({ defaultLimit, accountingPhone });
      showToast("تم حفظ الإعدادات");
    } catch (err) {
      showToast("خطأ أثناء حفظ الإعدادات");
    }
  };

  function renderStudentForm(form) {
    return `
      <div class="card-soft account-card exec-animate" style="--stagger: 1; padding: 32px !important;">
        <div class="d-flex justify-content-between align-items-center mb-4" style="border-bottom: 2px solid rgba(212, 175, 55, 0.15); padding-bottom: 16px;">
          <h3 style="font-size:20px;font-weight:800;color:var(--gold);font-family: var(--font-display);">
            ${form.editId ? "<i class='ph-duotone ph-pencil-simple' style='margin-left:8px;'></i>تعديل بيانات الطالب" : "<i class='ph-duotone ph-plus-circle' style='margin-left:8px;'></i>إضافة طالب جديد"}
          </h3>
          <button class="btn btn-light rounded-circle" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;" onclick="closeStudentForm()">✕</button>
        </div>

        <div class="form-group mb-4 exec-animate" style="--stagger: 2;">
          <input class="form-control account-custom-input" value="${form.name}" oninput="updateStudentFormField('name', this.value)" placeholder=" " />
          <label class="form-label">اسم الطالب</label>
          <div class="account-input-line"></div>
        </div>

        <div class="mb-4 exec-animate" style="--stagger: 3;">
          <label style="font-size:15px;color:#94A3B8;font-weight:600;margin-bottom:12px;display:block;">النوع</label>
          <div class="d-flex gap-3">
            <button class="btn ${form.gender === "boy" ? "btn-primary" : "btn-outline"} flex-fill" onclick="updateStudentFormField('gender','boy')"><i class="ph-duotone ph-user" style="margin-left:4px;"></i>ولد</button>
            <button class="btn ${form.gender === "girl" ? "btn-gold" : "btn-outline"} flex-fill" onclick="updateStudentFormField('gender','girl')"><i class="ph-duotone ph-user" style="margin-left:4px;"></i>بنت</button>
          </div>
        </div>

        <div class="form-group mb-4 exec-animate" style="--stagger: 4;">
          <input class="form-control account-custom-input" value="${form.phone}" oninput="updateStudentFormField('phone', this.value)" dir="ltr" style="text-align: right;" placeholder=" " />
          <label class="form-label">واتساب ولي الأمر</label>
          <div class="account-input-line"></div>
        </div>

        <div class="form-group mb-4 exec-animate" style="--stagger: 5;">
          <input class="form-control account-custom-input" value="${form.groupLink}" oninput="updateStudentFormField('groupLink', this.value)" dir="ltr" style="text-align: right;" placeholder=" " />
          <label class="form-label">رابط الجروب (اختياري)</label>
          <div class="account-input-line"></div>
        </div>

        <div class="form-group mb-4 exec-animate" style="--stagger: 6;">
          <input type="number" class="form-control account-custom-input" value="${form.sessionLimit}" oninput="updateStudentFormField('sessionLimit', this.value)" placeholder=" " />
          <label class="form-label">سعة الباقة (عدد الحصص)</label>
          <div class="account-input-line"></div>
        </div>

        <div class="card-soft mb-4 exec-animate" style="--stagger: 7; background: rgba(255,255,255,0.4); border: 1px dashed rgba(212,175,55,0.4);">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span style="font-weight:var(--fw-bold);color:var(--text-primary);"><i class="ph-duotone ph-calendar-blank" style="margin-left:8px;"></i>مواعيد الحلقة الأسبوعية</span>
            <button class="btn btn-outline btn-sm" onclick="addScheduleSlot()"><i class="ph-bold ph-plus" style="margin-left:4px;"></i>إضافة موعد</button>
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
              <button class="btn btn-danger" style="border-radius:var(--r-md);width:46px;height:46px;display:flex;align-items:center;justify-content:center;" onclick="removeScheduleSlot(${idx})">×</button>
            </div>
          `
            )
            .join("")}
        </div>

        <button class="btn account-save-btn exec-animate" style="--stagger: 8;" onclick="saveStudentForm()">
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
          <button class="btn btn-light rounded-circle" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;" onclick="closeGroupForm()">✕</button>
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

        <div class="card-soft mb-4 exec-animate" style="--stagger: 4; background: rgba(255,255,255,0.4); border: 1px dashed rgba(212,175,55,0.4);">
          <div style="font-weight:var(--fw-bold);margin-bottom:16px;color:var(--text-primary);"><i class="ph-duotone ph-users" style="margin-left:8px;"></i>اختر طلاب المجموعة</div>
          <div class="d-grid gap-3">
            ${appState.students
              .map(
                (s) => `
              <label class="form-check" style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,0.6);border-radius:12px;border:1px solid rgba(0,0,0,0.03);cursor:pointer;transition:all 0.2s;">
                <input class="form-check-input" style="width:24px;height:24px;margin-top:0;" type="checkbox" ${
                  form.studentIds.includes(s.id) ? "checked" : ""
                } onchange="toggleGroupMember('${s.id}', this.checked)" />
                <span style="font-weight:var(--fw-bold);font-size:var(--fs-md);color:var(--text-primary);"><i class="ph-duotone ph-user" style="margin-left:4px;color:${s.gender === 'girl' ? 'var(--gold)' : 'var(--emerald)'}"></i>${s.name}</span>
              </label>
            `
              )
              .join("")}
          </div>
        </div>

        <button class="btn account-save-btn exec-animate" style="--stagger: 5;" onclick="saveGroupForm()">
          <i class="ph-duotone ph-floppy-disk" style="margin-left:8px;"></i>${form.editId ? "حفظ التعديلات" : "إنشاء المجموعة"}
        </button>
      </div>
    `;
  }

  function renderSettingsMain() {
    return `
      <!-- SYSTEM SETTINGS -->
      <div class="card-soft account-card mb-4 exec-animate" style="--stagger: 1; padding: 32px !important;">
        <h3 class="account-section-title"><i class="ph-duotone ph-gear-six" style="margin-left:8px;"></i>إعدادات المنصة</h3>
        
        <div class="form-group mb-4 exec-animate" style="--stagger: 2;">
          <input id="settings-limit" type="number" class="form-control account-custom-input" value="${appState.settings.defaultLimit}" placeholder=" " />
          <label class="form-label" for="settings-limit">الحد الافتراضي للباقة (عدد الحصص)</label>
          <div class="account-input-line"></div>
        </div>
        
        <div class="form-group mb-4 exec-animate" style="--stagger: 3;">
          <input id="settings-phone" class="form-control account-custom-input" dir="ltr" style="text-align: right;" value="${appState.settings.accountingPhone || ''}" placeholder=" " />
          <label class="form-label" for="settings-phone">رقم المحاسب (واتساب)</label>
          <div class="account-input-line"></div>
        </div>
        
        <button class="btn account-save-btn exec-animate" style="--stagger: 4; margin-top: 0;" onclick="saveSettings()">
          <i class="ph-duotone ph-floppy-disk" style="margin-left:8px;"></i>حفظ الإعدادات
        </button>
      </div>

      <!-- STUDENTS MANAGEMENT -->
      <div class="card-soft account-card mb-4 exec-animate" style="--stagger: 5; padding: 32px !important;">
        <div class="d-flex justify-content-between align-items-center mb-4" style="border-bottom: 2px solid rgba(212, 175, 55, 0.15); padding-bottom: 16px;">
          <h3 style="font-size:var(--fs-xl);font-weight:var(--fw-extrabold);color:var(--text-primary);margin:0;">
            <i class="ph-duotone ph-users" style="margin-left:8px;"></i>إدارة الطلاب (${appState.students.length})
          </h3>
          <button class="btn btn-primary" onclick="openStudentForm()">
            <i class="ph-bold ph-plus" style="margin-left:4px;"></i>طالب جديد
          </button>
        </div>
        
        ${appState.students.length === 0 ? `<div style="color:#94A3B8;text-align:center;padding:20px;font-size:15px;">لا يوجد طلاب مسجلين بعد.</div>` : ""}
        
        <div class="d-grid gap-3">
          ${appState.students
            .map(
              (s, index) => `
            <div class="card-soft exec-animate" style="--stagger: ${6 + (index * 0.5)}; padding:16px; background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0,0,0,0.04); border-radius: 16px; transition: all 0.3s ease;">
              <div class="d-flex justify-content-between align-items-center">
                <div style="flex:1;">
                  <div style="font-weight:var(--fw-bold);font-size:var(--fs-md);color:var(--text-primary);margin-bottom:4px;"><i class="ph-duotone ph-user" style="margin-left:4px;color:${s.gender === 'girl' ? 'var(--gold)' : 'var(--emerald)'}"></i>${s.name}</div>
                  <div style="font-size:var(--fs-xs);color:var(--text-muted);">
                    باقة: <span style="color:var(--emerald);">${s.sessionLimit || 12}</span> | 
                    مواعيد: <span style="color:var(--emerald);">${s.schedule?.length || 0}</span>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button class="btn btn-outline icon-btn" onclick="openStudentForm('${s.id}')"><i class="ph-duotone ph-pencil-simple"></i></button>
                  <button class="btn btn-danger icon-btn" onclick="deleteStudent('${s.id}')"><i class="ph-duotone ph-trash"></i></button>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- GROUPS MANAGEMENT -->
      <div class="card-soft account-card exec-animate" style="--stagger: 8; padding: 32px !important;">
        <div class="d-flex justify-content-between align-items-center mb-4" style="border-bottom: 2px solid rgba(212, 175, 55, 0.15); padding-bottom: 16px;">
          <h3 style="font-size:var(--fs-xl);font-weight:var(--fw-extrabold);color:var(--text-primary);margin:0;">
            <i class="ph-duotone ph-users-three" style="margin-left:8px;"></i>إدارة المجموعات (${appState.groups.length})
          </h3>
          <button class="btn btn-primary" onclick="openGroupForm()">
            <i class="ph-bold ph-plus" style="margin-left:4px;"></i>مجموعة جديدة
          </button>
        </div>
        
        ${appState.groups.length === 0 ? `<div style="color:#94A3B8;text-align:center;padding:20px;font-size:15px;">لا توجد مجموعات حالياً.</div>` : ""}
        
        <div class="d-grid gap-3">
          ${appState.groups
            .map((g, index) => {
              const members = appState.students.filter((s) => g.studentIds?.includes(s.id));
              const names = members.map((m) => m.name).join("، ");
              return `
                <div class="card-soft exec-animate" style="--stagger: ${9 + (index * 0.5)}; padding:16px; background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0,0,0,0.04); border-radius: 16px; transition: all 0.3s ease;">
                  <div class="d-flex justify-content-between align-items-center">
                    <div style="flex:1; padding-left:12px;">
                      <div style="font-weight:var(--fw-bold);font-size:var(--fs-md);color:var(--text-primary);margin-bottom:4px;"><i class="ph-duotone ph-users" style="margin-left:4px;"></i>${g.name}</div>
                      <div style="font-size:var(--fs-xs);color:var(--text-muted);line-height:1.5;">${names || "بدون طلاب"}</div>
                    </div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-outline icon-btn" onclick="openGroupForm('${g.id}')"><i class="ph-duotone ph-pencil-simple"></i></button>
                      <button class="btn btn-danger icon-btn" onclick="deleteGroup('${g.id}')"><i class="ph-duotone ph-trash"></i></button>
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
    const form = ensureStudentForm();
    if (form.open) return `<div class="account-profile-container" style="padding-top:20px;max-width:800px;">${renderStudentForm(form)}</div>`;
    const groupForm = ensureGroupForm();
    if (groupForm.open) return `<div class="account-profile-container" style="padding-top:20px;max-width:800px;">${renderGroupForm(groupForm)}</div>`;
    return `<div class="account-profile-container" style="padding-top:20px;max-width:800px;">${renderSettingsMain()}</div>`;
  };

  window.initSettingsPage = function () {
    return;
  };
})();
