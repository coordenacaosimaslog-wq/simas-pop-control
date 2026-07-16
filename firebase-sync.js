import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCv2C8bBB1Dnmn67HLdEiIHuSLK5i_bLc",
  authDomain: "simas-pop-control.firebaseapp.com",
  projectId: "simas-pop-control",
  storageBucket: "simas-pop-control.firebasestorage.app",
  messagingSenderId: "843930571694",
  appId: "1:843930571694:web:ca0c2d83b0aeca8f6b6e3f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State mirrors to calculate diffs and avoid rewriting identical data
let localOprHistoryState = [];
let localTopProblemasState = [];

// --- Listeners (Leitura em Tempo Real) ---

onSnapshot(collection(db, 'opr_history'), (snapshot) => {
    localOprHistoryState = snapshot.docs.map(doc => doc.data());
    if (window.setOprHistoryDB) {
        window.setOprHistoryDB(JSON.parse(JSON.stringify(localOprHistoryState)));
    }
});

onSnapshot(collection(db, 'top_problemas'), (snapshot) => {
    localTopProblemasState = snapshot.docs.map(doc => doc.data());
    if (window.setTopProblemasDB) {
        window.setTopProblemasDB(JSON.parse(JSON.stringify(localTopProblemasState)));
    }
});

onSnapshot(doc(db, 'config', 'opr_branches'), (docSnapshot) => {
    if (docSnapshot.exists() && window.setOprBranches) {
        window.setOprBranches(docSnapshot.data().data);
    }
});

onSnapshot(doc(db, 'config', 'treinamentos_extras'), (docSnapshot) => {
    if (docSnapshot.exists() && window.setTreinamentosExtrasDB) {
        window.setTreinamentosExtrasDB(docSnapshot.data().data);
    }
});

// --- Escritor Centralizado (Substitui o localStorage.setItem) ---

window.saveToFirebase = async function(key, currentArray) {
    try {
        if (key === 'simas_opr_history') {
            const batch = writeBatch(db);
            let writes = 0;
            
            // Adições e Atualizações
            for (const item of currentArray) {
                const prev = localOprHistoryState.find(p => p.id === item.id);
                if (!prev || JSON.stringify(prev) !== JSON.stringify(item)) {
                    batch.set(doc(db, 'opr_history', item.id.toString()), item);
                    writes++;
                }
            }
            
            // Exclusões
            for (const prev of localOprHistoryState) {
                if (!currentArray.find(i => i.id === prev.id)) {
                    batch.delete(doc(db, 'opr_history', prev.id.toString()));
                    writes++;
                }
            }
            
            if (writes > 0) {
                await batch.commit();
                localOprHistoryState = JSON.parse(JSON.stringify(currentArray));
            }
        } 
        else if (key === 'simas_top_problemas') {
            const batch = writeBatch(db);
            let writes = 0;
            
            for (const item of currentArray) {
                const prev = localTopProblemasState.find(p => p.id === item.id);
                if (!prev || JSON.stringify(prev) !== JSON.stringify(item)) {
                    batch.set(doc(db, 'top_problemas', item.id.toString()), item);
                    writes++;
                }
            }
            
            for (const prev of localTopProblemasState) {
                if (!currentArray.find(i => i.id === prev.id)) {
                    batch.delete(doc(db, 'top_problemas', prev.id.toString()));
                    writes++;
                }
            }
            
            if (writes > 0) {
                await batch.commit();
                localTopProblemasState = JSON.parse(JSON.stringify(currentArray));
            }
        }
        else if (key === 'simas_opr_branches') {
            await setDoc(doc(db, 'config', 'opr_branches'), { data: currentArray });
        }
        else if (key === 'simas_treinamentos_extras') {
            await setDoc(doc(db, 'config', 'treinamentos_extras'), { data: currentArray });
        }
    } catch (e) {
        console.error("Erro ao salvar no Firebase:", e);
        if (typeof showToast === 'function') {
            showToast('Erro de sincronização com a nuvem.', 'error');
        }
    }
};

console.log("Firebase DB Sync initialized.");
