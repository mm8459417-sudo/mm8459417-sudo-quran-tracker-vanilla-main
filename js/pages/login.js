(function () {
  window.renderLoginPage = function () {
    const mode = appState.ui.loginMode || "login";
    const title = mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد";
    const toggleLabel = mode === "login" ? "أنشئ حساباً جديداً" : "سجل دخولك الآن";
    const toggleHint = mode === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟";
    const error = appState.ui.loginError;

    return `
      <div class="login-page" id="login-page">
        <div class="login-card">
          <img src="logo.jpeg" alt="رفيق القرآن" class="login-logo" onerror="this.style.display='none'" />
          <div class="login-bismillah" style="font-family: var(--font-display); color: var(--gold-light); font-size: 1.1rem; letter-spacing: 1px; margin-bottom: 8px;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <h1 class="login-title" style="color: var(--gold); font-family: var(--font-display); font-weight: 800;">رَفِيقُ القُرْآنِ</h1>
          <p class="login-subtitle">${title}</p>

          ${error ? `<div class="login-error">⚠️ ${error}</div>` : ""}

          <form id="login-form" class="login-form">
            <div>
              <label class="form-label">البريد الإلكتروني</label>
              <input id="login-email" type="email" class="form-control" placeholder="example@mail.com" required dir="ltr" style="text-align:right;" />
            </div>

            <div>
              <label class="form-label">كلمة المرور</label>
              <div class="password-wrap">
                <input id="login-password" type="password" class="form-control" placeholder="••••••••" required dir="ltr" style="text-align:right; padding-left:40px;" />
                <button type="button" id="toggle-password" class="password-toggle">
                  <svg id="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" class="login-submit">
              ${mode === "login" ? "دخول" : "إنشاء حساب"}
            </button>
          </form>

          <div class="login-divider"><span>أو</span></div>

          <button id="google-login" type="button" class="login-google">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path></svg>
            Google
          </button>

          <div class="login-toggle">
            ${toggleHint}
            <button id="toggle-login" type="button">${toggleLabel}</button>
          </div>
        </div>
      </div>
    `;
  };

  window.initLoginPage = function () {
    const form = document.getElementById("login-form");
    const toggleBtn = document.getElementById("toggle-login");
    const googleBtn = document.getElementById("google-login");

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();
        appState.ui.loginError = "";
        try {
          if (appState.ui.loginMode === "signup") {
            await authModule.signUpWithEmail(email, password);
          } else {
            await authModule.loginWithEmail(email, password);
          }
        } catch (err) {
          appState.ui.loginError = err;
          router.render();
        }
      });
    }

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        appState.ui.loginMode = appState.ui.loginMode === "login" ? "signup" : "login";
        appState.ui.loginError = "";
        router.render();
      });
    }

    if (googleBtn) {
      googleBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        appState.ui.loginError = "";
        try {
          await authModule.loginWithGoogle();
        } catch (err) {
          appState.ui.loginError = err;
          router.render();
        }
      });
    }

    // Password toggle
    const togglePasswordBtn = document.getElementById("toggle-password");
    const passwordInput = document.getElementById("login-password");
    const eyeIcon = document.getElementById("eye-icon");

    if (togglePasswordBtn && passwordInput && eyeIcon) {
      togglePasswordBtn.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        if (isPassword) {
          eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
        } else {
          eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        }
      });
    }

    // Auto-focus email
    setTimeout(() => {
      const emailInput = document.getElementById("login-email");
      if (emailInput) emailInput.focus();
    }, 600);
  };
})();
