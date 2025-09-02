// /js/firebase-config.js
;(() => {
  // TODO: substitua com a SUA config (Firebase Console → Project settings → Web app)
  const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJ.firebaseapp.com",
    projectId: "SEU_PROJ",
    storageBucket: "SEU_PROJ.appspot.com",
    messagingSenderId: "XXXX",
    appId: "1:XXXX:web:YYYY"
  };
  window.firebaseApp = firebase.initializeApp(firebaseConfig);
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage();
})();
