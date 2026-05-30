class AuthModule {
  constructor() {
    this.currentUser = null;
  }

  async loginWithEmail(email, password) {
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      return result.user;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async signUpWithEmail(email, password) {
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      return result.user;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await auth.signInWithPopup(provider);
      return result.user;
    } catch (error) {
      if (
        error.code === "auth/popup-blocked" ||
        error.code === "auth/popup-closed-by-user"
      ) {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await auth.signInWithRedirect(provider);
        return null;
      }
      throw this.mapError(error);
    }
  }

  async logout() {
    try {
      await auth.signOut();
      this.currentUser = null;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  onAuthStateChanged(callback) {
    auth.onAuthStateChanged((user) => {
      this.currentUser = user || null;
      callback(this.currentUser);
    });
  }

  mapError(error) {
    const map = {
      "auth/user-not-found": "هذا الحساب غير موجود",
      "auth/wrong-password": "كلمة المرور غير صحيحة",
      "auth/invalid-credential": "بيانات الدخول غير صحيحة",
      "auth/email-already-in-use": "هذا البريد مسجل بالفعل",
      "auth/invalid-email": "البريد الإلكتروني غير صحيح",
      "auth/weak-password": "كلمة المرور ضعيفة جداً",
      "auth/user-disabled": "الحساب معطل",
    };
    return map[error.code] || error.message;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

window.authModule = new AuthModule();
