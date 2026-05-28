// =========================================================================
// CONFIGURAÇÃO DO BANCO DE DADOS EM NUVEM (FIREBASE) - SIMAS LOGÍSTICA
// =========================================================================

// PASSO 1: Acesse https://console.firebase.google.com/
// PASSO 2: Crie um novo projeto chamado "Simas POP Control"
// PASSO 3: Clique no ícone de "Web" (</>) para registrar o app
// PASSO 4: Copie o bloco de chaves (firebaseConfig) e cole abaixo:

const firebaseConfig = {
    apiKey: "AIzaSyB9n9fkUngmH7pxsIuu5reFX2NMmSRIXfI",
    authDomain: "simas-pop.firebaseapp.com",
    projectId: "simas-pop",
    storageBucket: "simas-pop.firebasestorage.app",
    messagingSenderId: "563849856810",
    appId: "1:563849856810:web:b721712371f7a2594e8053",
    measurementId: "G-2QG22RWJ5Y"
};

// =========================================================================
// NÃO ALTERE NADA ABAIXO DESTA LINHA
// =========================================================================

try {
    // Inicializa o Firebase apenas se a chave não for a de rascunho
    if (firebaseConfig.apiKey !== "COLE_SUA_API_KEY_AQUI") {
        firebase.initializeApp(firebaseConfig);
        
        // Torna o banco de dados (db) global para todo o sistema usar
        window.db = firebase.firestore();

        // Ativa persistência offline (funciona mesmo se a internet cair)
        window.db.enablePersistence().catch((err) => {
            console.warn("Persistência offline não habilitada:", err);
        });
        
        console.log("🔥 Firebase inicializado com sucesso!");
    } else {
        console.warn("⚠️ Firebase aguardando configuração. Rodando em modo Local/Offline.");
    }
} catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
}
