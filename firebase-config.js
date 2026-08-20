// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyDCv2C8bBB1Dnmn67HLdEiIHuSLK5i_bLc",
  authDomain: "simas-pop-control.firebaseapp.com",
  projectId: "simas-pop-control",
  storageBucket: "simas-pop-control.firebasestorage.app",
  messagingSenderId: "843930571694",
  appId: "1:843930571694:web:ca0c2d83b0aeca8f6b6e3f"
};

// Inicializa o Firebase (Compat mode)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Exporta o banco de dados para uso global
window.db = firebase.firestore();

console.log("Firebase e Firestore inicializados com sucesso.");
