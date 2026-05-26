import re
import sys

def patch_app_js():
    with open('app.js', 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Inject DBStore before SafeStorage
    db_store_code = """
// ==================== 3.5. BANCO DE DADOS LOCAL DE ALTA CAPACIDADE (IndexedDB) ====================
const DBStore = {
    dbName: 'SimasAppDB',
    storeName: 'simas_store',
    version: 1,
    
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async setItem(key, value) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                const request = store.put(value, key);
                request.onsuccess = () => resolve();
                request.onerror = (e) => reject(e.target.error);
            });
        } catch(e) {
            console.error("[DBStore] Erro ao salvar dados:", e);
        }
    },

    async getItem(key) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
            });
        } catch(e) {
            console.error("[DBStore] Erro ao ler dados:", e);
            return null;
        }
    }
};

// ==================== 4. LEITURA SEGURA DE DADOS DO BANCO LOCAL ====================
"""
    
    text = re.sub(r'// ==================== 4\. LEITURA SEGURA DE DADOS DO BANCO LOCAL ====================', db_store_code, text)

    # 2. Modify DOMContentLoaded to be async
    text = text.replace('document.addEventListener("DOMContentLoaded", () => {', 'document.addEventListener("DOMContentLoaded", async () => {')

    # 3. Replace the old pops loading logic
    old_loading_logic = """let pops = INITIAL_POPS;
try {
    const rawPops = SafeStorage.getItem("simas_pops");
    if (rawPops) {
        pops = JSON.parse(rawPops);
        // Migrao robusta de dados legados de 'processo' para 'area'
        pops.forEach(pop => {
            if (pop.processo !== undefined && pop.area === undefined) {
                pop.area = pop.processo;
                delete pop.processo;
            }
        });
    } else {
        pops = INITIAL_POPS;
    }
} catch (e) {
    console.error("Erro ao ler pops iniciais do localStorage, usando defaults:", e);
    pops = INITIAL_POPS;
}"""

    new_loading_logic = """let pops = INITIAL_POPS;
try {
    // Tenta ler do IndexedDB primeiro
    let rawPops = await DBStore.getItem("simas_pops");
    
    if (rawPops) {
        pops = typeof rawPops === 'string' ? JSON.parse(rawPops) : rawPops;
    } else {
        // Se IndexedDB estiver vazio, tenta migrar do localStorage antigo
        const lsPops = SafeStorage.getItem("simas_pops");
        if (lsPops) {
            pops = JSON.parse(lsPops);
            // Salva no novo banco e limpa o antigo para liberar cota
            await DBStore.setItem("simas_pops", pops);
            SafeStorage.removeItem("simas_pops");
            console.log("Migração de dados do localStorage para IndexedDB concluída com sucesso.");
        } else {
            pops = INITIAL_POPS;
        }
    }

    // Migracao robusta de dados legados de 'processo' para 'area'
    pops.forEach(pop => {
        if (pop.processo !== undefined && pop.area === undefined) {
            pop.area = pop.processo;
            delete pop.processo;
        }
    });
} catch (e) {
    console.error("Erro ao ler pops do banco de dados, usando defaults:", e);
    pops = INITIAL_POPS;
}"""

    text = text.replace(old_loading_logic, new_loading_logic)

    # 4. Replace all occurrences of SafeStorage.setItem("simas_pops", JSON.stringify(pops));
    # with DBStore.setItem("simas_pops", pops);
    
    text = text.replace('SafeStorage.setItem("simas_pops", JSON.stringify(pops));', 'DBStore.setItem("simas_pops", pops);')

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(text)

patch_app_js()
print('Patched app.js with DBStore!')
