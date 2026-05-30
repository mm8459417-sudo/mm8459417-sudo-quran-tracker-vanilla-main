(function () {
  if (!window.firebase) {
    console.error("Firebase SDK غير محمل");
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyBtHvklnxlP7ZgTvwJrpgMz4cbWiuhq9TM",
    authDomain: "create-project-36d4c.firebaseapp.com",
    projectId: "create-project-36d4c",
    storageBucket: "create-project-36d4c.firebasestorage.app",
    messagingSenderId: "384696044918",
    appId: "1:384696044918:web:d90b64b4d2f0f9e9b1fe57",
    measurementId: "G-GHY5QXRGS2",
  };

  window.firebaseApp = firebase.initializeApp(firebaseConfig);
  window.auth = firebase.auth();
  window.db = firebase.firestore();

  auth
    .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch((err) => console.error("Persistence error:", err));
})();
