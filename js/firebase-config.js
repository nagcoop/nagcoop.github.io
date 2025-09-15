// /js/firebase-config.js
;(() => {
  // Replace with YOUR Firebase config
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "XXXX",
    appId: "1:XXXX:web:YYYY"
  };
  window.firebaseApp = firebase.initializeApp(firebaseConfig);
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage();
})();
