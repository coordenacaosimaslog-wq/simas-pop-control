// Script para sincronizar dados com o Firebase Firestore (Compat Mode)

let localOprHistoryState = [];
let localTopProblemasState = [];

if (window.db) {
    // --- Listeners (Leitura em Tempo Real) ---
    window.db.collection('opr_history').onSnapshot((snapshot) => {
        localOprHistoryState = snapshot.docs.map(doc => doc.data());
        if (window.setOprHistoryDB) {
            window.setOprHistoryDB(JSON.parse(JSON.stringify(localOprHistoryState)));
        }
    });

    window.db.collection('top_problemas').onSnapshot((snapshot) => {
        localTopProblemasState = snapshot.docs.map(doc => doc.data());
        if (window.setTopProblemasDB) {
            window.setTopProblemasDB(JSON.parse(JSON.stringify(localTopProblemasState)));
        }
    });

    window.db.collection('config').doc('opr_branches').onSnapshot((docSnapshot) => {
        if (docSnapshot.exists && window.setOprBranches) {
            window.setOprBranches(docSnapshot.data().data);
        }
    });

    window.db.collection('config').doc('treinamentos_extras').onSnapshot((docSnapshot) => {
        if (docSnapshot.exists && window.setTreinamentosExtrasDB) {
            window.setTreinamentosExtrasDB(docSnapshot.data().data);
        }
    });
}

// --- Escritor Centralizado (Substitui o localStorage.setItem) ---
window.saveToFirebase = async function(key, currentArray) {
    if (!window.db) {
        console.warn('Firebase DB não inicializado. Salvando apenas no localStorage.');
        return;
    }
    try {
        if (key === 'simas_opr_history') {
            const batch = window.db.batch();
            let writes = 0;
            
            // Adições e Atualizações
            for (const item of currentArray) {
                const prev = localOprHistoryState.find(p => p.id === item.id);
                if (!prev || JSON.stringify(prev) !== JSON.stringify(item)) {
                    batch.set(window.db.collection('opr_history').doc(item.id.toString()), item);
                    writes++;
                }
            }
            
            // Exclusões por diff DESATIVADAS por segurança (Impede que cache vazio apague a nuvem)
            // As deleções no Firestore agora devem ser feitas através de ações explícitas (ex: deleteOpr)
            /* 
            for (const prev of localOprHistoryState) {
                if (!currentArray.find(i => i.id === prev.id)) {
                    batch.delete(window.db.collection('opr_history').doc(prev.id.toString()));
                    writes++;
                }
            }
            */
            
            if (writes > 0) {
                await batch.commit();
                localOprHistoryState = JSON.parse(JSON.stringify(currentArray));
            }
        } 
        else if (key === 'simas_top_problemas') {
            const batch = window.db.batch();
            let writes = 0;
            
            for (const item of currentArray) {
                const prev = localTopProblemasState.find(p => p.id === item.id);
                if (!prev || JSON.stringify(prev) !== JSON.stringify(item)) {
                    batch.set(window.db.collection('top_problemas').doc(item.id.toString()), item);
                    writes++;
                }
            }
            
            // Exclusões por diff DESATIVADAS por segurança
            /*
            for (const prev of localTopProblemasState) {
                if (!currentArray.find(i => i.id === prev.id)) {
                    batch.delete(window.db.collection('top_problemas').doc(prev.id.toString()));
                    writes++;
                }
            }
            */
            
            if (writes > 0) {
                await batch.commit();
                localTopProblemasState = JSON.parse(JSON.stringify(currentArray));
            }
        }
        else if (key === 'simas_opr_branches') {
            await window.db.collection('config').doc('opr_branches').set({ data: currentArray });
        }
        else if (key === 'simas_treinamentos_extras') {
            await window.db.collection('config').doc('treinamentos_extras').set({ data: currentArray });
        }
    } catch (e) {
        console.error("Erro ao salvar no Firebase:", e);
        if (typeof showToast === 'function') {
            showToast('Erro de sincronização com a nuvem.', 'error');
        }
    }
};

console.log("Firebase DB Sync initialized (Compat Mode).");

