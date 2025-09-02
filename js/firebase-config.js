// Copie as credenciais do seu projeto Firebase e cole abaixo.
// Console Firebase → Configurações do projeto → Seus apps → CDN.
// NÃO remova a chamada firebase.initializeApp(...).
const firebaseConfig = {
  apiKey: "COLOQUE_SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SUA_APP_ID"
};
firebase.initializeApp(firebaseConfig);
// Atalhos globais
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
