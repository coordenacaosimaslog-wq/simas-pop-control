import re

def patch_app_js():
    with open('app.js', 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Insert Firebase initialization at the top
    firebase_init = """
// ==================== 1. FIREBASE CONFIGURATION ====================
const firebaseConfig = {
  apiKey: "AIzaSyB9n9fkUngmH7pxsIuu5reFX2NMmSRIXfI",
  authDomain: "simas-pop.firebaseapp.com",
  projectId: "simas-pop",
  storageBucket: "simas-pop.firebasestorage.app",
  messagingSenderId: "563849856810",
  appId: "1:563849856810:web:b721712371f7a2594e8053",
  measurementId: "G-2QG22RWJ5Y"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const storage = firebase.storage();

// ==================== 1.5. CONSTANTES ====================
"""
    # Replace the CONSTANTES header to inject it
    text = text.replace("// ==================== 1. CONSTANTES & ESTADOS ====================", firebase_init)

    # 2. Replace DBStore logic with Firestore logic in DOMContentLoaded
    dom_load_start = 'document.addEventListener("DOMContentLoaded", async () => {'
    dom_load_end = '        if (typeof applyFilters === \'function\') {'
    
    # We will use Regex to find the whole try-catch block inside DOMContentLoaded
    pattern_load = r'try \{\s*// Tenta ler do IndexedDB primeiro.*?if \(typeof applyFilters === \'function\'\) \{'
    
    new_load_logic = """try {
        // Tentar ler do Firestore
        const snapshot = await db.collection("simas_pops").get();
        if (!snapshot.empty) {
            pops = snapshot.docs.map(doc => doc.data());
            
            // Sort by ID descending (e.g. pop-003, pop-002, pop-001)
            pops.sort((a, b) => {
                const numA = parseInt(a.id.replace("pop-", ""), 10);
                const numB = parseInt(b.id.replace("pop-", ""), 10);
                return numB - numA; // Descending
            });
            
        } else {
            // Se o Firestore estiver vazio, verifica se tem dados migrados no IndexedDB local para subir
            const rawPops = await DBStore.getItem("simas_pops");
            if (rawPops) {
                const localPops = typeof rawPops === 'string' ? JSON.parse(rawPops) : rawPops;
                
                showToast("Sincronizando dados locais com a nuvem. Aguarde...", "info");
                
                for (const p of localPops) {
                    await db.collection("simas_pops").doc(p.id).set(p);
                }
                
                pops = localPops;
                showToast("Migração para a nuvem concluída!", "success");
            } else {
                pops = [];
            }
        }

        if (typeof applyFilters === 'function') {"""

    text = re.sub(pattern_load, new_load_logic, text, flags=re.DOTALL)

    # 3. Modify savePOP to upload file to Firebase Storage
    # In savePOP, we have activeUploadedFile.data
    # We need to change savePOP to be async and upload the file
    
    save_pop_decl = 'function savePOP(event) {'
    new_save_pop_decl = 'async function savePOP(event) {'
    text = text.replace(save_pop_decl, new_save_pop_decl)

    # We need to replace the logic inside savePOP
    # Specifically where the newPop is created and pushed.
    # It's better to replace the whole body of savePOP or target specific lines.
    
    # Target the creation of the object:
    # 
    # fileData: activeUploadedFile.data,
    
    # Wait, we need to upload FIRST, get the URL, then save to Firestore
    # The file is Base64 (DataURL)
    
    upload_logic = """
        if (!activeUploadedFile && !id) {
            showToast("É obrigatório carregar um documento regulamentar (PDF/Word/Excel).", "error");
            return;
        }
        
        showToast("Salvando e sincronizando com a nuvem...", "info");
        
        let fileUrl = null;
        let fileName = null;
        
        if (activeUploadedFile) {
            fileName = activeUploadedFile.name;
            const storageRef = storage.ref().child(`pops/${codigo}_${Date.now()}_${fileName}`);
            await storageRef.putString(activeUploadedFile.data, 'data_url');
            fileUrl = await storageRef.getDownloadURL();
        }
    """
    
    # Let's completely rewrite savePOP because it's complex
    # I'll find savePOP and replace it.
    
    # 4. Same for deletePOP
    delete_pop_decl = 'function deletePOP(id) {'
    new_delete_pop_decl = 'async function deletePOP(id) {'
    text = text.replace(delete_pop_decl, new_delete_pop_decl)
    
    text = text.replace('pops = pops.filter(p => p.id !== id);\n            DBStore.setItem("simas_pops", pops);',
                        'pops = pops.filter(p => p.id !== id);\n            await db.collection("simas_pops").doc(id).delete();')

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(text)

patch_app_js()
print("Patched Firebase init and load logic!")
