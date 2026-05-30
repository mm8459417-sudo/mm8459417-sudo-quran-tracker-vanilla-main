(function () {
  // Tashkeel parser for premium Arabic typography
  function renderTashkeelName(name) {
    if (!name) return "المعلم";
    const tashkeelRegex = /[\u064B-\u065F\u0670]/g;
    let html = "";
    let buffer = "";
    for (let i = 0; i < name.length; i++) {
      const char = name[i];
      if (tashkeelRegex.test(char)) {
        if (buffer) {
          html += `<span class="base-letter">${buffer}</span>`;
          buffer = "";
        }
        html += `<span class="tashkeel">${char}</span>`;
      } else {
        buffer += char;
      }
    }
    if (buffer) html += `<span class="base-letter">${buffer}</span>`;
    return html;
  }

  window.renderAccountPage = function () {
    const user = appState.user;
    const email = user ? user.email : "";
    const teacherName = appState.settings.teacherName || "";
    const initial = teacherName
      ? teacherName.charAt(0)
      : email
        ? email.charAt(0).toUpperCase()
        : "؟";

    return `
      <div class="account-page">
        <div class="account-hero-cover exec-animate" style="--stagger: 1;"></div>

        <div class="account-profile-container">
          <div class="account-header exec-animate" style="--stagger: 2;">
            <div class="account-avatar">${initial}</div>
            <div>
              <div class="account-welcome">مرحباً بك <i class="ph-duotone ph-hand-waving" style="color:var(--gold);"></i></div>
              <div class="account-name-display">${renderTashkeelName(teacherName || "المعلم")}</div>
            </div>
          </div>

          <!-- Zikr -->
          <div class="zikr-micro-bar exec-animate" style="--stagger: 3;">
            <div id="dynamic-zikr-text" class="zikr-text"></div>
          </div>

          <!-- Account Info -->
          <div class="account-card mt-4 exec-animate" style="--stagger: 4;">
            <h3 class="account-section-title">بيانات الحساب</h3>

            <div class="mb-4">
              <div class="account-email-display">
                <i class="ph-duotone ph-envelope-simple" style="font-size:20px;color:var(--text-muted);"></i>
                <span dir="ltr">${email}</span>
              </div>
            </div>

            <div class="form-group mb-4 exec-animate" style="--stagger: 5;">
              <label class="form-label" for="account-teacher-name">الاسم الكريم بالتشكيل (مثال: مُحَمَّد)</label>
              <input
                id="account-teacher-name"
                class="form-control"
                value="${teacherName}"
                placeholder="اكتب اسمك هنا"
              />
              <div class="account-hint">هذا الاسم يظهر في الترحيب والتقارير والشهادات</div>
            </div>

            <div class="form-group mb-4 exec-animate" style="--stagger: 6;">
              <label class="form-label" for="account-teacher-phone">رقم الهاتف (اختياري)</label>
              <input
                id="account-teacher-phone"
                class="form-control"
                type="tel"
                dir="ltr"
                style="text-align: right;"
                value="${appState.settings.teacherPhone || ""}"
                placeholder="01xxxxxxxxx"
              />
              <div class="account-hint">سيظهر هذا الرقم في تقارير المتابعة</div>
            </div>

            <button class="btn btn-primary w-100 btn-lg exec-animate" style="--stagger: 7;" onclick="saveAccountName()">
              <i class="ph-duotone ph-floppy-disk" style="margin-left:8px;"></i>حفظ التحديثات
            </button>
          </div>

          <!-- Logout -->
          <div class="account-logout-card mt-4 exec-animate" style="--stagger: 8;">
            <div class="account-logout-content">
              <div>
                <div class="account-logout-title">تسجيل الخروج</div>
                <div class="account-logout-hint">سيتم إنهاء الجلسة الحالية بشكل آمن</div>
              </div>
              <button class="account-logout-btn" onclick="handleLogout()">
                <i class="ph-bold ph-sign-out" style="margin-left:4px;"></i>
                خروج
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  window.saveAccountName = async function () {
    const nameInput = document.getElementById("account-teacher-name");
    const phoneInput = document.getElementById("account-teacher-phone");
    if (!nameInput || !phoneInput) return;

    const newName = nameInput.value.trim();
    const newPhone = phoneInput.value.trim();
    
    if (!newName) {
      showToast("اكتب اسمك أولاً");
      return;
    }

    try {
      await dbModule.saveSettings({ 
        teacherName: newName,
        teacherPhone: newPhone
      });
      showToast("تم حفظ البيانات بنجاح");
      setTimeout(() => router.render(), 300);
    } catch (err) {
      showToast("خطأ أثناء حفظ البيانات");
      console.error(err);
    }
  };

  // Zikr engine
  window.initAccountPage = function () {
    const zikrElement = document.getElementById("dynamic-zikr-text");
    if (!zikrElement) return;

    const zikrs = [
      "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
      "الْحَمْدُ لِلَّهِ حَمْداً كَثِيراً",
      "لَا إِلَهَ إِلَّا اللَّهُ",
      "اللَّهُ أَكْبَرُ"
    ];
    let zikrIndex = 0;

    function cycleZikr() {
      zikrElement.style.opacity = "0";
      zikrElement.style.transform = "translateY(8px)";
      
      setTimeout(() => {
        zikrElement.innerText = zikrs[zikrIndex];
        zikrIndex = (zikrIndex + 1) % zikrs.length;
        zikrElement.style.opacity = "0.7";
        zikrElement.style.transform = "translateY(0)";
      }, 1000);
    }

    zikrElement.innerText = zikrs[0];
    setTimeout(() => {
      zikrElement.style.opacity = "0.7";
      zikrElement.style.transform = "translateY(0)";
    }, 500);

    if (window.accountZikrInterval) clearInterval(window.accountZikrInterval);
    window.accountZikrInterval = setInterval(cycleZikr, 6000);
  };
})();
