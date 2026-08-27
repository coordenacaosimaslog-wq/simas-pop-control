
const TRAINING_DOCUMENT_CODES = {
    "MATRIZ": "MT FM RH 003.ANX1",
    "SAO ROQUE": "SR FM RH 003.ANX1",
    "SOROCABA": "SC FM RH 003.ANX1",
    "CAMACARI": "CAM FM RH 003.ANX1",
    "FUNEAS": "PR FM RH 003.ANX1",
    "SJP PREFEITURA": "SJP FM RH 003.ANX1",
    "GOVERNADOR VALADARES": "GV FM RH 003.ANX1",
    "JUATUBA": "JB FM RH 003.ANX1"
};

const MASTER_LIST_BRANCH_PREFIXES = {
    "MATRIZ": "MT",
    "SAO ROQUE": "SR",
    "SOROCABA": "SC",
    "CAMACARI": "CAM",
    "FUNEAS": "PR",
    "SJP PREFEITURA": "SJP",
    "GOVERNADOR VALADARES": "GV",
    "JUATUBA": "JB"
};

function openMasterListModal() {
    const modal = document.getElementById("master-list-filial-modal");
    if (modal) {
        document.getElementById("master-list-filial-select").value = "";
        modal.classList.add("active");
    }
}

function closeMasterListModal() {
    const modal = document.getElementById("master-list-filial-modal");
    if (modal) {
        modal.classList.remove("active");
    }
}

function generateMasterListFromModal() {
    const filial = document.getElementById("master-list-filial-select").value;
    if (!filial) {
        alert("Selecione uma filial para gerar a Lista Mestra.");
        return;
    }
    closeMasterListModal();
    exportMasterList(filial);
}

function openTrainingPdfModal() {
    const modal = document.getElementById("training-pdf-filial-modal");
    if (modal) {
        document.getElementById("training-pdf-filial-select").value = "";
        modal.classList.add("active");
    }
}

function closeTrainingPdfModal() {
    const modal = document.getElementById("training-pdf-filial-modal");
    if (modal) {
        modal.classList.remove("active");
    }
}

function confirmTrainingPdfExport() {
    const select = document.getElementById("training-pdf-filial-select");
    if (!select || !select.value) {
        showToast("Selecione uma filial para exportar o PDF.", "warning");
        return;
    }
    const filialKey = select.value;
    closeTrainingPdfModal();
    exportTrainingsToPDF(filialKey);
}



// Globais para gráficos
let chartFilialInstance = null;
let chartAreaInstance = null;
let chartStatusInstance = null;
let oprCurrentPage = 1;
let oprItemsPerPage = 10;


// RECONSTRUCTED: showToast
function showToast(message, type = "success") {
    let container = document.getElementById("toast-container-id") || document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container-id";
        container.className = "toast-container";
        container.style.position = "fixed";
        container.style.top = "20px";
        container.style.right = "20px";
        container.style.zIndex = "999999";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.style.background = type === 'error' ? '#ef4444' : (type === 'warning' ? '#f59e0b' : '#10b981');
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.marginBottom = '10px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    toast.style.fontWeight = '500';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
// ==================== CHECKPOINT 2.4 - ETAPA 5: LICENÇAS ====================
const LICENCAS_ALERTA_DIAS = 30;


// ==================== MOCK DATA PARA AMBIENTE ISOLADO ====================
if (typeof currentOprRecordId === 'undefined') {
    var currentOprRecordId = "opr-teste";
}
if (typeof oprHistoryDB === 'undefined' || oprHistoryDB.length === 0) {
    var oprHistoryDB = [
        {
            id: "opr-teste",
            branch: "Matriz",
            ano: 2026,
            mes: 6, // Julho (0-indexed)
            createdAt: new Date("2026-07-16T12:00:00").toISOString(),
            data: {
                cruzVerdes: [],
                acidentes: [],
                piramide: {},
                empilhadeiras: [],
                aguaEmpilhadeiras: {}
            }
        }
    ];
}

/**
 * SIMAS LOGÍSTICA LTDA - CONTROLE DE REVISÃƒO DE POPS
 * INTELIGÃŠNCIA JAVASCRIPT - VERSÃƒO ULTRA COMPATÍVEL E RESILIENTE
 */

// ==================== 0. WRAPPER DE STORAGE SEGURO (Previne crash no protocolo file:///) ====================
const SafeStorage = {
    _memoryStore: {},
    
    _getStorage() {
        try {
            return (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
        } catch (e) {
            return null;
        }
    },
    
    getItem(key) {
        try {
            const storage = this._getStorage();
            return storage ? storage.getItem(key) : (this._memoryStore[key] || null);
        } catch (e) {
            console.warn(`[SafeStorage] localStorage.getItem desativado ou bloqueado no navegador:`, e);
            return this._memoryStore[key] || null;
        }
    },
    
    setItem(key, value) {
        try {
            const storage = this._getStorage();
            if (storage) {
                storage.setItem(key, value);
            } else {
                this._memoryStore[key] = String(value);
            }
        } catch (e) {
            console.warn(`[SafeStorage] localStorage.setItem desativado ou bloqueado no navegador:`, e);
            this._memoryStore[key] = String(value);
        }
    },
    
    removeItem(key) {
        try {
            const storage = this._getStorage();
            if (storage) {
                storage.removeItem(key);
            } else {
                delete this._memoryStore[key];
            }
        } catch (e) {
            console.warn(`[SafeStorage] localStorage.removeItem desativado ou bloqueado no navegador:`, e);
            delete this._memoryStore[key];
        }
    }
};

// ==================== 1. CONFIGURAÃ‡ÃƒO DE USUÁRIOS E PERMISSÃ•ES (MOCK AD) ====================
const CORPORATE_USERS = {
    master: {
        name: "Iara Moreira",
        roleName: "Administrador Master",
        role: "master",
        isAdmin: true,
        avatar: "IM",
        email: "master@simaslogistica.com.br",
        permissions: { create: true, edit: true, delete: true, validate: true }
    },
    qualidade: {
        name: "Carla Souza",
        roleName: "Qualidade",
        role: "qualidade",
        isAdmin: true,
        avatar: "CS",
        email: "qualidade@simaslogistica.com.br",
        permissions: { create: true, edit: true, delete: true, validate: true }
    },
    operacao: {
        name: "Julio Cesar",
        roleName: "Operação",
        role: "operacao",
        avatar: "JC",
        email: "operacao@simaslogistica.com.br",
        permissions: { create: true, edit: true, delete: false, validate: false }
    },
    gestao: {
        name: "Dr. Marcos Pontes",
        roleName: "Gestão",
        role: "gestao",
        avatar: "MP",
        email: "gestao@simaslogistica.com.br",
        permissions: { create: false, edit: true, delete: false, validate: true }
    },
    visualizacao: {
        name: "Ana Silva",
        roleName: "Consulta",
        role: "visualizacao",
        avatar: "AS",
        email: "visualizacao@simaslogistica.com.br",
        permissions: { create: false, edit: false, delete: false, validate: false }
    }
};

let currentUser = CORPORATE_USERS.qualidade; // Usuário logado por padrão

// ==================== 2. MOCK DATA - DADOS INICIAIS DE POPS ====================
const INITIAL_POPS = [];

// ==================== 3. MOCK DATA - AUDIT LOGS INICIAIS ====================
const INITIAL_LOGS = [];
let auditLogs = INITIAL_LOGS;


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

// ==================== 4. LEITURA SEGURA DE DADOS (MOCK CP 2.1) ====================
// INÍCIO MOCK TEMPORÁRIO — ETAPA 2
let pops = [];
let filteredPops = [];
let currentPage = 1;
let itemsPerPage = 50;
let popsUnsubscribe = null;

async function loadSimasData() {
    try {
        const localPops = await DBStore.getItem('simas_pops');
        if (localPops && Array.isArray(localPops)) {
            pops = localPops;
            window.pops = pops;
            console.log(`[POPs] Cache local carregado: ${pops.length} registros`);
        }
    } catch (e) {
        console.error('Erro ao carregar POPs locais', e);
    }
    
    if (typeof applyFilters === 'function') applyFilters();
    if (typeof renderUrgentDashboardList === 'function') renderUrgentDashboardList();
    if (typeof initOrUpdateCharts === 'function') initOrUpdateCharts();

    if (typeof db !== 'undefined') {
        if (popsUnsubscribe) return;
        
        popsUnsubscribe = db.collection("simas_pops").onSnapshot(async (snapshot) => {
            try {
                console.log(`[POPs] Snapshot Cloud recebido: ${snapshot.size} documentos`);
                
                const cloudPops = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        ...data,
                        id: data.id || doc.id
                    };
                });
                
                pops = cloudPops;
                window.pops = pops;
                
                await DBStore.setItem("simas_pops", pops);
                console.log(`[POPs] Cache reconciliado com Cloud: ${pops.length} registros`);
                
                if (typeof applyFilters === 'function') applyFilters();
                if (typeof renderUrgentDashboardList === 'function') renderUrgentDashboardList();
                if (typeof initOrUpdateCharts === 'function') initOrUpdateCharts();
                
            } catch (e) {
                console.error("Erro no processamento em tempo real dos POPs:", e);
                console.warn("[POPs] Falha na reconciliação. Mantendo cache local atual.");
            }
        }, (error) => {
            console.error("Falha ao escutar POPs na nuvem:", error);
            console.warn("[POPs] Falha de conexão. Mantendo cache local atual.");
        });
    }
}
// FIM MOCK TEMPORÁRIO — ETAPA 2
// ==================== 5. INICIALIZAÃ‡ÃƒO DA APLICAÃ‡ÃƒO (DOMContentLoaded) ====================
let authenticatedAppInitialized = false;

async function initializeAuthenticatedApp() {
    if (authenticatedAppInitialized) return;
    try {
        console.log("[AUTH] Inicializando módulos corporativos...");
        
        // Sincronizar campo de perfil
        const headerSelect = document.getElementById("header-role-select");
        if (headerSelect) headerSelect.value = currentUser.role;

        // Atualizar UI com base no usuário ativo
        updateUserProfileUI();
        applyPermissions();

        // Inicializar os filtros anuais e renderizar
        if (typeof migrateTreinamentosLegados === 'function') await migrateTreinamentosLegados();
        if (typeof reloadTreinamentosRAM === 'function') await reloadTreinamentosRAM();
        if (typeof renderYearFilters === 'function') renderYearFilters();
        if (typeof renderMetricsGrid === 'function') renderMetricsGrid();

        // Exibir primeira view
        switchView('dashboard');

        // Carregar dados locais (POPs, etc)
        if (typeof loadSimasData === 'function') await loadSimasData();
        
        authenticatedAppInitialized = true;
        console.log("[AUTH] Aplicação autenticada inicializada.");
    } catch (e) {
        console.error("Erro na inicialização corporativa:", e);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Inicializar banco de dados local
        await SimasDB.getDB();

        // Preencher os credenciais padrão
        fillLoginFields('qualidade');
    } catch (e) {
        console.error("Erro na inicializacao do sistema:", e);
    }
});

// ==================== 8. GERENCIADOR DE VISUALIZAÃ‡Ã•ES (SPA ROUTING) ====================
function switchView(viewId) {
    try {
        activeView = viewId;
        
        // Atualiza menu lateral ativo
        const menuItems = document.querySelectorAll(".sidebar-item");
        menuItems.forEach(item => item.classList.remove("active"));
        
        const activeMenuItem = document.getElementById(`menu-${viewId}`);
        if (activeMenuItem) activeMenuItem.classList.add("active");
        
        // Atualiza aba de visualizao ativa
        const views = document.querySelectorAll(".spa-view");
        views.forEach(v => v.classList.remove("active"));
        
        const activeViewSection = document.getElementById(`view-${viewId}`);
        if (activeViewSection) activeViewSection.classList.add("active");
        
        // Atualiza títulos do header
        const title = document.getElementById("header-current-view-title");
        const desc = document.getElementById("header-current-view-desc");
        
        if (title) title.innerText = "Portal SGI";
        
        let descText = "Sistema Integrado de Gestão para operações logísticas, farmacêuticas e regulatórias.";
        if (viewId === "dashboard") {
            descText = "Visão consolidada dos indicadores e processos do sistema.";
        } else if (viewId === "one-page-report" || viewId === "opr") {
            descText = "Painel executivo de indicadores operacionais por filial.";
        } else if (viewId === "pops") {
            descText = "Gestão, revisão e acompanhamento de documentos e POPs.";
        } else if (viewId === "ncs") {
            descText = "Gestão de desvios, tratativas e ações corretivas.";
        } else if (viewId === "trainings") {
            descText = "Controle de capacitações, reciclagens e desenvolvimento das equipes.";
        } else if (viewId === "audit") {
            descText = "Rastreabilidade das ações e alterações realizadas no sistema.";
        } else if (viewId === "integrations") {
            descText = "Conexões e integrações com ferramentas Microsoft.";
        }
        if (desc) desc.innerText = descText;

        if (viewId === "dashboard") {
            setTimeout(() => {
                initOrUpdateCharts();
                renderUrgentDashboardList();
            }, 50);
        } else if (viewId === "one-page-report" || viewId === "opr") {
            if (typeof renderOprBranchSelector === 'function') renderOprBranchSelector();
        } else if (viewId === "pops") {
            applyFilters();
        } else if (viewId === "trainings") {
            startTrainingsListener();
            if (typeof applyTrainingFilters === 'function') applyTrainingFilters();
        } else if (viewId === "ncs") { startNcListener(); updateNcDashboard(); applyNcFilters(); } else if (viewId === "audit") {
            renderLogsTable();
        } else if (viewId === "integrations") {
            renderIntegrations();
        }
        
        // Fecha painel de notificações
        const panel = document.getElementById("notifications-panel");
        if (viewId !== "ncs") { stopNcListener(); }
        if (panel) panel.style.display = "none";
    } catch (e) {
        console.error("Erro na navegao de tela SPA:", e);
    }
}

// ==================== 11. SISTEMA DE FILTRO E BUSCA INTELIGENTE ====================
function applyFilters() {
    try {
        if (activeView !== 'pops') return;
        
        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
        
        const filialVal = getVal("filter-filial");
        const tipoVal = getVal("filter-tipo");
        const areaVal = getVal("filter-area");
        const statusVal = getVal("filter-status");
        const abrangenciaVal = getVal("filter-abrangencia");
        const responsavelVal = getVal("filter-responsavel").toLowerCase().trim();
        const anoRevVal = getVal("filter-ano-revisao");
        const anoProxVal = getVal("filter-ano-proxima");
        const searchVal = getVal("pop-search-input").toLowerCase().trim();
        
        filteredPops = pops.filter(pop => {
            const safeLower = (str) => String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            
            if (filialVal && !safeLower(pop.filial).includes(safeLower(filialVal))) return false;
            if (tipoVal && safeLower(pop.tipo || "POP") !== safeLower(tipoVal)) return false;
            if (areaVal && safeLower(pop.area) !== safeLower(areaVal)) return false;
            if (statusVal && safeLower(pop.status) !== safeLower(statusVal)) return false;
            if (abrangenciaVal && safeLower(pop.abrangencia || "Global") !== safeLower(abrangenciaVal)) return false;
            
            if (anoRevVal && pop.dataRevisao) {
                if (!String(pop.dataRevisao).startsWith(anoRevVal)) return false;
            }
            if (anoProxVal && pop.proximaRevisao) {
                if (!String(pop.proximaRevisao).startsWith(anoProxVal)) return false;
            }
            
            if (responsavelVal) {
                const resp = String(pop.responsavel || "");
                if (!resp.toLowerCase().includes(responsavelVal)) return false;
            }
            
            if (searchVal) {
                const codigo = String(pop.codigo || "");
                const titulo = String(pop.titulo || "");
                const tipo = String(pop.tipo || "");
                const responsavel = String(pop.responsavel || "");
                const area = String(pop.area || "");
                
                const matches = 
                    codigo.toLowerCase().includes(searchVal) ||
                    titulo.toLowerCase().includes(searchVal) ||
                    tipo.toLowerCase().includes(searchVal) ||
                    responsavel.toLowerCase().includes(searchVal) ||
                    area.toLowerCase().includes(searchVal);
                if (!matches) return false;
            }
            return true;
        });
        
        filteredPops.sort((a, b) => {
            const filialA = (a.filial || "").toUpperCase();
            const filialB = (b.filial || "").toUpperCase();
            if (filialA < filialB) return -1;
            if (filialA > filialB) return 1;
            
            const codigoA = (a.codigo || "").toUpperCase();
            const codigoB = (b.codigo || "").toUpperCase();
            return codigoA.localeCompare(codigoB, undefined, { numeric: true, sensitivity: 'base' });
        });
        
        currentPage = 1;
        renderPopsTable();
        if(typeof renderMetricsGrid === 'function') renderMetricsGrid();
    } catch (e) {
        console.error("Erro ao aplicar filtros:", e);
    }
}

function clearFilters(showToastMsg = true) {
    try {
        document.getElementById("filter-filial").value = "";
        document.getElementById("filter-tipo").value = "";
        document.getElementById("filter-area").value = "";
        document.getElementById("filter-status").value = "";
        document.getElementById("filter-responsavel").value = "";
        document.getElementById("pop-search-input").value = "";
        
        if (showToastMsg) {
            showToast("Filtros redefinidos com sucesso.", "info");
        }
        applyFilters();
    } catch (e) {
        console.error("Erro ao limpar filtros:", e);
    }
}


// INÍCIO MOCK TEMPORÁRIO — ETAPA 2 (Funções Vazias para Evitar Erros na Navegação)
function renderTable() {}
function updateDashboard() {}


function renderLogsTable() {}
function renderIntegrations() {}
// FIM MOCK TEMPORÁRIO — ETAPA 2


// Lógica da Cruz de Segurança
function inicializarCruz() {
    const anoSelect = document.getElementById('cruz-ano');
    const mesSelect = document.getElementById('cruz-mes');
    if (!anoSelect) return;
    
    // Popular anos
    const currentYear = new Date().getFullYear();
    anoSelect.innerHTML = '';
    for(let y = currentYear - 2; y <= currentYear + 1; y++) {
        anoSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }
    
    anoSelect.value = currentYear;
    mesSelect.value = new Date().getMonth();
    
    renderizarCruz();
    if (typeof markOprDirty === "function") markOprDirty();
}

function renderizarCruz() {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) return;
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;

    const ano = parseInt(document.getElementById('cruz-ano').value);
    const mes = parseInt(document.getElementById('cruz-mes').value);
    const grid = document.getElementById('cruz-grid');
    if (!grid) return;
    
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    grid.innerHTML = '';
    
    const cruzMap = [
        [1,3], [1,4], [1,5],
        [2,3], [2,4], [2,5],
        [3,1], [3,2], [3,3], [3,4], [3,5], [3,6], [3,7],
        [4,1], [4,2], [4,3], [4,4], [4,5], [4,6], [4,7],
        [5,1], [5,2], [5,3], [5,4], [5,5], [5,6], [5,7],
        [6,3], [6,4], [6,5],
        [7,4]
    ];
    
    // Obter todos os relatórios da mesma filial para cruzar dados
    const branchReports = oprHistoryDB.filter(r => r.branch === record.branch);
    let acidentesDates = [];
    let verdesDates = [];
    
    branchReports.forEach(rep => {
        if (rep.data && rep.data.acidentes) {
            rep.data.acidentes.forEach(ac => {
                if (ac.data) acidentesDates.push(ac.data);
            });
        }
        if (rep.data && rep.data.cruzVerdes) {
            rep.data.cruzVerdes.forEach(d => verdesDates.push(d));
        }
    });

    for(let d = 1; d <= 31; d++) {
        if (d > diasNoMes) break;
        
        const pos = cruzMap[d-1];
        const dateStr = `${ano}-${String(mes+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        let bgColor = '#f8fafc';
        let borderColor = '#cbd5e1';
        let color = '#64748b';
        let status = 'vazio';
        
        if (acidentesDates.includes(dateStr)) {
            bgColor = '#A30D00';
            borderColor = '#A30D00';
            color = '#ffffff';
            status = 'acidente';
        } else if (verdesDates.includes(dateStr)) {
            bgColor = '#10b981';
            borderColor = '#10b981';
            color = '#ffffff';
            status = 'verde';
        }
        
        const cell = document.createElement('div');
        cell.style.gridRow = pos[0];
        cell.style.gridColumn = pos[1];
        cell.style.background = bgColor;
        cell.style.border = `1px solid ${borderColor}`;
        cell.style.borderRadius = '4px';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.fontSize = '12px';
        cell.style.fontWeight = '700';
        cell.style.color = color;
        cell.style.cursor = 'pointer';
        cell.style.transition = '0.2s';
        cell.textContent = d;
        
        // Adiciona hover
        cell.onmouseover = () => cell.style.transform = 'scale(1.1)';
        cell.onmouseout = () => cell.style.transform = 'scale(1)';
        
        cell.onclick = () => alternarEstadoCruz(dateStr, status);
        
        grid.appendChild(cell);
    }
}

function alternarEstadoCruz(dateStr, currentStatus) {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) return;
    const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
    if (idx === -1) return;
    
    if (!oprHistoryDB[idx].data.cruzVerdes) oprHistoryDB[idx].data.cruzVerdes = [];
    if (!oprHistoryDB[idx].data.acidentes) oprHistoryDB[idx].data.acidentes = [];

    if (currentStatus === 'vazio') {
        // Vira Verde
        if (!oprHistoryDB[idx].data.cruzVerdes.includes(dateStr)) {
            oprHistoryDB[idx].data.cruzVerdes.push(dateStr);
        }
    } else if (currentStatus === 'verde') {
        // Remove do verde e abre modal para virar Vermelho
        oprHistoryDB[idx].data.cruzVerdes = oprHistoryDB[idx].data.cruzVerdes.filter(d => d !== dateStr);
        abrirModalAcidenteData(dateStr);
    } else if (currentStatus === 'acidente') {
        // Remove acidente (apenas se foi criado neste relatório para manter histórico isolado)
        if (confirm('Deseja remover o acidente registrado neste dia?')) {
            const initialLen = oprHistoryDB[idx].data.acidentes.length;
            oprHistoryDB[idx].data.acidentes = oprHistoryDB[idx].data.acidentes.filter(ac => ac.data !== dateStr);
            if (oprHistoryDB[idx].data.acidentes.length === initialLen) {
                alert('Este acidente foi registrado em um relatório anterior e não pode ser removido daqui. Exclua no relatório original.');
                return; // não salvou
            }
        } else {
            return;
        }
    }

    // localStorage.setItem('simas_opr_history', JSON.stringify(oprHistoryDB)); // Migrado para persistCurrentOpr()
    renderizarCruz();
    if (typeof markOprDirty === "function") markOprDirty();
    calcularDiasSemAcidente();
}

function abrirModalAcidenteData(dateStr) {
    abrirModalAcidente();
    document.getElementById('acidente-data').value = dateStr;
}

// Chamar inicializarCruz() no openOprForm


// Lógica da Pirâmide de Bird
function inicializarPiramide() {
    const anoSelect = document.getElementById('bird-ano');
    if (!anoSelect) return;
    
    const currentYear = new Date().getFullYear();
    anoSelect.innerHTML = '';
    for(let y = currentYear - 2; y <= currentYear + 1; y++) {
        anoSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }
    
    anoSelect.value = currentYear;
    renderizarPiramide();
    if (typeof markOprDirty === "function") markOprDirty();
}

function renderizarPiramide() {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) return;
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;

    const ano = document.getElementById('bird-ano').value;
    
    // Buscar se há dados salvos para este ano nesta filial
    let piramideData = { fatais: 0, afastamento: 0, leve: 0, incidentes: 0, desvios: 0, inseguras: 0 };
    
    if (record.data.piramide && record.data.piramide[ano]) {
        piramideData = record.data.piramide[ano];
    } else {
        // Tenta achar em outro relatório da mesma filial para puxar o histórico (fallback)
        const branchReports = oprHistoryDB.filter(r => r.branch === record.branch);
        for(let rep of branchReports) {
            if (rep.data.piramide && rep.data.piramide[ano]) {
                piramideData = rep.data.piramide[ano];
                break;
            }
        }
    }

    document.getElementById('bird-fatais').value = piramideData.fatais || 0;
    document.getElementById('bird-afastamento').value = piramideData.afastamento || 0;
    document.getElementById('bird-leve').value = piramideData.leve || 0;
    document.getElementById('bird-incidentes').value = piramideData.incidentes || 0;
    document.getElementById('bird-desvios').value = piramideData.desvios || 0;
    document.getElementById('bird-inseguras').value = piramideData.inseguras || 0;
}

function salvarPiramide() {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) return;
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;

    const ano = document.getElementById('bird-ano').value;
    
    const newData = {
        fatais: parseInt(document.getElementById('bird-fatais').value) || 0,
        afastamento: parseInt(document.getElementById('bird-afastamento').value) || 0,
        leve: parseInt(document.getElementById('bird-leve').value) || 0,
        incidentes: parseInt(document.getElementById('bird-incidentes').value) || 0,
        desvios: parseInt(document.getElementById('bird-desvios').value) || 0,
        inseguras: parseInt(document.getElementById('bird-inseguras').value) || 0
    };

    // Salvar em TODOS os relatórios dessa filial para manter consistência anual global
    oprHistoryDB.forEach(rep => {
        if (rep.branch === record.branch) {
            if (!rep.data.piramide) rep.data.piramide = {};
            rep.data.piramide[ano] = newData;
        }
    });

    // localStorage.setItem('simas_opr_history', JSON.stringify(oprHistoryDB)); // Migrado para persistCurrentOpr()
    if(typeof showToast === 'function') showToast('Pirâmide salva!', 'success');
}

// Chamar inicializarPiramide no openOprForm

const SAFETY_COUNT_START_DATE = new Date(2026, 0, 1);

async function calcularDiasSemAcidente() {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) return;
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;

    window.safetyCalculationSequence = (window.safetyCalculationSequence || 0) + 1;
    const currentSeq = window.safetyCalculationSequence;

    try {
        const history = await OprHistoryRepository.list();
        const branchMeta = history.filter(r => r.branch === record.branch);
        
        const snapshotsPromises = branchMeta.map(m => {
            if (!m.snapshotId) return Promise.resolve(null);
            return SnapshotRepository.getById(m.snapshotId).catch(e => {
                console.error(`Falha ao ler snapshot ${m.snapshotId} do OPR ${m.id}`, e);
                return null;
            });
        });
        
        const snapshots = await Promise.all(snapshotsPromises);
        
        if (window.safetyCalculationSequence !== currentSeq) return;

        if (snapshots.some(s => s === null)) {
            const indRecorde = document.getElementById('ind-seg-recorde');
            const indAtual = document.getElementById('ind-seg-atual');
            if (indRecorde) indRecorde.textContent = '-';
            if (indAtual) indAtual.textContent = 'Indisponível';
            return;
        }

        let referenceDate = new Date();
        if (record.status === 'Concluído' || record.status === 'Finalizado') {
            referenceDate = new Date(record.updatedAt);
        }
        referenceDate.setHours(0,0,0,0);

        let acidentesDatesSet = new Set();
        let qtdCptPeriodo = 0;
        let qtdSptPeriodo = 0;

        for (let i = 0; i < branchMeta.length; i++) {
            const meta = branchMeta[i];
            const snap = snapshots[i];
            
            if (snap && snap.data && Array.isArray(snap.data.acidentes)) {
                snap.data.acidentes.forEach(ac => {
                    if (ac.data) {
                        const [y, m, d] = ac.data.split('-').map(Number);
                        const acDate = new Date(y, m - 1, d);
                        
                        if (acDate >= SAFETY_COUNT_START_DATE && acDate <= referenceDate) {
                            acidentesDatesSet.add(ac.data);
                        }
                        
                        if (meta.id === currentOprRecordId) {
                            if (ac.tipo === 'CPT') qtdCptPeriodo += parseInt(ac.qtd) || 0;
                            if (ac.tipo === 'SPT') qtdSptPeriodo += parseInt(ac.qtd) || 0;
                        }
                    }
                });
            }
        }

        const allAccidentDates = Array.from(acidentesDatesSet).map(dStr => {
            const [y, m, d] = dStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        }).sort((a, b) => a - b);

        let maxRecorde = 0;
        let diasAtuais = 0;

        if (allAccidentDates.length === 0) {
            const diffZero = Math.round((referenceDate - SAFETY_COUNT_START_DATE) / (1000 * 60 * 60 * 24));
            maxRecorde = diffZero >= 0 ? diffZero : 0;
            diasAtuais = diffZero >= 0 ? diffZero : 0;
        } else {
            maxRecorde = Math.round((allAccidentDates[0] - SAFETY_COUNT_START_DATE) / (1000 * 60 * 60 * 24));
            if (maxRecorde < 0) maxRecorde = 0;
            
            for (let i = 1; i < allAccidentDates.length; i++) {
                const diff = Math.round((allAccidentDates[i] - allAccidentDates[i-1]) / (1000 * 60 * 60 * 24));
                if (diff > maxRecorde) maxRecorde = diff;
            }

            const lastDate = allAccidentDates[allAccidentDates.length - 1];
            diasAtuais = Math.round((referenceDate - lastDate) / (1000 * 60 * 60 * 24));
            if (diasAtuais < 0) diasAtuais = 0;
            
            if (diasAtuais > maxRecorde) maxRecorde = diasAtuais;
        }

        const indRecorde = document.getElementById('ind-seg-recorde');
        const indAtual = document.getElementById('ind-seg-atual');
        const indCpt = document.getElementById('ind-seg-cpt');
        const indSpt = document.getElementById('ind-seg-spt');

        if (indRecorde) indRecorde.textContent = maxRecorde;
        if (indAtual) indAtual.textContent = diasAtuais;
        if (indCpt) indCpt.textContent = qtdCptPeriodo;
        if (indSpt) indSpt.textContent = qtdSptPeriodo;

    } catch (e) {
        console.error("Falha ao calcular segurança:", e);
        const indAtual = document.getElementById('ind-seg-atual');
        if (indAtual) indAtual.textContent = 'Erro';
    }
}

// ==================== LÓGICA DE EMPILHADEIRAS ====================
window.empCharts = [];

function switchEmpTab(tab) {
    document.getElementById('aba-emp-dados').style.display = tab === 'dados' ? 'grid' : 'none';
    document.getElementById('aba-emp-desempenho').style.display = tab === 'desempenho' ? 'block' : 'none';
    
    document.getElementById('tab-emp-dados').style.color = tab === 'dados' ? '#0B1D32' : '#64748b';
    document.getElementById('tab-emp-dados').style.borderBottomColor = tab === 'dados' ? '#0B1D32' : 'transparent';
    
    document.getElementById('tab-emp-desempenho').style.color = tab === 'desempenho' ? '#0B1D32' : '#64748b';
    document.getElementById('tab-emp-desempenho').style.borderBottomColor = tab === 'desempenho' ? '#0B1D32' : 'transparent';
}

function popularAnoSeletorEmp() {
    const selector = document.getElementById('emp-ano');
    if (!selector) return;
    selector.innerHTML = '';
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        if (i === currentYear) opt.selected = true;
        selector.appendChild(opt);
    }
}

function renderizarEmpilhadeiras() {
    const grid = document.getElementById('empilhadeiras-grid');
    if (!grid) return;
    
    // Limpar charts antigos
    window.empCharts.forEach(c => c.destroy());
    window.empCharts = [];
    if (window.aguaChartsCard) {
        Object.values(window.aguaChartsCard).forEach(c => c.destroy());
        window.aguaChartsCard = {};
    }
    

    
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; font-size: 13px; padding: 20px; font-style: italic;">Crie ou abra um relatório para visualizar as empilhadeiras.</div>';
        return;
    }
    
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record || !record.data || !record.data.empilhadeiras || record.data.empilhadeiras.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; font-size: 13px; padding: 20px; font-style: italic;">Nenhuma empilhadeira cadastrada neste relatório.</div>';
        return;
    }

    grid.innerHTML = '';
    
    let selectedYear = document.getElementById('emp-ano') ? document.getElementById('emp-ano').value : new Date().getFullYear().toString();
    
    record.data.empilhadeiras.forEach((emp, index) => {
        let pct = 0;
        const u = parseFloat(emp.ultima) || 0;
        const a = parseFloat(emp.atual) || 0;
        const p = parseFloat(emp.proxima) || 0;
        const range = p - u;
        const progress = a - u;

        if (range <= 0) {
            pct = 100;
        } else {
            pct = (progress / range) * 100;
        }
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;

        let color = '#10b981';
        if (pct >= 70) color = '#ffab00';
        if (pct >= 90) color = '#A30D00';
        const rot = (pct * 1.8) - 135;

        const card = document.createElement('div');
        card.style.background = '#fff';
        card.style.border = '1px solid #cbd5e1';
        card.style.borderRadius = '8px';
        card.style.padding = '15px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
        card.style.position = 'relative';
        
        const canvasId = 'emp-chart-' + index + '-' + Date.now();
        const canvasAguaId = 'emp-agua-chart-' + index + '-' + Date.now();
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                <div>
                    <h5 style="margin: 0; color: #0B1D32; font-size: 14px; font-weight: 800;">${emp.frota}</h5>
                    <span style="font-size: 11px; color: #64748b; font-weight: 600;">${emp.modelo} | ${emp.codigo}</span>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="abrirModalEmpilhadeira(${index})" style="background: rgba(11,29,50,0.05); border: none; color: #0B1D32; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; transition: 0.2s;"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="excluirEmpilhadeira(${index})" style="background: rgba(163,13,0,0.05); border: none; color: #A30D00; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; transition: 0.2s;"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            
            <!-- Grafico Anual -->
            <div style="height: 160px; width: 100%; margin-bottom: 20px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 15px;">
                <canvas id="${canvasId}"></canvas>
            </div>
            
            <!-- Velocimetro -->
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; margin-bottom: 5px;">Manutencao Preventiva</span>
                <div style="width: 140px; height: 70px; position: relative; overflow: hidden; margin: 0 auto;">
                    <div style="width: 140px; height: 140px; border-radius: 50%; border: 16px solid #e2e8f0; position: absolute; top: 0; left: 0; box-sizing: border-box;"></div>
                    <div style="width: 140px; height: 140px; border-radius: 50%; border: 16px solid ${color}; position: absolute; top: 0; left: 0; box-sizing: border-box; border-bottom-color: transparent; border-right-color: transparent; transform: rotate(${rot}deg); transition: transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
                </div>
                <div style="text-align: center; margin-top: -15px; z-index: 10; background: #fff; padding: 0 10px; border-radius: 10px;">
                    <span style="font-weight: 800; color: ${color}; font-size: 22px; line-height: 1;">${Math.round(pct)}%</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; text-align: center; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #edf2f7; margin-bottom: 15px;">
                <div>
                    <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Ultima</div>
                    <div style="font-size: 12px; color: #020122; font-weight: 700;">${emp.ultima}h</div>
                </div>
                <div style="border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Atual</div>
                    <div style="font-size: 12px; color: #020122; font-weight: 800;">${emp.atual}h</div>
                </div>
                <div>
                    <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Proxima</div>
                    <div style="font-size: 12px; color: #020122; font-weight: 700;">${emp.proxima}h</div>
                </div>
            </div>
            ${emp.obs ? `<div style="margin-bottom: 15px; font-size: 11px; color: #64748b; font-style: italic; background: #fffbeb; border-left: 3px solid #f59e0b; padding: 5px 8px;">"${emp.obs}"</div>` : ''}

            
        `;
        grid.appendChild(card);
        
        // Init Chart.js
        setTimeout(() => {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;
            
            let horasData = [0,0,0,0,0,0,0,0,0,0,0,0];
            let checkData = [0,0,0,0,0,0,0,0,0,0,0,0];
            
            if (emp.desempenho && emp.desempenho[selectedYear]) {
                horasData = emp.desempenho[selectedYear].horas;
                checkData = emp.desempenho[selectedYear].checklist;
            }
            
            const chartConfig = {
                type: 'bar',
                data: {
                    labels: ['J','F','M','A','M','J','J','A','S','O','N','D'],
                    datasets: [
                        {
                            type: 'line',
                            label: '% Check',
                            data: checkData,
                            borderColor: '#ffab00',
                            backgroundColor: '#ffab00',
                            borderWidth: 2,
                            yAxisID: 'y1',
                            tension: 0.3,
                            datalabels: {
                                align: 'top',
                                anchor: 'end',
                                formatter: function(value) { return value > 0 ? value + '%' : ''; },
                                color: '#ffab00',
                                font: { weight: '800', size: 9 }
                            }
                        },
                        {
                            type: 'bar',
                            label: 'Horas',
                            data: horasData,
                            backgroundColor: '#0B1D32',
                            yAxisID: 'y',
                            borderRadius: 4,
                            datalabels: {
                                align: 'center',
                                anchor: 'center',
                                color: '#fff',
                                formatter: function(value) { return value > 0 ? value : ''; },
                                font: { weight: '800', size: 9 }
                            }
                        }
                    ]
                },
                plugins: [window.ChartDataLabels],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { top: 15 } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                        y: {
                            type: 'linear',
                            display: false,
                            position: 'left',
                            suggestedMax: Math.max(...horasData) * 1.2,
                            ticks: { font: { size: 9 } },
                            grid: { display: false },
                            border: { display: false }
                        },
                        y1: {
                            type: 'linear',
                            display: false, // hide secondary axis line to keep it clean
                            position: 'right',
                            min: 0,
                            max: 110,
                            grid: { drawOnChartArea: false }
                        }
                    },
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 8, font: {size: 9} } },
                        tooltip: { enabled: false }
                    }
                }
            };
            const c = new Chart(ctx, chartConfig);
            window.empCharts.push(c);
            
            
        }, 50);
    });
}

function abrirModalEmpilhadeira(index = -1) {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) {
        alert('Crie ou abra um relatório antes de adicionar empilhadeiras.');
        return;
    }
    
    // Check if select year exists
    let selectedYear = document.getElementById('emp-ano') ? document.getElementById('emp-ano').value : new Date().getFullYear().toString();
    
    // Seletor não renderizado ainda
    if (!document.getElementById('emp-ano') || document.getElementById('emp-ano').options.length === 0) {
        popularAnoSeletorEmp();
        selectedYear = new Date().getFullYear().toString();
    }
    
    if (document.getElementById('emp-modal-ano-label')) {
        document.getElementById('emp-modal-ano-label').textContent = selectedYear;
    }

    document.getElementById('emp-index').value = index;
    switchEmpTab('dados');
    
    let emp = null;
    if (index !== -1) {
        const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
        emp = record.data.empilhadeiras[index];
    }
    
    // Populate Tab 1
    if (index === -1) {
        document.getElementById('modal-emp-title').textContent = 'Nova Empilhadeira';
        document.getElementById('emp-frota').value = '';
        document.getElementById('emp-codigo').value = '';
        document.getElementById('emp-modelo').value = '';
        document.getElementById('emp-ultima').value = '';
        document.getElementById('emp-atual').value = '';
        document.getElementById('emp-proxima').value = '';
        document.getElementById('emp-obs').value = '';
    } else {
        document.getElementById('modal-emp-title').textContent = 'Editar Empilhadeira';
        document.getElementById('emp-frota').value = emp.frota;
        document.getElementById('emp-codigo').value = emp.codigo;
        document.getElementById('emp-modelo').value = emp.modelo;
        document.getElementById('emp-ultima').value = emp.ultima;
        document.getElementById('emp-atual').value = emp.atual;
        document.getElementById('emp-proxima').value = emp.proxima;
        document.getElementById('emp-obs').value = emp.obs;
    }
    
    // Populate Tab 2
    const inputsContainer = document.getElementById('emp-desempenho-inputs');
    inputsContainer.innerHTML = '';
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    let horasData = [0,0,0,0,0,0,0,0,0,0,0,0];
    let checkData = [0,0,0,0,0,0,0,0,0,0,0,0];
    
    if (emp && emp.desempenho && emp.desempenho[selectedYear]) {
        horasData = emp.desempenho[selectedYear].horas || horasData;
        checkData = emp.desempenho[selectedYear].checklist || checkData;
    }
    
    meses.forEach((mes, i) => {
        const row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '1fr 1fr 1fr';
        row.style.gap = '10px';
        row.style.alignItems = 'center';
        row.style.background = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        row.style.padding = '5px';
        row.style.borderRadius = '4px';
        
        row.innerHTML = `
            <div style="font-size: 12px; font-weight: 700; color: #0B1D32; padding-left: 5px;">${mes}</div>
            <input type="number" id="emp-horas-${i}" value="${horasData[i]}" placeholder="Horas" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;">
            <div style="position: relative;">
                <input type="number" id="emp-check-${i}" value="${checkData[i]}" placeholder="%" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; padding-right: 20px;">
                <span style="position: absolute; right: 8px; top: 8px; font-size: 10px; color: #94a3b8; font-weight: 800;">%</span>
            </div>
        `;
        inputsContainer.appendChild(row);
    });
    
    document.getElementById('modal-emp').style.display = 'flex';
}

function fecharModalEmpilhadeira() {
    document.getElementById('modal-emp').style.display = 'none';
}

function salvarEmpilhadeira() {
    const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
    if (idx === -1) return;
    
    if (!oprHistoryDB[idx].data.empilhadeiras) {
        oprHistoryDB[idx].data.empilhadeiras = [];
    }

    const frota = document.getElementById('emp-frota').value.trim();
    if (!frota) {
        alert('A Identificação da Frota é obrigatória.');
        return;
    }
    
    const ultima = parseFloat(document.getElementById('emp-ultima').value) || 0;
    const atual = parseFloat(document.getElementById('emp-atual').value) || 0;
    const proxima = parseFloat(document.getElementById('emp-proxima').value) || 0;
    
    if (atual < ultima) {
        alert('O horímetro atual não pode ser menor que o da última manutenção!');
        return;
    }
    
    // Validar % Checklist (0 a 100)
    let hasChecklistError = false;
    for (let i = 0; i < 12; i++) {
        const cVal = parseFloat(document.getElementById(`emp-check-${i}`).value) || 0;
        if (cVal < 0 || cVal > 100) {
            hasChecklistError = true;
            break;
        }
    }
    if (hasChecklistError) {
        alert('O Percentual de Checklist deve ser um valor entre 0 e 100 para todos os meses.');
        switchEmpTab('desempenho');
        return;
    }

    const empIndex = parseInt(document.getElementById('emp-index').value);
    
    // Recuperar objeto existente para não perder o desempenho de outros anos se houver
    let currentDesempenho = {};
    if (empIndex !== -1 && oprHistoryDB[idx].data.empilhadeiras[empIndex].desempenho) {
        // Deep copy existing history
        currentDesempenho = JSON.parse(JSON.stringify(oprHistoryDB[idx].data.empilhadeiras[empIndex].desempenho));
    }
    
    // Salvar o ano atual
    let selectedYear = document.getElementById('emp-ano') ? document.getElementById('emp-ano').value : new Date().getFullYear().toString();
    
    const hData = [];
    const cData = [];
    for (let i = 0; i < 12; i++) {
        hData.push(parseFloat(document.getElementById(`emp-horas-${i}`).value) || 0);
        cData.push(parseFloat(document.getElementById(`emp-check-${i}`).value) || 0);
    }
    
    currentDesempenho[selectedYear] = {
        horas: hData,
        checklist: cData
    };

    const newEmp = {
        frota: frota,
        codigo: document.getElementById('emp-codigo').value.trim(),
        modelo: document.getElementById('emp-modelo').value.trim(),
        ultima: ultima,
        atual: atual,
        proxima: proxima,
        obs: document.getElementById('emp-obs').value.trim(),
        desempenho: currentDesempenho
    };
    
    if (empIndex !== -1 && oprHistoryDB[idx].data.empilhadeiras[empIndex].agua) {
        newEmp.agua = JSON.parse(JSON.stringify(oprHistoryDB[idx].data.empilhadeiras[empIndex].agua));
    }
    
    if (empIndex === -1) {
        oprHistoryDB[idx].data.empilhadeiras.push(newEmp);
    } else {
        oprHistoryDB[idx].data.empilhadeiras[empIndex] = newEmp;
    }
    
    // localStorage.setItem('simas_opr_history', JSON.stringify(oprHistoryDB)); // Migrado para persistCurrentOpr()
    renderizarEmpilhadeiras();
    if (typeof markOprDirty === "function") markOprDirty();
fecharModalEmpilhadeira();
    if (typeof showToast === 'function') showToast('Empilhadeira salva com sucesso!', 'success');
}

function excluirEmpilhadeira(index) {
    if (confirm('Tem certeza que deseja remover esta empilhadeira deste relatório?')) {
        const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
        if (idx !== -1) {
            oprHistoryDB[idx].data.empilhadeiras.splice(index, 1);
            // localStorage.setItem('simas_opr_history', JSON.stringify(oprHistoryDB)); // Migrado para persistCurrentOpr()
            renderizarEmpilhadeiras();
    if (typeof markOprDirty === "function") markOprDirty();
if (typeof showToast === 'function') showToast('Removida com sucesso!', 'success');
        }
    }
}


// ==================== LÓGICA ÁGUA EMPILHADEIRAS ====================
window.aguaChart = null;

function popularFiltrosAgua() {
    const sMes = document.getElementById('agua-mes');
    const sAno = document.getElementById('agua-ano');
    if (!sMes || !sAno) return;
    
    sMes.innerHTML = '';
    sAno.innerHTML = '';
    
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const currentMonth = new Date().getMonth();
    
    meses.forEach((m, idx) => {
        const opt = document.createElement('option');
        opt.value = idx.toString();
        opt.textContent = m;
        if (idx === currentMonth) opt.selected = true;
        sMes.appendChild(opt);
    });
    
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        const opt = document.createElement('option');
        opt.value = i.toString();
        opt.textContent = i;
        if (i === currentYear) opt.selected = true;
        sAno.appendChild(opt);
    }
}

function renderizarGraficoAgua(empIndex = -1) {
    if (window.aguaChart) {
        window.aguaChart.destroy();
        window.aguaChart = null;
    }

    const sMes = document.getElementById('agua-mes');
    const sAno = document.getElementById('agua-ano');
    if (!sMes || !sAno) return;

    const mes = sMes.value;
    const ano = sAno.value;

    const record = typeof currentOprRecordId !== 'undefined' && currentOprRecordId
        ? oprHistoryDB.find(r => r.id === currentOprRecordId)
        : null;

    let wData = [0, 0, 0, 0, 0];
    if (record && record.data && record.data.aguaEmpilhadeiras && record.data.aguaEmpilhadeiras[ano] && record.data.aguaEmpilhadeiras[ano][mes]) {
        wData = record.data.aguaEmpilhadeiras[ano][mes]; 
    }

    const ctx = document.getElementById('chart-agua');
    if (!ctx) return;

    const config = {
        type: 'bar',
        data: {
            labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'],
            datasets: [{
                label: 'Litros',
                data: wData,
                backgroundColor: '#3b82f6',
                borderRadius: 6,
                barPercentage: 0.7,
                datalabels: {
                    align: 'center',
                    anchor: 'center',
                    color: '#fff',
                    formatter: function(val) { return val > 0 ? val + ' L' : ''; },
                    font: { weight: '800', size: 14 }
                }
            }]
        },
        plugins: [window.ChartDataLabels],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    display: false,
                    suggestedMax: Math.max(...wData) * 1.2
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 12, weight: '700' }, color: '#334155' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) { return ctx.raw + ' Litros'; }
                    }
                }
            }
        }
    };

    window.aguaChart = new Chart(ctx, config);
}

function abrirModalAgua(empIndex = -1) {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) {
        alert('Crie ou abra um relatorio primeiro.');
        return;
    }
    
    let hiddenEmpIdx = document.getElementById('agua-emp-index');
    if (!hiddenEmpIdx) {
        hiddenEmpIdx = document.createElement('input');
        hiddenEmpIdx.type = 'hidden';
        hiddenEmpIdx.id = 'agua-emp-index';
        document.getElementById('modal-agua').appendChild(hiddenEmpIdx);
    }
    hiddenEmpIdx.value = "-1"; // Forca legado global

    const sMes = document.getElementById('agua-mes');
    const sAno = document.getElementById('agua-ano');
    const mesIdx = parseInt(sMes.value);
    const ano = sAno.value;

    const meses = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('lbl-agua-mes').textContent = meses[mesIdx] + ' de ' + ano;

    let lblMaquina = document.getElementById('lbl-agua-maquina');
    if (!lblMaquina) {
        lblMaquina = document.createElement('div');
        lblMaquina.id = 'lbl-agua-maquina';
        lblMaquina.style.cssText = 'font-size: 18px; color: #020122; font-weight: 900; margin-bottom: 2px;';
        const lblMes = document.getElementById('lbl-agua-mes');
        lblMes.parentNode.insertBefore(lblMaquina, lblMes);
    }
    
    lblMaquina.textContent = 'Controle de Agua das Empilhadeiras';
    lblMaquina.style.display = 'block';

    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);

    let wData = [0, 0, 0, 0, 0];

    if (record && record.data && record.data.aguaEmpilhadeiras && record.data.aguaEmpilhadeiras[ano] && record.data.aguaEmpilhadeiras[ano][mesIdx]) {
        wData = record.data.aguaEmpilhadeiras[ano][mesIdx];
    }

    document.getElementById('agua-w1').value = wData[0];
    document.getElementById('agua-w2').value = wData[1];
    document.getElementById('agua-w3').value = wData[2];
    document.getElementById('agua-w4').value = wData[3];
    document.getElementById('agua-w5').value = wData[4];

    document.getElementById('modal-agua').style.display = 'flex';
}

function fecharModalAgua() {
    document.getElementById('modal-agua').style.display = 'none';
}

function salvarAgua() {
    const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
    if (idx === -1) return;

    const getVal = (id) => {
        const val = document.getElementById(id).value.trim();
        return val === '' ? 0 : (parseFloat(val) ?? 0);
    };

    const w1 = getVal('agua-w1');
    const w2 = getVal('agua-w2');
    const w3 = getVal('agua-w3');
    const w4 = getVal('agua-w4');
    const w5 = getVal('agua-w5');

    if (w1 < 0 || w2 < 0 || w3 < 0 || w4 < 0 || w5 < 0) {
        alert('Os valores de consumo de agua no podem ser negativos.');
        return;
    }

    const sMes = document.getElementById('agua-mes').value;
    const sAno = document.getElementById('agua-ano').value;
    
    // Estrutura Legada
    if (!oprHistoryDB[idx].data.aguaEmpilhadeiras) {
        oprHistoryDB[idx].data.aguaEmpilhadeiras = {};
    }
    if (!oprHistoryDB[idx].data.aguaEmpilhadeiras[sAno]) {
        oprHistoryDB[idx].data.aguaEmpilhadeiras[sAno] = {};
    }
    oprHistoryDB[idx].data.aguaEmpilhadeiras[sAno][sMes] = [w1, w2, w3, w4, w5];

    // NAO CHAMAR persistCurrentOpr() AQUI, mantendo a atomicidade!
    renderizarGraficoAgua(); 
    fecharModalAgua();
    if (typeof showToast === 'function') showToast('Consumo de agua salvo!', 'success');
}

// ==================== INITIALIZATION HOOKS ====================
// Substituindo ou estendendo switchView para iniciar graficos se nao houver um openOprForm
const oldSwitchView = switchView;
switchView = function(viewId) {
    oldSwitchView(viewId);
    if (viewId === 'opr' || viewId === 'one-page-report') {
        setTimeout(() => {
            if (typeof inicializarCruz === 'function') inicializarCruz();
            if (typeof inicializarPiramide === 'function') inicializarPiramide();
            if (typeof calcularDiasSemAcidente === 'function') calcularDiasSemAcidente();
            
            // Empilhadeiras e Agua
            if (typeof popularAnoSeletorEmp === 'function') popularAnoSeletorEmp();
            if (typeof renderizarEmpilhadeiras === 'function') renderizarEmpilhadeiras();
    // [CORRECAO AUTOSAVE FALSO] if (typeof markOprDirty === "function") markOprDirty();
if (typeof popularFiltrosAgua === 'function') popularFiltrosAgua();
            if (typeof renderizarGraficoAgua === 'function') renderizarGraficoAgua();
        }, 100);
    }
};


// --- LOGICA DE ACIDENTES (SEGURANCA) RESTAURADA ---
function abrirModalAcidente() {
    document.getElementById('modal-acidente').style.display = 'flex';
    document.getElementById('acidente-data').value = '';
    document.getElementById('acidente-tipo').value = 'CPT';
    document.getElementById('acidente-qtd').value = '1';
    document.getElementById('acidente-obs').value = '';
}

function fecharModalAcidente() {
    document.getElementById('modal-acidente').style.display = 'none';
}

function salvarAcidente() {
    const dataVal = document.getElementById('acidente-data').value;
    const tipoVal = document.getElementById('acidente-tipo').value;
    const qtdVal = document.getElementById('acidente-qtd').value;
    const obsVal = document.getElementById('acidente-obs').value;

    if (!dataVal || !qtdVal) {
        alert('Por favor, preencha a data e a quantidade.');
        return;
    }

    const [y, m, d] = dataVal.split('-').map(Number);
    const acDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (acDate > today) {
        alert('A data do acidente não pode ser futura.');
        return;
    }

    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) {
        alert('Nenhum relatorio aberto.');
        return;
    }

    const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
    if (idx !== -1) {
        if (!oprHistoryDB[idx].data.acidentes) {
            oprHistoryDB[idx].data.acidentes = [];
        }
        
        oprHistoryDB[idx].data.acidentes.push({
            data: dataVal,
            tipo: tipoVal,
            qtd: parseInt(qtdVal),
            obs: obsVal
        });

        // localStorage.setItem('simas_opr_history', JSON.stringify(oprHistoryDB)); // Migrado para persistCurrentOpr()
        if (typeof calcularDiasSemAcidente === 'function') calcularDiasSemAcidente();
        if (typeof renderizarCruz === 'function') renderizarCruz();
    if (typeof markOprDirty === "function") markOprDirty(); // Force update of the grid visually (safe extension to ensure visual feedback as requested by testing constraints)
        fecharModalAcidente();
        if(typeof showToast === 'function') showToast('Acidente registrado com sucesso!', 'success');
    }
}

// ==================== LÓGICA Q&M (RECLAMAÇÕES) ====================

function popularFiltrosQm() {
    const sMes = document.getElementById('qm-mes');
    const sAno = document.getElementById('qm-ano');
    if (!sMes || !sAno) return;
    
    sMes.innerHTML = '';
    sAno.innerHTML = '';
    
    const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const currentMonth = new Date().getMonth();
    meses.forEach((m, idx) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = nomesMeses[idx];
        if (idx === currentMonth) opt.selected = true;
        sMes.appendChild(opt);
    });
    
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        const opt = document.createElement('option');
        opt.value = i.toString();
        opt.textContent = i;
        if (i === currentYear) opt.selected = true;
        sAno.appendChild(opt);
    }
}

async function renderizarQm() {
    const sMes = document.getElementById('qm-mes');
    const sAno = document.getElementById('qm-ano');
    const tbody = document.getElementById('qm-tbody');
    
    if (!sMes || !sAno || !tbody) return;
    
    const mes = sMes.value;
    const ano = sAno.value;
    const currentBranch = currentOprBranch || document.querySelector('#opr-branch-selector .branch-cards-grid .selected')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || '';
    
    if (!currentBranch) return;

    qmRequestSequence++;
    const currentSeq = qmRequestSequence;
    
    // UI: Carregando
    tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #64748b; font-style: italic;"><i class="fa-solid fa-spinner fa-spin"></i> Atualizando dados da Ouvidoria...</td></tr>`;
    
    // Reset KPIs just in case
    document.getElementById('qm-lbl-total').textContent = '-';
    document.getElementById('qm-lbl-resolvidas').textContent = '-';
    document.getElementById('qm-lbl-abertas').textContent = '-';
    if(document.getElementById('qm-lbl-tratativa')) document.getElementById('qm-lbl-tratativa').textContent = '-';
    if(document.getElementById('qm-lbl-naoprocede')) document.getElementById('qm-lbl-naoprocede').textContent = '-';

    // Clear charts immediately if possible
    if (window.qmChartTipo) { window.qmChartTipo.destroy(); window.qmChartTipo = null; }
    if (window.qmChartStatus) { window.qmChartStatus.destroy(); window.qmChartStatus = null; }

    try {
        // Busca TODAS as reclamacoes da filial para o ANO selecionado
        const reclamacoesAno = await OuvidoriaRepository.fetchComplaints(currentBranch, ano);
        
        if (currentSeq !== qmRequestSequence) return; // Concorrência
        
        // 1. Calcular Indicadores ANUAIS (com base em reclamacoesAno)
        const totalAno = reclamacoesAno.length;
        const solAno = reclamacoesAno.filter(r => r.status === 'Solucionada').length;
        const naoSolAno = reclamacoesAno.filter(r => r.status === 'Não Solucionada').length;
        const tratativaAno = reclamacoesAno.filter(r => r.status === 'Em Tratativa').length;
        const invalidaAno = reclamacoesAno.filter(r => r.status === 'Não Procede').length;
        
        document.getElementById('qm-lbl-total').textContent = totalAno;
        document.getElementById('qm-lbl-resolvidas').textContent = solAno;
        document.getElementById('qm-lbl-abertas').textContent = naoSolAno;
        if(document.getElementById('qm-lbl-tratativa')) document.getElementById('qm-lbl-tratativa').textContent = tratativaAno;
        if(document.getElementById('qm-lbl-naoprocede')) document.getElementById('qm-lbl-naoprocede').textContent = invalidaAno;
        
        // 2. Filtrar Mensal para Gráficos e Tabela
        const prefixoMes = `${ano}-${mes}`;
        const reclamacoesMes = reclamacoesAno.filter(r => r.data.startsWith(prefixoMes));
        
        // 3. Renderizar Tabela Mensal
        tbody.innerHTML = '';
        
        if (reclamacoesMes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">Nenhuma reclamação encontrada para o período.</td></tr>`;
        } else {
            // Sort by date desc
            reclamacoesMes.sort((a, b) => new Date(b.data) - new Date(a.data));
            
            reclamacoesMes.forEach(rec => {
                const dParts = rec.data.split('-');
                const dataFormatada = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : rec.data;
                
                let badgeColor = '';
                if (rec.status === 'Solucionada') badgeColor = 'background: #dcfce7; color: #166534;';
                else if (rec.status === 'Não Solucionada') badgeColor = 'background: #fee2e2; color: #991b1b;';
                else if (rec.status === 'Em Tratativa') badgeColor = 'background: #fef3c7; color: #92400e;';
                else if (rec.status === 'Não Procede') badgeColor = 'background: #f1f5f9; color: #475569;';
                else badgeColor = 'background: #e2e8f0; color: #475569;';
                
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #f1f5f9';
                tr.innerHTML = `
                    <td style="padding: 12px; color: #475569; font-weight: 500;">${dataFormatada}</td>
                    <td style="padding: 12px; color: #0B1D32; font-weight: 700;">${rec.cliente}</td>
                    <td style="padding: 12px; color: #475569;">${rec.motivo}</td>
                    <td style="padding: 12px; text-align: center;">
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; ${badgeColor}">${rec.status}</span>
                    </td>
                    
                `;
                tbody.appendChild(tr);
            });
        }

        // 4. Renderizar Gráficos Mensais
        const ctxTipo = document.getElementById('qm-chart-tipo');
        const ctxStatus = document.getElementById('qm-chart-status');
        
        if (ctxTipo && ctxStatus) {
            // Agrupar por Tipo/Motivo (MENSAL)
            const countPorTipo = {};
            reclamacoesMes.forEach(r => {
                const tipo = r.motivo || 'Outros';
                countPorTipo[tipo] = (countPorTipo[tipo] || 0) + 1;
            });
            const labelsTipo = Object.keys(countPorTipo);
            const dataTipo = Object.values(countPorTipo);
            
            
            const qmBarValueLabels = {
                id: 'qmBarValueLabels',
                afterDatasetsDraw(chart) {
                    const { ctx, data } = chart;
                    ctx.save();
                    ctx.font = 'bold 10px sans-serif';
                    ctx.fillStyle = '#333';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    
                    chart.getDatasetMeta(0).data.forEach((bar, index) => {
                        const value = data.datasets[0].data[index];
                        if (value > 0) {
                            ctx.fillText(value, bar.x + 5, bar.y);
                        }
                    });
                    ctx.restore();
                }
            };
window.qmChartTipo = new Chart(ctxTipo, {
                type: 'bar',
                data: {
                    labels: labelsTipo,
                    datasets: [{
                        label: 'Reclamações',
                        data: dataTipo,
                        backgroundColor: dataTipo.map((_, i) => ['#0B1D32', '#A30D00', '#4F000B', '#020122', '#AB2317'][i % 5]),
                        borderRadius: 4
                    }]
                },
                plugins: [qmBarValueLabels],
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { right: 30 } },
                    plugins: { legend: { display: false } },
                    scales: { 
                        x: { display: false, beginAtZero: true, ticks: { stepSize: 1 }, grid: { display: false } }, 
                        y: { display: true, grid: { display: false } } 
                    }
                }
            });
            
            // Agrupar por Status Visual (MENSAL)
            const solMes = reclamacoesMes.filter(r => r.status === 'Solucionada').length;
            const naoSolMes = reclamacoesMes.filter(r => r.status === 'Não Solucionada').length;
            const tratativaMes = reclamacoesMes.filter(r => r.status === 'Em Tratativa').length;
            const invalidaMes = reclamacoesMes.filter(r => r.status === 'Não Procede').length;
            
            const countPorStatus = {
                'Solucionada': solMes,
                'Não Solucionada': naoSolMes,
                'Em Tratativa': tratativaMes,
                'Não Procede': invalidaMes
            };
            const labelsStatus = Object.keys(countPorStatus).filter(k => countPorStatus[k] > 0);
            const dataStatus = labelsStatus.map(k => countPorStatus[k]);
            
                        const simasColors = ['#0B1D32', '#A30D00', '#4F000B', '#020122', '#AB2317'];
            const bgColorStatus = labelsStatus.map((_, i) => simasColors[i % 5]);
            
            
            const qmDoughnutValueLabels = {
                id: 'qmDoughnutValueLabels',
                afterDatasetsDraw(chart) {
                    const { ctx, data } = chart;
                    ctx.save();
                    ctx.font = 'bold 11px sans-serif';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    chart.getDatasetMeta(0).data.forEach((arc, index) => {
                        const value = data.datasets[0].data[index];
                        if (value > 0) {
                            const center = arc.tooltipPosition();
                            ctx.fillText(value, center.x, center.y);
                        }
                    });
                    ctx.restore();
                }
            };
window.qmChartStatus = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: labelsStatus,
                    datasets: [{
                        data: dataStatus,
                        backgroundColor: bgColorStatus,
                        borderWidth: 0,
                        cutout: '70%'
                    }]
                },
                plugins: [qmDoughnutValueLabels],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11, family: "'Montserrat', sans-serif" } } }
                    }
                }
            });
        }

    } catch (e) {
        console.error("Erro na integração Ouvidoria Simas:", e);
        if (currentSeq === qmRequestSequence) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #dc2626; font-style: italic;"><i class="fa-solid fa-triangle-exclamation"></i> Dados da Ouvidoria temporariamente indisponíveis.</td></tr>`;
        }
    }
}









// ============================================================
// MÓDULO DE NÃO CONFORMIDADES (NCs)
// ============================================================

const filialPrefixes = {
    "São Roque": "SR",
    "Sorocaba": "SC",
    "Matriz": "MTZ",
    "Camaçari": "CA",
    "Funeas": "SJP FN",
    "SJP Prefeitura": "SJP PF",
    "Patrimônio": "PTM",
    "Governador Valadares": "GV",
    "Juatuba": "JB",
    "Tigre": "TG",
    "Contagem": "CTG"
};



function renderNcTable() {
    const tbody = document.getElementById("nc-table-body");
    if (!tbody) return;
    
    if (typeof filteredNcs === 'undefined' || !filteredNcs || filteredNcs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color:#64748b; padding:20px; font-style:italic;">Nenhuma Não Conformidade encontrada.</td></tr>';
        return;
    }
    
    let html = "";
    filteredNcs.forEach(nc => {
        let badgeClass = 'default';
        let statusNormalized = nc.status || 'Desconhecido';
        if (statusNormalized === 'Aberta') badgeClass = 'aberta';
        else if (statusNormalized === 'Em Tratamento') badgeClass = 'tratamento';
        else if (statusNormalized === 'Fechada') badgeClass = 'fechada';
        
        const dataFormatada = nc.dataOcorrencia ? nc.dataOcorrencia.split('-').reverse().join('/') : '—';
        
        let splitCode = nc.codigo ? nc.codigo.split(' ') : ['—', ''];
        let filialPrefix = splitCode[0] || '—';
        let numPrefix = splitCode[1] || '';
        
        html += `
            <tr>
                <td>
                    <div class="nc-code">
                        ${filialPrefix}
                        ${numPrefix ? `<span>${numPrefix}</span>` : ''}
                    </div>
                </td>
                <td>${dataFormatada}</td>
                <td>${nc.filial || '—'}</td>
                <td>${nc.tipo || '—'}</td>
                <td>${nc.setor || '—'}</td>
                <td>${nc.origem || '—'}</td>
                <td>${nc.identificacao || '—'}</td>
                <td>${nc.cliente || '—'}</td>
                <td>${nc.responsavel || '—'}</td>
                <td><span class="badge ${badgeClass}">${statusNormalized}</span></td>
                <td>
                    <button class="action-icon" onclick="editNc('${nc.id}')" title="Editar NC"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-icon" style="color: ${(nc.anexos && nc.anexos.length > 0) ? '#0B1D32' : '#cbd5e1'}; cursor: ${(nc.anexos && nc.anexos.length > 0) ? 'pointer' : 'not-allowed'};" onclick="${(nc.anexos && nc.anexos.length > 0) ? `handleDownloadNcAnexos('${nc.id}')` : 'return false;'}" title="${(nc.anexos && nc.anexos.length > 0) ? 'Baixar anexos' : 'Sem anexos'}" ${(nc.anexos && nc.anexos.length > 0) ? '' : 'disabled'}><i class="fa-solid fa-download"></i></button>
                    ${(typeof currentUser !== 'undefined' && currentUser && currentUser.isAdmin) ? `<button class="action-icon text-danger" onclick="deleteNc('${nc.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>` : ''}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}





async function previewNcCode() {
    const filial = document.getElementById("form-nc-filial").value;
    const data = document.getElementById("form-nc-data").value;
    const isEdit = document.getElementById("form-nc-id").value !== "";
    if (isEdit) return; // Mantém o código original na edição
    
    if (filial) {
        document.getElementById("form-nc-codigo").value = await generateNcId(filial, data);
    }
}







async function deleteNc(id) {
    if (!currentUser.isAdmin) {
        showToast("Apenas administradores podem excluir registros.", "error");
        return;
    }
    
    if (confirm("ATENÇÃO: Tem certeza que deseja excluir esta Não Conformidade? Esta ação não pode ser desfeita.")) {
        try {
            await db.collection("nonConformities").doc(id).delete();
            ncs = ncs.filter(n => n.id !== id);
            applyNcFilters();
            showToast("Não Conformidade excluída com sucesso!");
        } catch (e) {
            console.error("Erro ao excluir NC:", e);
            showToast("Erro ao excluir. Verifique sua conexão.", "error");
        }
    }
}



function filterNcByStatus(status) {
    const statusSelect = document.getElementById("filter-nc-status");
    if (statusSelect) {
        statusSelect.value = status;
        applyNcFilters();
    }
}


// INÍCIO ADAPTADOR MOCK NC — CHECKPOINT 2.3



// FIM ADAPTADOR MOCK NC — CHECKPOINT 2.3






// ==================== LÓGICA MELHORIAS IMPLEMENTADAS ====================

const melhoriasPendingFiles = new Map(); // key: oprId_melhoriaId_antes/depois
const melhoriasDeletedFilesQueue = new Set();
const melhoriasUrlsToRevoke = new Set();

function abrirModalMelhoria(id = null) {
    if (!currentOprRecordId) {
        alert('Crie ou abra um OPR primeiro.');
        return;
    }
    
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;
    if (record.status === 'Finalizado' || record.status === 'Concluído') {
        alert('Este relatório está concluído (somente leitura).');
        return;
    }

    let items = record.data.melhoriasData || [];
    let ava = id ? items.find(a => a.id === id) : null;

    document.getElementById('melhoria-filial').value = record.filial || '';
    document.getElementById('melhoria-id').value = ava ? ava.id : '';
    document.getElementById('melhoria-data').value = ava ? ava.data : new Date().toISOString().split('T')[0];
    document.getElementById('melhoria-responsavel').value = ava ? ava.responsavel : (typeof currentUser !== 'undefined' && currentUser ? currentUser.name : '');
    document.getElementById('melhoria-titulo').value = ava ? ava.titulo : '';
    
    document.getElementById('melhoria-desc-antes').value = ava ? ava.descAntes : '';
    document.getElementById('melhoria-desc-depois').value = ava ? ava.descDepois : '';
    document.getElementById('melhoria-impacto').value = ava ? ava.impacto : '';
    document.getElementById('melhoria-obs').value = ava ? ava.obs : '';

    document.getElementById('melhoria-img-antes').value = '';
    document.getElementById('melhoria-img-depois').value = '';

    const prevAntes = document.getElementById('melhoria-preview-antes');
    let urlAntes = ava ? ava.imgAntesPreviewUrl : null;
    if (ava && !urlAntes && ava.imgAntesFileId) urlAntes = ava.imgAntesUrl;
    
    if (urlAntes) {
        prevAntes.innerHTML = `<img src="${urlAntes}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        prevAntes.innerHTML = '<span style="color: #f87171; font-size: 12px;">Sem imagem</span>';
    }

    const prevDepois = document.getElementById('melhoria-preview-depois');
    let urlDepois = ava ? ava.imgDepoisPreviewUrl : null;
    if (ava && !urlDepois && ava.imgDepoisFileId) urlDepois = ava.imgDepoisUrl;
    
    if (urlDepois) {
        prevDepois.innerHTML = `<img src="${urlDepois}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        prevDepois.innerHTML = '<span style="color: #4ade80; font-size: 12px;">Sem imagem</span>';
    }

    document.getElementById('modal-melhoria').style.display = 'flex';
}

function fecharModalMelhoria() {
    document.getElementById('modal-melhoria').style.display = 'none';
    
    const mId = document.getElementById('melhoria-id').value;
    if (!mId) {
        const keyA = `${currentOprRecordId}_new_antes`;
        const keyD = `${currentOprRecordId}_new_depois`;
        if (melhoriasPendingFiles.has(keyA)) {
            const url = melhoriasPendingFiles.get(keyA).objectUrl;
            URL.revokeObjectURL(url);
            melhoriasUrlsToRevoke.delete(url);
            melhoriasPendingFiles.delete(keyA);
        }
        if (melhoriasPendingFiles.has(keyD)) {
            const url = melhoriasPendingFiles.get(keyD).objectUrl;
            URL.revokeObjectURL(url);
            melhoriasUrlsToRevoke.delete(url);
            melhoriasPendingFiles.delete(keyD);
        }
    }
}

function previewMelhoriaImage(input, previewId) {
    const file = input.files[0];
    const pos = previewId.includes('antes') ? 'antes' : 'depois';
    const previewDiv = document.getElementById(previewId);
    const mId = document.getElementById('melhoria-id').value || 'new';
    const key = `${currentOprRecordId}_${mId}_${pos}`;
    
    if (file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Apenas imagens JPG, PNG ou WebP são permitidas.');
            input.value = '';
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            alert('A imagem excede o tamanho máximo permitido de 5MB.');
            input.value = '';
            return;
        }
        
        if (melhoriasPendingFiles.has(key)) {
            const oldObjUrl = melhoriasPendingFiles.get(key).objectUrl;
            URL.revokeObjectURL(oldObjUrl);
            melhoriasUrlsToRevoke.delete(oldObjUrl);
        }

        const objectUrl = safeCreateObjectURL(file);
        melhoriasUrlsToRevoke.add(objectUrl);
        melhoriasPendingFiles.set(key, { file, objectUrl });
        previewDiv.innerHTML = `<img src="${objectUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        if (melhoriasPendingFiles.has(key)) {
            const oldObjUrl = melhoriasPendingFiles.get(key).objectUrl;
            URL.revokeObjectURL(oldObjUrl);
            melhoriasUrlsToRevoke.delete(oldObjUrl);
            melhoriasPendingFiles.delete(key);
        }
        const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
        let ava = null;
        if (record && record.data.melhoriasData) ava = record.data.melhoriasData.find(a => a.id === mId);
        
        let oldUrl = null;
        if (ava) {
            if (pos === 'antes') oldUrl = ava.imgAntesPreviewUrl || ava.imgAntesUrl;
            if (pos === 'depois') oldUrl = ava.imgDepoisPreviewUrl || ava.imgDepoisUrl;
        }
        
        if (oldUrl) {
            previewDiv.innerHTML = `<img src="${oldUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            previewDiv.innerHTML = pos === 'antes' ? '<span style="color: #f87171; font-size: 12px;">Sem imagem</span>' : '<span style="color: #4ade80; font-size: 12px;">Sem imagem</span>';
        }
    }
}

function salvarMelhoria() {
    const filial = document.getElementById('melhoria-filial').value;
    const dataVal = document.getElementById('melhoria-data').value;
    const responsavel = document.getElementById('melhoria-responsavel').value.trim();
    const titulo = document.getElementById('melhoria-titulo').value.trim();
    const descAntes = document.getElementById('melhoria-desc-antes').value.trim();
    const descDepois = document.getElementById('melhoria-desc-depois').value.trim();
    const impacto = document.getElementById('melhoria-impacto').value.trim();
    const obs = document.getElementById('melhoria-obs').value.trim();
    
    if (!dataVal || !responsavel || !titulo || !descAntes || !descDepois || !impacto) {
        alert('Por favor, preencha todos os campos obrigatórios (*).');
        return;
    }
    
    let id = document.getElementById('melhoria-id').value;
    const isNew = !id;
    if (isNew) id = 'mel-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).substr(2,5));

    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;
    
    if (!record.data.melhoriasData) record.data.melhoriasData = [];
    let ava = record.data.melhoriasData.find(a => a.id === id);
    if (!ava) {
        ava = { id, filial, uploadDate: new Date().toISOString() };
        record.data.melhoriasData.push(ava);
    }
    
    ava.data = dataVal;
    ava.responsavel = responsavel;
    ava.titulo = titulo;
    ava.descAntes = descAntes;
    ava.descDepois = descDepois;
    ava.impacto = impacto;
    ava.obs = obs;

    const oldKeyA = `${currentOprRecordId}_${isNew ? 'new' : id}_antes`;
    const newKeyA = `${currentOprRecordId}_${id}_antes`;
    if (melhoriasPendingFiles.has(oldKeyA)) {
        if (isNew) {
            melhoriasPendingFiles.set(newKeyA, melhoriasPendingFiles.get(oldKeyA));
            melhoriasPendingFiles.delete(oldKeyA);
        }
        ava.imgAntesPending = true;
        ava.imgAntesPreviewUrl = melhoriasPendingFiles.get(newKeyA).objectUrl;
        const f = melhoriasPendingFiles.get(newKeyA).file;
        ava.imgAntesPendingName = f.name;
        ava.imgAntesPendingMime = f.type;
        ava.imgAntesPendingSize = f.size;
        if (!isNew && ava.imgAntesFileId) melhoriasDeletedFilesQueue.add(ava.imgAntesFileId);
    } else if (isNew) {
        // Regra legado requerias as imagens
        alert('Por favor, anexe a Imagem da Situação Anterior.');
        return;
    }
    
    const oldKeyD = `${currentOprRecordId}_${isNew ? 'new' : id}_depois`;
    const newKeyD = `${currentOprRecordId}_${id}_depois`;
    if (melhoriasPendingFiles.has(oldKeyD)) {
        if (isNew) {
            melhoriasPendingFiles.set(newKeyD, melhoriasPendingFiles.get(oldKeyD));
            melhoriasPendingFiles.delete(oldKeyD);
        }
        ava.imgDepoisPending = true;
        ava.imgDepoisPreviewUrl = melhoriasPendingFiles.get(newKeyD).objectUrl;
        const f = melhoriasPendingFiles.get(newKeyD).file;
        ava.imgDepoisPendingName = f.name;
        ava.imgDepoisPendingMime = f.type;
        ava.imgDepoisPendingSize = f.size;
        if (!isNew && ava.imgDepoisFileId) melhoriasDeletedFilesQueue.add(ava.imgDepoisFileId);
    } else if (isNew) {
        alert('Por favor, anexe a Imagem da Situação Posterior.');
        return;
    }

    renderizarMelhorias();
    if (typeof markOprDirty === "function") markOprDirty();
fecharModalMelhoria();
    if(typeof showToast === 'function') showToast('Melhoria salva localmente. Salve o rascunho.', 'info');
}

function excluirMelhoria(id) {
    if (confirm('Tem certeza que deseja excluir esta Melhoria? A exclusão final ocorre ao salvar o rascunho ou concluir.')) {
        const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
        if (!record || !record.data.melhoriasData) return;
        
        const ava = record.data.melhoriasData.find(a => a.id === id);
        if (ava) {
            if (ava.imgAntesFileId) melhoriasDeletedFilesQueue.add(ava.imgAntesFileId);
            if (ava.imgDepoisFileId) melhoriasDeletedFilesQueue.add(ava.imgDepoisFileId);
            
            const keyA = `${currentOprRecordId}_${id}_antes`;
            if (melhoriasPendingFiles.has(keyA)) {
                URL.revokeObjectURL(melhoriasPendingFiles.get(keyA).objectUrl);
                melhoriasPendingFiles.delete(keyA);
            }
            const keyD = `${currentOprRecordId}_${id}_depois`;
            if (melhoriasPendingFiles.has(keyD)) {
                URL.revokeObjectURL(melhoriasPendingFiles.get(keyD).objectUrl);
                melhoriasPendingFiles.delete(keyD);
            }
        }
        
        record.data.melhoriasData = record.data.melhoriasData.filter(a => a.id !== id);
        renderizarMelhorias();
    if (typeof markOprDirty === "function") markOprDirty();
}
}

function renderizarMelhorias() {
    if (!currentOprRecordId) return;
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;
    
    const isReadOnly = (record.status === 'Finalizado' || record.status === 'Concluído');
    
    const grid = document.getElementById('melhorias-grid');
    const emptyMsg = document.getElementById('melhorias-empty-msg');
    grid.innerHTML = '';
    
    let items = record.data.melhoriasData || [];
    
    if (items.length === 0) {
        if(emptyMsg) {
            grid.appendChild(emptyMsg);
            emptyMsg.style.display = 'block';
        }
        return;
    }
    
    items.forEach(mel => {
        const card = document.createElement('div');
        card.style.background = '#ffffff';
        card.style.border = '1px solid #e2e8f0';
        card.style.borderRadius = '12px';
        card.style.overflow = 'hidden';
        card.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        
        let dateStr = '';
        if (mel.data) {
            const [y,m,d] = mel.data.split('-');
            dateStr = `${d}/${m}/${y}`;
        }
        
        const urlAntes = mel.imgAntesPending ? mel.imgAntesPreviewUrl : (mel.imgAntesUrl || '');
        const urlDepois = mel.imgDepoisPending ? mel.imgDepoisPreviewUrl : (mel.imgDepoisUrl || '');
        
        const fileAntesName = mel.imgAntesName || mel.imgAntesPendingName || 'Melhoria_Antes.jpg';
        const fileDepoisName = mel.imgDepoisName || mel.imgDepoisPendingName || 'Melhoria_Depois.jpg';
        
        const headerHtml = `
            <div style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; font-size: 16px; color: #0B1D32; font-weight: 800;"><i class="fa-solid fa-lightbulb" style="color: #eab308; margin-right: 5px;"></i> ${mel.titulo}</h4>
                ${!isReadOnly ? `
                    <div style="display: flex; gap: 10px;" class="opr-actions-only">
                        <button data-opr-action="true" onclick="abrirModalMelhoria('${mel.id}')" style="background: none; border: none; color: #0ea5e9; cursor: pointer; font-size: 14px;" title="Editar Melhoria"><i class="fa-solid fa-pen"></i></button>
                        <button data-opr-action="true" onclick="excluirMelhoria('${mel.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px;" title="Excluir Melhoria"><i class="fa-solid fa-trash"></i></button>
                    </div>
                ` : ''}
            </div>
        `;
        
        const bodyHtml = `
            <div style="display: flex; flex-wrap: wrap; background: #fff;">
                <!-- ANTES -->
                <div style="flex: 1; min-width: 300px; padding: 20px; border-right: 1px dashed #e2e8f0; display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Antes</span>
                    </div>
                    <div style="height: 200px; background: #f1f5f9; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick=\"abrirLightboxLUP('${urlAntes}', '${urlDepois}', '${mel.titulo}', '${fileAntesName}', '${mel.imgDepoisName || mel.imgDepoisPendingName || 'LUP_Depois.jpg'}')\" title="Clique para ampliar">
                        ${urlAntes === 'MISSING' ? '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#ef4444;font-size:11px;font-weight:bold;">Imagem indisponvel</div>' : (urlAntes ? `<img src="${urlAntes}" style="width: 100%; height: 100%; object-fit: cover;">` : '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94a3b8;font-size:11px;">Sem imagem</div>')}
                    </div>
                    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">${mel.descAntes}</p>
                </div>
                
                <!-- DEPOIS -->
                <div style="flex: 1; min-width: 300px; padding: 20px; display: flex; flex-direction: column; gap: 15px; background: #f8fafc;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Depois</span>
                    </div>
                    <div style="height: 200px; background: #f1f5f9; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick=\"abrirLightboxLUP('${urlAntes}', '${urlDepois}', '${mel.titulo}', '${mel.imgAntesName || mel.imgAntesPendingName || 'LUP_Antes.jpg'}', '${fileDepoisName}')\" title="Clique para ampliar">
                        ${urlDepois === 'MISSING' ? '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#ef4444;font-size:11px;font-weight:bold;">Imagem indisponvel</div>' : (urlDepois ? `<img src="${urlDepois}" style="width: 100%; height: 100%; object-fit: cover;">` : '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94a3b8;font-size:11px;">Sem imagem</div>')}
                    </div>
                    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">${mel.descDepois}</p>
                </div>
            </div>
        `;
        
        const footerHtml = `
            <div style="padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #ffffff;">
                <div style="margin-bottom: 12px; padding: 10px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;">
                    <span style="font-size: 12px; font-weight: 800; color: #0369a1; display: block; margin-bottom: 4px;"><i class="fa-solid fa-chart-line"></i> Impacto/Benefício:</span>
                    <span style="font-size: 13px; color: #0c4a6e;">${mel.impacto}</span>
                </div>
                ${mel.obs ? `<div style="margin-bottom: 12px; font-size: 12px; color: #64748b;"><strong>Observação:</strong> ${mel.obs}</div>` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; font-weight: 600;">
                    <span><i class="fa-solid fa-calendar-check"></i> Concluído em: ${dateStr}</span>
                    <span><i class="fa-solid fa-user-gear"></i> Responsável: ${mel.responsavel}</span>
                </div>
            </div>
        `;
        
        card.innerHTML = headerHtml + bodyHtml + footerHtml;
        grid.appendChild(card);
    });
}

// Persistencia de Arquivos
async function prepareMelhoriasPersistence() {
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record || !record.data.melhoriasData) return [];
    
    let rollbackQueue = [];
    
    try {
        for (let ava of record.data.melhoriasData) {
            if (ava.imgAntesPending) {
                const key = `${currentOprRecordId}_${ava.id}_antes`;
                if (melhoriasPendingFiles.has(key)) {
                    const { file } = melhoriasPendingFiles.get(key);
                    const fileId = await FileRepository.save(file, { oprId: currentOprRecordId, melhoriaId: ava.id, slot: 'antes', mimeType: file.type });
                    rollbackQueue.push(fileId);
                    ava.imgAntesFileId = fileId;
                    ava.imgAntesName = file.name;
                    ava.imgAntesMimeType = file.type;
                    ava.imgAntesSize = file.size;
                }
            }
            if (ava.imgDepoisPending) {
                const key = `${currentOprRecordId}_${ava.id}_depois`;
                if (melhoriasPendingFiles.has(key)) {
                    const { file } = melhoriasPendingFiles.get(key);
                    const fileId = await FileRepository.save(file, { oprId: currentOprRecordId, melhoriaId: ava.id, slot: 'depois', mimeType: file.type });
                    rollbackQueue.push(fileId);
                    ava.imgDepoisFileId = fileId;
                    ava.imgDepoisName = file.name;
                    ava.imgDepoisMimeType = file.type;
                    ava.imgDepoisSize = file.size;
                }
            }
        }
        return rollbackQueue;
    } catch (e) {
        console.error("Erro upload Melhorias", e);
        for (let fileId of rollbackQueue) {
            await FileRepository.remove(fileId).catch(console.error);
        }
        throw new Error("Falha no upload Melhorias: " + e.message);
    }
}

function getSerializableMelhoriasData() {
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record || !record.data.melhoriasData) return undefined;
    
    return record.data.melhoriasData.map(l => {
        let c = { ...l };
        delete c.imgAntesPending;
        delete c.imgAntesPreviewUrl;
        delete c.imgAntesPendingName;
        delete c.imgAntesPendingMime;
        delete c.imgAntesPendingSize;
        delete c.imgAntesUrl;
        
        delete c.imgDepoisPending;
        delete c.imgDepoisPreviewUrl;
        delete c.imgDepoisPendingName;
        delete c.imgDepoisPendingMime;
        delete c.imgDepoisPendingSize;
        delete c.imgDepoisUrl;
        return c;
    });
}

function finalizeMelhoriasPersistence() {
    melhoriasDeletedFilesQueue.forEach(id => {
        FileRepository.remove(id).catch(err => {
            console.error("Erro limpar arquivo velho Melhoria", err);
        });
    });
    melhoriasDeletedFilesQueue.clear();
    
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (record && record.data.melhoriasData) {
        record.data.melhoriasData.forEach(ava => {
            if (ava.imgAntesPending) {
                ava.imgAntesUrl = ava.imgAntesPreviewUrl;
                delete ava.imgAntesPending;
                delete ava.imgAntesPreviewUrl;
                delete ava.imgAntesPendingName;
                delete ava.imgAntesPendingMime;
                delete ava.imgAntesPendingSize;
            }
            if (ava.imgDepoisPending) {
                ava.imgDepoisUrl = ava.imgDepoisPreviewUrl;
                delete ava.imgDepoisPending;
                delete ava.imgDepoisPreviewUrl;
                delete ava.imgDepoisPendingName;
                delete ava.imgDepoisPendingMime;
                delete ava.imgDepoisPendingSize;
            }
        });
    }
    melhoriasPendingFiles.clear();
}

async function loadMelhoriasImagesForCache(token) {
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record || !record.data.melhoriasData) return;
    
    for (let ava of record.data.melhoriasData) {
        if (oprOpeningSequence !== token) return;
        if (ava.imgAntesFileId && !ava.imgAntesUrl) {
            try {
                const f = await FileRepository.get(ava.imgAntesFileId);
                if (f && f.blob) {
                    const url = safeCreateObjectURL(f.blob);
                    melhoriasUrlsToRevoke.add(url);
                    ava.imgAntesUrl = url;
                } else {
                    console.error("Melhorias: Imagem indisponvel. OPR:", currentOprRecordId, "Registro:", ava.id, "Slot: antes", "FileId:", ava.imgAntesFileId);
                    ava.imgAntesUrl = 'MISSING';
                }
            } catch (e) { console.error("Melhorias: Imagem indisponvel", e); ava.imgAntesUrl = 'MISSING'; }
        }
        if (oprOpeningSequence !== token) return;
        if (ava.imgDepoisFileId && !ava.imgDepoisUrl) {
            try {
                const f = await FileRepository.get(ava.imgDepoisFileId);
                if (f && f.blob) {
                    const url = safeCreateObjectURL(f.blob);
                    melhoriasUrlsToRevoke.add(url);
                    ava.imgDepoisUrl = url;
                } else {
                    console.error("Melhorias: Imagem indisponvel. OPR:", currentOprRecordId, "Registro:", ava.id, "Slot: depois", "FileId:", ava.imgDepoisFileId);
                    ava.imgDepoisUrl = 'MISSING';
                }
            } catch (e) { console.error("Melhorias: Imagem indisponvel", e); ava.imgDepoisUrl = 'MISSING'; }
        }
    }
}


// ==================== LÓGICA LUP ====================
let currentLupFilter = 'Todas';

const lupPendingFiles = new Map(); // key: oprId_lupId_antes/depois, value: { file, objectUrl }
const lupDeletedFilesQueue = new Set(); // set of fileIds to be deleted on successful persist
const lupUrlsToRevoke = new Set(); // object URLs to be revoked eventually

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function safeCreateObjectURL(file) {
    const url = URL.createObjectURL(file);
    lupUrlsToRevoke.add(url);
    return url;
}

function revokeAllLupUrls() {
    lupUrlsToRevoke.forEach(url => URL.revokeObjectURL(url));
    lupUrlsToRevoke.clear();
}

async function abrirModalLUP(id = null) {
    if (!currentOprRecordId) {
        alert('Crie ou abra um OPR primeiro.');
        return;
    }
    
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;
    if (record.status === 'Finalizado' || record.status === 'Concluído' || record.status === 'Concludo') {
        alert('Este relatório está concluído (somente leitura).');
        return;
    }

    let lups = record.data.lupData || [];
    let ava = id ? lups.find(a => a.id === id) : null;

    document.getElementById('lup-filial').value = record.filial || '';
    document.getElementById('lup-id').value = ava ? ava.id : '';
    document.getElementById('lup-depto').value = ava ? ava.depto : '';
    document.getElementById('lup-data').value = ava ? ava.data : new Date().toISOString().split('T')[0];
    document.getElementById('lup-classificacao').value = ava ? ava.classificacao : '';
    document.getElementById('lup-responsavel').value = ava ? ava.responsavel : (typeof currentUser !== 'undefined' && currentUser ? currentUser.name : '');
    document.getElementById('lup-titulo').value = ava ? ava.titulo : '';
    document.getElementById('lup-subtitulo').value = ava ? ava.subtitulo : '';
    document.getElementById('lup-versao').value = ava ? ava.versao : '';
    document.getElementById('lup-analise').value = ava ? ava.analise : '';
    document.getElementById('lup-acao').value = ava ? ava.acao : '';

    if (ava) {
        document.getElementById('lup-codigo').value = ava.codigo || '';
    } else {
        document.getElementById('lup-codigo').value = 'Calculando...';
        try {
            const filialNorm = (record.filial || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const metaKey = 'lup_seq_' + filialNorm;
            
            const metaRecord = await SimasDB.runTransaction('systemMetadata', 'readonly', store => store.get(metaKey));
            let maxNum = 0;
            
            if (metaRecord && typeof metaRecord.value === 'number') {
                maxNum = metaRecord.value;
            } else {
                const allMetas = await OprHistoryRepository.list();
                const filialMetas = allMetas.filter(m => m.branch === record.filial);
                
                for (const m of filialMetas) {
                    if (!m.snapshotId) continue;
                    const snap = await SnapshotRepository.getById(m.snapshotId);
                    if (snap && snap.data && snap.data.lupData) {
                        for (const L of snap.data.lupData) {
                            if (L.codigo && typeof L.codigo === 'string') {
                                const match = L.codigo.match(/LUP-(\d+)/i);
                                if (match) {
                                    const n = parseInt(match[1], 10);
                                    if (n > maxNum) maxNum = n;
                                }
                            }
                        }
                    }
                }
                
                if (record.data && record.data.lupData) {
                    for (const L of record.data.lupData) {
                        if (L.codigo && typeof L.codigo === 'string') {
                            const match = L.codigo.match(/LUP-(\d+)/i);
                            if (match) {
                                const n = parseInt(match[1], 10);
                                if (n > maxNum) maxNum = n;
                            }
                        }
                    }
                }
                
                await SimasDB.runTransaction('systemMetadata', 'readwrite', store => store.put({ key: metaKey, value: maxNum }));
            }
            
            const predictedNum = maxNum + 1;
            document.getElementById('lup-codigo').value = 'LUP-' + String(predictedNum).padStart(3, '0') + ' (Previsto)';
        } catch(e) {
            console.error('Erro ao prever código da LUP:', e);
            document.getElementById('lup-codigo').value = 'Erro ao calcular';
        }
    }

    document.getElementById('lup-img-antes').value = '';
    document.getElementById('lup-img-depois').value = '';

    const prevAntes = document.getElementById('lup-preview-antes');
    let urlAntes = ava ? ava.imgAntesPreviewUrl : null;
    if (ava && !urlAntes && ava.imgAntesFileId) urlAntes = ava.imgAntesUrl;
    
    if (urlAntes) {
        prevAntes.innerHTML = `<img src="${urlAntes}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        prevAntes.innerHTML = '<span style="color: #94a3b8; font-size: 12px;">Sem imagem</span>';
    }

    const prevDepois = document.getElementById('lup-preview-depois');
    let urlDepois = ava ? ava.imgDepoisPreviewUrl : null;
    if (ava && !urlDepois && ava.imgDepoisFileId) urlDepois = ava.imgDepoisUrl;
    
    if (urlDepois) {
        prevDepois.innerHTML = `<img src="${urlDepois}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        prevDepois.innerHTML = '<span style="color: #94a3b8; font-size: 12px;">Sem imagem</span>';
    }

    document.getElementById('modal-lup').style.display = 'flex';
}

function fecharModalLUP() {
    document.getElementById('modal-lup').style.display = 'none';
    
    const lupId = document.getElementById('lup-id').value;
    if (!lupId) {
        const keyA = `${currentOprRecordId}_new_antes`;
        const keyD = `${currentOprRecordId}_new_depois`;
        if (lupPendingFiles.has(keyA)) {
            URL.revokeObjectURL(lupPendingFiles.get(keyA).objectUrl);
            lupUrlsToRevoke.delete(lupPendingFiles.get(keyA).objectUrl);
            lupPendingFiles.delete(keyA);
        }
        if (lupPendingFiles.has(keyD)) {
            URL.revokeObjectURL(lupPendingFiles.get(keyD).objectUrl);
            lupUrlsToRevoke.delete(lupPendingFiles.get(keyD).objectUrl);
            lupPendingFiles.delete(keyD);
        }
    }
}

function previewLupImage(input, pos) {
    const file = input.files[0];
    pos = pos || (input.id && input.id.includes('antes') ? 'antes' : 'depois');
    if (pos === 'lup-preview-antes') pos = 'antes';
    if (pos === 'lup-preview-depois') pos = 'depois';
    const previewDiv = document.getElementById(`lup-preview-${pos}`);
    const lupId = document.getElementById('lup-id').value || 'new';
    const key = `${currentOprRecordId}_${lupId}_${pos}`;
    
    if (file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Apenas imagens JPG, PNG ou WebP são permitidas.');
            input.value = '';
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            alert('A imagem excede o tamanho máximo permitido de 5MB.');
            input.value = '';
            return;
        }
        
        if (lupPendingFiles.has(key)) {
            const oldObjUrl = lupPendingFiles.get(key).objectUrl;
            URL.revokeObjectURL(oldObjUrl);
            lupUrlsToRevoke.delete(oldObjUrl);
        }

        const objectUrl = safeCreateObjectURL(file);
        lupPendingFiles.set(key, { file, objectUrl });
        previewDiv.innerHTML = `<img src="${objectUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        if (lupPendingFiles.has(key)) {
            const oldObjUrl = lupPendingFiles.get(key).objectUrl;
            URL.revokeObjectURL(oldObjUrl);
            lupUrlsToRevoke.delete(oldObjUrl);
            lupPendingFiles.delete(key);
        }
        const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
        let ava = null;
        if (record && record.data.lupData) {
            ava = record.data.lupData.find(a => a.id === lupId);
        }
        
        let oldUrl = null;
        if (ava) {
            if (pos === 'antes') oldUrl = ava.imgAntesPreviewUrl || ava.imgAntesUrl;
            if (pos === 'depois') oldUrl = ava.imgDepoisPreviewUrl || ava.imgDepoisUrl;
        }
        
        if (oldUrl) {
            previewDiv.innerHTML = `<img src="${oldUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            previewDiv.innerHTML = '<span style="color: #94a3b8; font-size: 12px;">Sem imagem</span>';
        }
    }
}

async function salvarLUP() {
    const filial = document.getElementById('lup-filial').value;
    const depto = document.getElementById('lup-depto').value.trim();
    const dataVal = document.getElementById('lup-data').value;
    const classificacao = document.getElementById('lup-classificacao').value;
    const responsavel = document.getElementById('lup-responsavel').value.trim();
    const titulo = document.getElementById('lup-titulo').value.trim();
    const subtitulo = document.getElementById('lup-subtitulo').value.trim();
    const codigoInput = document.getElementById('lup-codigo').value.trim();
    const versao = document.getElementById('lup-versao').value.trim();
    const analise = document.getElementById('lup-analise').value.trim();
    const acao = document.getElementById('lup-acao').value.trim();
    
    if (!depto || !dataVal || !classificacao || !responsavel || !titulo) {
        alert('Por favor, preencha todos os campos obrigatórios (*).');
        return;
    }
    
    let id = document.getElementById('lup-id').value;
    const isNew = !id;
    if (isNew) id = 'lup-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2,5);

    let finalCodigo = codigoInput;

    if (isNew) {
        try {
            const filialNorm = (filial || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const metaKey = 'lup_seq_' + filialNorm;
            
            // Pesquisa de fallback em caso de falha ou desincronizacao
            let maxNumFallback = 0;
            const allMetas = await OprHistoryRepository.list();
            const filialMetas = allMetas.filter(m => m.branch === filial);
            for (const m of filialMetas) {
                if (!m.snapshotId) continue;
                const snap = await SnapshotRepository.getById(m.snapshotId);
                if (snap && snap.data && snap.data.lupData) {
                    for (const L of snap.data.lupData) {
                        if (L.codigo && typeof L.codigo === 'string') {
                            const match = L.codigo.match(/LUP-(\d+)/i);
                            if (match) {
                                const n = parseInt(match[1], 10);
                                if (n > maxNumFallback) maxNumFallback = n;
                            }
                        }
                    }
                }
            }
            const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
            if (record && record.data && record.data.lupData) {
                for (const L of record.data.lupData) {
                    if (L.codigo && typeof L.codigo === 'string') {
                        const match = L.codigo.match(/LUP-(\d+)/i);
                        if (match) {
                            const n = parseInt(match[1], 10);
                            if (n > maxNumFallback) maxNumFallback = n;
                        }
                    }
                }
            }

            // Consome atmoico do IndexedDB
            finalCodigo = await new Promise(async (resolve, reject) => {
                try {
                    const db = await SimasDB.getDB();
                    const tx = db.transaction('systemMetadata', 'readwrite');
                    const store = tx.objectStore('systemMetadata');
                    const req = store.get(metaKey);
                    let incremented = null;
                    req.onsuccess = () => {
                        let current = (req.result && typeof req.result.value === 'number') ? req.result.value : maxNumFallback;
                        if (maxNumFallback > current) current = maxNumFallback;
                        current++;
                        incremented = current;
                        store.put({ key: metaKey, value: current });
                    };
                    tx.oncomplete = () => {
                        resolve('LUP-' + String(incremented).padStart(3, '0'));
                    };
                    tx.onerror = (e) => reject(e.target.error);
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            console.error('Erro ao gerar código da LUP:', e);
            alert('Falha crítica ao gerar o código da LUP.');
            return;
        }
    }

    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;
    
    if (!record.data.lupData) record.data.lupData = [];
    
    let ava = record.data.lupData.find(a => a.id === id);
    if (!ava) {
        ava = { id, filial, uploadDate: new Date().toISOString() };
        record.data.lupData.push(ava);
    }
    
    ava.depto = depto;
    ava.data = dataVal;
    ava.classificacao = classificacao;
    ava.responsavel = responsavel;
    ava.titulo = titulo;
    ava.subtitulo = subtitulo;
    if (isNew) {
        ava.codigo = finalCodigo;
    } else {
        // Se for edio mantm original
        ava.codigo = codigoInput;
    }
    ava.versao = versao;
    ava.analise = analise;
    ava.acao = acao;

    const oldKeyA = `${currentOprRecordId}_${isNew ? 'new' : id}_antes`;
    const newKeyA = `${currentOprRecordId}_${id}_antes`;
    
    if (lupPendingFiles.has(oldKeyA)) {
        if (isNew) {
            lupPendingFiles.set(newKeyA, lupPendingFiles.get(oldKeyA));
            lupPendingFiles.delete(oldKeyA);
        }
        ava.imgAntesPending = true;
        ava.imgAntesPreviewUrl = lupPendingFiles.get(newKeyA).objectUrl;
        ava.imgAntesPendingName = lupPendingFiles.get(newKeyA).file.name;
        if (!isNew && ava.imgAntesFileId) lupDeletedFilesQueue.add(ava.imgAntesFileId);
    }
    
    const oldKeyD = `${currentOprRecordId}_${isNew ? 'new' : id}_depois`;
    const newKeyD = `${currentOprRecordId}_${id}_depois`;
    if (lupPendingFiles.has(oldKeyD)) {
        if (isNew) {
            lupPendingFiles.set(newKeyD, lupPendingFiles.get(oldKeyD));
            lupPendingFiles.delete(oldKeyD);
        }
        ava.imgDepoisPending = true;
        ava.imgDepoisPreviewUrl = lupPendingFiles.get(newKeyD).objectUrl;
        ava.imgDepoisPendingName = lupPendingFiles.get(newKeyD).file.name;
        if (!isNew && ava.imgDepoisFileId) lupDeletedFilesQueue.add(ava.imgDepoisFileId);
    }

    renderizarLUP();
    if (typeof markOprDirty === "function") markOprDirty();
    fecharModalLUP();
    if(typeof showToast === 'function') showToast('LUP salva localmente. Salve o rascunho para gravar os arquivos.', 'info');
}

function excluirLUP(id) {
    if (confirm('Tem certeza que deseja excluir esta LUP? A exclusão só será definitiva ao salvar o rascunho ou concluir.')) {
        const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
        if (!record || !record.data.lupData) return;
        
        const ava = record.data.lupData.find(a => a.id === id);
        if (ava) {
            if (ava.imgAntesFileId) lupDeletedFilesQueue.add(ava.imgAntesFileId);
            if (ava.imgDepoisFileId) lupDeletedFilesQueue.add(ava.imgDepoisFileId);
            
            const keyA = `${currentOprRecordId}_${id}_antes`;
            if (lupPendingFiles.has(keyA)) {
                URL.revokeObjectURL(lupPendingFiles.get(keyA).objectUrl);
                lupPendingFiles.delete(keyA);
            }
            const keyD = `${currentOprRecordId}_${id}_depois`;
            if (lupPendingFiles.has(keyD)) {
                URL.revokeObjectURL(lupPendingFiles.get(keyD).objectUrl);
                lupPendingFiles.delete(keyD);
            }
        }
        
        record.data.lupData = record.data.lupData.filter(a => a.id !== id);
        renderizarLUP();
    if (typeof markOprDirty === "function") markOprDirty();
    }
}

function filtrarLUP(filter) {
    currentLupFilter = filter;
    document.querySelectorAll('.lup-filter-btn').forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.style.background = '#0ea5e9';
            btn.style.color = 'white';
            btn.style.borderColor = '#0ea5e9';
        } else {
            btn.style.background = 'white';
            btn.style.color = '#64748b';
            btn.style.borderColor = '#cbd5e1';
        }
    });
    renderizarLUP();
    if (typeof markOprDirty === "function") markOprDirty();
}

function renderizarLUP() {
    if (!currentOprRecordId) return;
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;
    
    const isReadOnly = (record.status === 'Finalizado' || record.status === 'Concluído');
    
    const grid = document.getElementById('lup-grid');
    const emptyMsg = document.getElementById('lup-empty-msg');
    grid.innerHTML = '';
    
    let lups = record.data.lupData || [];
    if (currentLupFilter !== 'Todas') {
        lups = lups.filter(L => L.classificacao === currentLupFilter);
    }
    
    if (lups.length === 0) {
        if(emptyMsg) {
            grid.appendChild(emptyMsg);
            emptyMsg.style.display = 'block';
        }
        return;
    }
    
    lups.forEach(lup => {
        let badgeColor = '#64748b'; let badgeBg = '#e2e8f0';
        if (lup.classificacao === 'Básico') { badgeColor = '#0ea5e9'; badgeBg = '#e0f2fe'; }
        else if (lup.classificacao === 'Atenção') { badgeColor = '#d97706'; badgeBg = '#fef3c7'; }
        else if (lup.classificacao === 'Melhoria') { badgeColor = '#16a34a'; badgeBg = '#dcfce7'; }
    
        const card = document.createElement('div');
        card.style.background = '#ffffff';
        card.style.border = '1px solid #e2e8f0';
        card.style.borderRadius = '8px';
        card.style.overflow = 'hidden';
        card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        
        let dateStr = '';
        if (lup.data) {
            const [y,m,d] = lup.data.split('-');
            dateStr = `${d}/${m}/${y}`;
        }
        
        const urlAntes = lup.imgAntesPending ? lup.imgAntesPreviewUrl : (lup.imgAntesUrl || '');
        const urlDepois = lup.imgDepoisPending ? lup.imgDepoisPreviewUrl : (lup.imgDepoisUrl || '');
        
        card.innerHTML = `
            <div style="padding: 15px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; background: ${badgeBg}; color: ${badgeColor}; margin-bottom: 8px;">${lup.classificacao}</span>
                    <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #0B1D32;">${lup.titulo}</h4>
                    ${lup.subtitulo ? `<p style="margin: 0; font-size: 12px; color: #64748b;">${lup.subtitulo}</p>` : ''}
                </div>
                ${!isReadOnly ? `
                    <div style="display: flex; gap: 8px;" class="opr-actions-only">
                        <button data-opr-action="true" onclick="abrirModalLUP('${lup.id}')" style="background: none; border: none; color: #64748b; cursor: pointer;" title="Editar"><i class="fa-solid fa-pen"></i></button>
                        <button data-opr-action="true" onclick="excluirLUP('${lup.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer;" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                    </div>
                ` : ''}
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: #e2e8f0; height: 140px;">
                <div style="position: relative; background: #fff; cursor: pointer; overflow: hidden;" onclick="abrirLightboxLUP('${urlAntes}', '${urlDepois}', '${lup.titulo}', '${lup.imgAntesName || lup.imgAntesPendingName || 'LUP_Antes.jpg'}', '${lup.imgDepoisName || lup.imgDepoisPendingName || 'LUP_Depois.jpg'}')" title="Clique para ampliar">
                    ${urlAntes === 'MISSING' ? '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#ef4444;font-size:11px;font-weight:bold;">Imagem indisponvel</div>' : (urlAntes ? `<img src="${urlAntes}" style="width: 100%; height: 100%; object-fit: cover;">` : '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94a3b8;font-size:11px;">Sem imagem</div>')}
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(239,68,68,0.8); color: white; font-size: 10px; font-weight: 700; text-align: center; padding: 4px;">ANTERIOR</div>
                </div>
                <div style="position: relative; background: #fff; cursor: pointer; overflow: hidden;" onclick="abrirLightboxLUP('${urlAntes}', '${urlDepois}', '${lup.titulo}', '${lup.imgAntesName || lup.imgAntesPendingName || 'LUP_Antes.jpg'}', '${lup.imgDepoisName || lup.imgDepoisPendingName || 'LUP_Depois.jpg'}')" title="Clique para ampliar">
                    ${urlDepois === 'MISSING' ? '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#ef4444;font-size:11px;font-weight:bold;">Imagem indisponvel</div>' : (urlDepois ? `<img src="${urlDepois}" style="width: 100%; height: 100%; object-fit: cover;">` : '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94a3b8;font-size:11px;">Sem imagem</div>')}
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(16,185,129,0.8); color: white; font-size: 10px; font-weight: 700; text-align: center; padding: 4px;">NOVO PADRÃO</div>
                </div>
            </div>
            
            <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px; flex: 1;">
                <div>
                    <span style="font-size: 11px; font-weight: 700; color: #0B1D32; display: block; margin-bottom: 2px;">Análise:</span>
                    <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.4;">${lup.analise}</p>
                </div>
                <div>
                    <span style="font-size: 11px; font-weight: 700; color: #0B1D32; display: block; margin-bottom: 2px;">Ação/Padrão:</span>
                    <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.4;">${lup.acao}</p>
                </div>
            </div>
            
            <div style="padding: 10px 15px; border-top: 1px solid #f1f5f9; background: #f8fafc; font-size: 11px; color: #64748b; display: flex; justify-content: space-between;">
                <span><i class="fa-solid fa-user" style="margin-right: 4px;"></i> ${lup.responsavel}</span>
                <span><i class="fa-solid fa-calendar-day" style="margin-right: 4px;"></i> ${dateStr}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function abrirLightboxLUP(urlAntes, urlDepois, title, filenameAntes, filenameDepois) {
    if ((!urlAntes || urlAntes === 'null') && (!urlDepois || urlDepois === 'null')) return;
    
    document.getElementById('lup-lightbox-img-antes').src = urlAntes && urlAntes !== 'MISSING' ? urlAntes : '';
    document.getElementById('lup-lightbox-img-depois').src = urlDepois && urlDepois !== 'MISSING' ? urlDepois : '';
    
    document.getElementById('lup-lightbox-caption').textContent = title;
    
    document.getElementById('btn-download-lup-antes').style.display = urlAntes && urlAntes !== 'MISSING' ? 'flex' : 'none';
    document.getElementById('btn-download-lup-depois').style.display = urlDepois && urlDepois !== 'MISSING' ? 'flex' : 'none';
    
    document.getElementById('lup-lightbox').dataset.filenameAntes = filenameAntes;
    document.getElementById('lup-lightbox').dataset.filenameDepois = filenameDepois;
    
    document.getElementById('lup-lightbox').style.display = 'flex';
}

function fecharLightboxLUP() {
    document.getElementById('lup-lightbox').style.display = 'none';
    document.getElementById('lup-lightbox-img-antes').src = '';
    document.getElementById('lup-lightbox-img-depois').src = '';
}

function baixarImagemLUP(tipo) {
    const imgId = tipo === 'antes' ? 'lup-lightbox-img-antes' : 'lup-lightbox-img-depois';
    const src = document.getElementById(imgId).src;
    if (!src) return;
    
    const fn = tipo === 'antes' ? document.getElementById('lup-lightbox').dataset.filenameAntes : document.getElementById('lup-lightbox').dataset.filenameDepois;
    
    const a = document.createElement('a');
    a.href = src;
    a.download = fn && fn !== 'undefined' ? fn : (tipo === 'antes' ? 'LUP_Antes.jpg' : 'LUP_Depois.jpg');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ----------------------------------------------------
// INTEGRAÇÃO DE PERSISTÊNCIA ASSÍNCRONA E FILE REPOSITORY
// ----------------------------------------------------

async function prepareLupPersistence() {
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record || !record.data.lupData) return;
    
    let rollbackQueue = [];
    
    try {
        for (let ava of record.data.lupData) {
            if (ava.imgAntesPending) {
                const key = `${currentOprRecordId}_${ava.id}_antes`;
                if (lupPendingFiles.has(key)) {
                    const { file } = lupPendingFiles.get(key);
                    const fileId = await FileRepository.save(file, { oprId: currentOprRecordId, lupId: ava.id, slot: 'antes', mimeType: file.type });
                    rollbackQueue.push(fileId);
                    ava.imgAntesFileId = fileId;
                    ava.imgAntesName = file.name;
                }
            }
            if (ava.imgDepoisPending) {
                const key = `${currentOprRecordId}_${ava.id}_depois`;
                if (lupPendingFiles.has(key)) {
                    const { file } = lupPendingFiles.get(key);
                    const fileId = await FileRepository.save(file, { oprId: currentOprRecordId, lupId: ava.id, slot: 'depois', mimeType: file.type });
                    rollbackQueue.push(fileId);
                    ava.imgDepoisFileId = fileId;
                    ava.imgDepoisName = file.name;
                }
            }
        }
        return rollbackQueue;
    } catch (e) {
        console.error("Erro no upload de arquivos da LUP", e);
        for (let fileId of rollbackQueue) {
            await FileRepository.remove(fileId).catch(console.error);
        }
        throw new Error("Falha no upload dos arquivos da LUP: " + e.message);
    }
}

function getSerializableLupData() {
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record || !record.data.lupData) return undefined;
    
    return record.data.lupData.map(l => {
        let c = { ...l };
        delete c.imgAntesPending;
        delete c.imgAntesPreviewUrl;
        delete c.imgAntesPendingName;
        delete c.imgAntesUrl;
        delete c.imgDepoisPending;
        delete c.imgDepoisPreviewUrl;
        delete c.imgDepoisPendingName;
        delete c.imgDepoisUrl;
        return c;
    });
}

function finalizeLupPersistence() {
    lupDeletedFilesQueue.forEach(id => {
        FileRepository.remove(id).catch(console.error);
    });
    lupDeletedFilesQueue.clear();
    
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (record && record.data.lupData) {
        record.data.lupData.forEach(ava => {
            if (ava.imgAntesPending) {
                ava.imgAntesUrl = ava.imgAntesPreviewUrl;
                delete ava.imgAntesPending;
                delete ava.imgAntesPreviewUrl;
                delete ava.imgAntesPendingName;
            }
            if (ava.imgDepoisPending) {
                ava.imgDepoisUrl = ava.imgDepoisPreviewUrl;
                delete ava.imgDepoisPending;
                delete ava.imgDepoisPreviewUrl;
                delete ava.imgDepoisPendingName;
            }
        });
    }
    lupPendingFiles.clear();
}

async function loadLupImagesForCache(token) {
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record || !record.data.lupData) return;
    
    for (let ava of record.data.lupData) {
        if (oprOpeningSequence !== token) return;
        if (ava.imgAntesFileId && !ava.imgAntesUrl) {
            try {
                const f = await FileRepository.get(ava.imgAntesFileId);
                if (f && f.blob) ava.imgAntesUrl = safeCreateObjectURL(f.blob);
                else {
                    console.error("LUP: Imagem indisponvel. OPR:", currentOprRecordId, "Registro:", ava.id, "Slot: antes", "FileId:", ava.imgAntesFileId);
                    ava.imgAntesUrl = 'MISSING';
                }
            } catch (e) { console.error("LUP: Imagem indisponvel", e); ava.imgAntesUrl = 'MISSING'; }
        }
        if (oprOpeningSequence !== token) return;
        if (ava.imgDepoisFileId && !ava.imgDepoisUrl) {
            try {
                const f = await FileRepository.get(ava.imgDepoisFileId);
                if (f && f.blob) ava.imgDepoisUrl = safeCreateObjectURL(f.blob);
                else {
                    console.error("LUP: Imagem indisponvel. OPR:", currentOprRecordId, "Registro:", ava.id, "Slot: depois", "FileId:", ava.imgDepoisFileId);
                    ava.imgDepoisUrl = 'MISSING';
                }
            } catch (e) { console.error("LUP: Imagem indisponvel", e); ava.imgDepoisUrl = 'MISSING'; }
        }
    }
}


// --- TREINAMENTOS EXTRAS (CENTRAL DB) ---
let treinamentosExtrasDB = [];

// loadTreinamentosExtras deletada

// saveTreinamentosExtrasDB deletada

function abrirModalTreinamentoExtra() {
    if (typeof currentOprRecordId !== 'undefined' && currentOprRecordId) {
        const idx = oprHistoryDB.findIndex(x => x.id === currentOprRecordId);
        if (idx !== -1 && oprHistoryDB[idx].status === 'Concluído') {
            showToast("Relatório finalizado. Não é possível adicionar extras.", "error");
            return;
        }
    }
    document.getElementById("opr-trein-extra-id").value = "";
    document.getElementById("opr-trein-extra-tema").value = "";
    document.getElementById("opr-trein-extra-data").value = "";
    document.getElementById("opr-trein-extra-tipo").value = "";
    document.getElementById("opr-trein-extra-mod").value = "Presencial";
    document.getElementById("opr-trein-extra-resp").value = "";
    document.getElementById("opr-trein-extra-partic").value = "";
    document.getElementById("opr-trein-extra-carga").value = "";
    document.getElementById("opr-trein-extra-obs").value = "";
    
    document.getElementById("modal-treinamento-extra-opr").style.display = "flex";
}

function fecharModalTreinamentoExtra() {
    document.getElementById("modal-treinamento-extra-opr").style.display = "none";
}

async function salvarTreinamentoExtra() {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) {
        showToast("Você precisa abrir um relatório primeiro.", "error");
        return;
    }
    const idx = oprHistoryDB.findIndex(x => x.id === currentOprRecordId);
    if (idx === -1) return;
    const branch = oprHistoryDB[idx].branch;
    const anoSel = oprHistoryDB[idx].ano;

    const id = document.getElementById("opr-trein-extra-id").value;
    const tema = document.getElementById("opr-trein-extra-tema").value.trim();
    const dataRealizacao = document.getElementById("opr-trein-extra-data").value;
    const tipo = document.getElementById("opr-trein-extra-tipo").value.trim();
    const modalidade = document.getElementById("opr-trein-extra-mod").value;
    const resp = document.getElementById("opr-trein-extra-resp").value.trim();
    const partic = document.getElementById("opr-trein-extra-partic").value;
    const carga = document.getElementById("opr-trein-extra-carga").value;
    const obs = document.getElementById("opr-trein-extra-obs").value.trim();

    if (!tema || !dataRealizacao || !tipo || !modalidade || !resp || !partic || !carga) {
        showToast("Preencha todos os campos obrigatórios.", "warning");
        return;
    }

    const obj = {
        tema, dataRealizacao, tipo, modalidade, responsavel: resp, participantes: partic, cargaHoraria: carga, observacao: obs,
        filial: branch,
        ano: anoSel
    };

    if (!id) obj.id = 'extra-' + Date.now();
    else obj.id = id;
    
    try {
        await TreinamentosExtrasRepository.save(obj);
        await reloadTreinamentosRAM();
        renderizarTreinamentosDashboardOpr();
        fecharModalTreinamentoExtra();
        showToast("Treinamento extra salvo!", "success");
    } catch(e) {
        console.error(e);
        showToast("Falha ao salvar no DB.", "error");
    }
}

let chartTreinPerf, chartTreinObj, chartTreinMod;

let oprTrainingRenderSequence = 0;
async function renderizarTreinamentosDashboardOpr() {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) return;
    const idx = oprHistoryDB.findIndex(x => x.id === currentOprRecordId);
    if (idx === -1) return;
    
    const oprRecord = oprHistoryDB[idx];
    const targetBranch = oprRecord.branch || '';
    const selAno = oprRecord.ano || String(new Date().getFullYear());
    
    const currentSeq = ++oprTrainingRenderSequence;
    
    let kpiProg = 0, kpiReal = 0, kpiAtraso = 0;
    let perfProg = [0,0,0,0,0,0,0,0,0,0,0,0];
    let perfReal = [0,0,0,0,0,0,0,0,0,0,0,0];
    let perfAtraso = [0,0,0,0,0,0,0,0,0,0,0,0];
    let mapObj = {};
    let mapMod = {};
    
    let rawTrainings = [];
    try {
        const res = await DBStore.getItem("simas_trainings");
        if (Array.isArray(res)) {
            rawTrainings = res;
        }
    } catch (e) {
        console.error("Erro ao carregar simas_trainings no OPR:", e);
    }
    
    let rawExtras = [];
    try {
        rawExtras = await TreinamentosExtrasRepository.listByFilialAno(targetBranch, selAno);
    } catch (e) {
        console.error("Erro ao carregar extras no OPR:", e);
    }
    
    if (currentSeq !== oprTrainingRenderSequence) return;
    
    const normalize = str => (str || '').normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
    const normTarget = normalize(targetBranch);
    
    let curDate = new Date();
    curDate.setHours(0,0,0,0);
    
    rawTrainings.forEach(item => {
        const normFilial = normalize(item.filial || "Todas");
        if (normFilial !== "todas" && normTarget && normTarget !== 'todas' && normFilial !== normTarget && !normFilial.includes(normTarget) && !normTarget.includes(normFilial)) {
            return;
        }
        
        let anoPrevisto = null, mesPrevisto = -1;
        let anoRealizado = null, mesRealizado = -1;
        
        if (item.dataPrevista) {
            const parts = item.dataPrevista.split('-');
            anoPrevisto = parts[0];
            mesPrevisto = parseInt(parts[1], 10) - 1;
        }
        if (item.dataRealizacao || item.dataAplicacao) {
            const rData = item.dataRealizacao || item.dataAplicacao;
            const rParts = rData.split('-');
            anoRealizado = rParts[0];
            mesRealizado = parseInt(rParts[1], 10) - 1;
        }
        
        const isCompleted = !!(item.dataRealizacao || item.dataAplicacao || item.status === "Realizado" || item.status === "Concluído" || item.status === "Aprovado");
        
        if (anoPrevisto === selAno) {
            kpiProg++;
            if (mesPrevisto >= 0 && mesPrevisto <= 11) perfProg[mesPrevisto]++;
            
            // Popula os gráficos de Objetivo e Modalidade com base nos Programados daquele ano
            const tipo = String(item.tipo || '').trim();
            const modalidade = String(item.modalidade || '').trim();
            
            if (tipo) {
                mapObj[tipo] = (mapObj[tipo] || 0) + 1;
            }
            if (modalidade) {
                mapMod[modalidade] = (mapMod[modalidade] || 0) + 1;
            }
            
            if (!isCompleted) {
                const dtPrev = new Date(item.dataPrevista);
                dtPrev.setDate(dtPrev.getDate() + 1);
                dtPrev.setHours(0,0,0,0);
                if (dtPrev < curDate) {
                    kpiAtraso++;
                    if (mesPrevisto >= 0 && mesPrevisto <= 11) perfAtraso[mesPrevisto]++;
                }
            }
        }
        
        if (isCompleted && anoRealizado === selAno) {
            kpiReal++;
            if (mesRealizado >= 0 && mesRealizado <= 11) perfReal[mesRealizado]++;
        }
    });
    
    rawExtras.forEach(extra => {
        const normExtraFilial = normalize(extra.filial);
        if (normTarget && normTarget !== 'todas' && normExtraFilial !== normTarget) return;
        
        if (extra.ano === selAno) {
            kpiReal++;
            if (extra.dataRealizacao) {
                const mesReal = parseInt(extra.dataRealizacao.split('-')[1], 10) - 1;
                if (mesReal >= 0 && mesReal <= 11) perfReal[mesReal]++;
            }
            
            const tipo = String(extra.tipo || '').trim();
            const modalidade = String(extra.modalidade || '').trim();
            
            if (tipo) {
                mapObj[tipo] = (mapObj[tipo] || 0) + 1;
            }
            if (modalidade) {
                mapMod[modalidade] = (mapMod[modalidade] || 0) + 1;
            }
        }
    });
    
    const elProg = document.getElementById("opr-trein-kpi-prog");
    const elReal = document.getElementById("opr-trein-kpi-real");
    const elAtraso = document.getElementById("opr-trein-kpi-atraso");
    if (elProg) elProg.innerText = kpiProg;
    if (elReal) elReal.innerText = kpiReal;
    if (elAtraso) elAtraso.innerText = kpiAtraso;
    
    const ctxPerf = document.getElementById("chart-trein-perf");
    if (ctxPerf) {
        if (typeof chartTreinPerf !== 'undefined' && chartTreinPerf) chartTreinPerf.destroy();
        chartTreinPerf = new Chart(ctxPerf, {
            type: 'bar',
            plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}],
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                datasets: [
                    { label: 'Programado', data: perfProg, backgroundColor: '#0B1D32' },
                    { label: 'Realizado', data: perfReal, backgroundColor: '#AB2317' },
                    { label: 'Atrasado', data: perfAtraso, backgroundColor: '#4F000B' }
                ]
            },
            options: {
                scales: { x: { grid: { display: false } }, y: { grid: { display: false } } },
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                    datalabels: {
                        display: function(context) { return context.dataset.data[context.dataIndex] > 0; },
                        color: '#475569',
                        anchor: 'end',
                        align: 'end',
                        font: { weight: 'bold', size: 11 }
                    }
                },
                scales: { 
                    x: { grid: { display: false } }, 
                    y: { 
                        display: false, 
                        grid: { display: false },
                        // Adicionar um espaçamento extra para o rótulo não cortar
                        grace: '10%'
                    } 
                }
            }
        });
    }
    
    const ctxObj = document.getElementById("chart-trein-obj");
    if (ctxObj) {
        if (typeof chartTreinObj !== 'undefined' && chartTreinObj) chartTreinObj.destroy();
        let keys = Object.keys(mapObj);
        let vals = keys.map(k => mapObj[k]);
        let bg = keys.map((_, i) => ['#0B1D32', '#A30D00', '#4F000B', '#020122', '#AB2317'][i % 5]);
        if (vals.length === 0 || vals.every(v => v === 0)) {
            keys = ['Sem Treinamentos'];
            vals = [1];
            bg = ['#e2e8f0'];
        }
        chartTreinObj = new Chart(ctxObj, {
            type: 'doughnut',
            plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}],
            data: {
                labels: keys,
                datasets: [{ data: vals, backgroundColor: bg }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { 
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                    datalabels: {
                        display: function(context) { return context.dataset.data[context.dataIndex] > 0; },
                        color: '#fff',
                        font: { weight: 'bold', size: 12 }
                    }
                }
            }
        });
    }
    
    const ctxMod = document.getElementById("chart-trein-mod");
    if (ctxMod) {
        if (typeof chartTreinMod !== 'undefined' && chartTreinMod) chartTreinMod.destroy();
        let keys = Object.keys(mapMod);
        let vals = keys.map(k => mapMod[k]);
        let bgMod = keys.map((_, i) => ['#A30D00', '#0B1D32', '#AB2317', '#4F000B', '#020122'][i % 5]);
        if (vals.length === 0 || vals.every(v => v === 0)) {
            keys = ['Sem Treinamentos'];
            vals = [1];
            bgMod = ['#e2e8f0'];
        }
        chartTreinMod = new Chart(ctxMod, {
            type: 'doughnut',
            plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}],
            data: {
                labels: keys,
                datasets: [{ data: vals, backgroundColor: bgMod }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { 
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                    datalabels: {
                        display: function(context) { return context.dataset.data[context.dataIndex] > 0; },
                        color: '#fff',
                        font: { weight: 'bold', size: 12 }
                    }
                }
            }
        });
    }
}
// --- FIM TREINAMENTOS EXTRAS ---


// Initialize variables
if (typeof ncs === 'undefined') window.ncs = [];
if (typeof filteredNcs === 'undefined') window.filteredNcs = [];
if (typeof trainings === 'undefined') window.trainings = [];
if (typeof filteredTrainings === 'undefined') window.filteredTrainings = [];
if (typeof treinamentosExtrasDB === 'undefined') window.treinamentosExtrasDB = [];

if (typeof updateNcDashboard !== 'undefined') {
    setTimeout(() => {
        updateNcDashboard();
        renderNcTable();
    }, 500);
}


// ==================== CHECKPOINT 2.4 - ETAPA 1: INFRAESTRUTURA MOCK ====================

const SimasDB = (function() {
    const DB_NAME = 'SimasPOPControlDB';
    const DB_VERSION = 2;
    let dbInstance = null;

    function getDB() {
        return new Promise((resolve, reject) => {
            if (dbInstance) {
                resolve(dbInstance);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('oprHistory')) {
                    const oprStore = db.createObjectStore('oprHistory', { keyPath: 'id' });
                    oprStore.createIndex('branch', 'branch', { unique: false });
                    oprStore.createIndex('year', 'year', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('snapshots')) {
                    const snapStore = db.createObjectStore('snapshots', { keyPath: 'id' });
                    snapStore.createIndex('oprId', 'oprId', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('files')) {
                    const filesStore = db.createObjectStore('files', { keyPath: 'fileId' });
                    filesStore.createIndex('oprId', 'oprId', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('systemMetadata')) {
                    db.createObjectStore('systemMetadata', { keyPath: 'key' });
                }
                
                if (!db.objectStoreNames.contains('treinamentosExtras')) {
                    const tStore = db.createObjectStore('treinamentosExtras', { keyPath: 'id' });
                    tStore.createIndex('filial', 'filial', { unique: false });
                    tStore.createIndex('ano', 'ano', { unique: false });
                    tStore.createIndex('filialAno', ['filial', 'ano'], { unique: false });
                }
            };

            request.onsuccess = (event) => {
                dbInstance = event.target.result;
                
                dbInstance.onversionchange = () => {
                    dbInstance.close();
                    dbInstance = null;
                    console.warn("IndexedDB: Database version changed in another tab, closing connection.");
                };
                
                resolve(dbInstance);
            };

            request.onerror = (event) => {
                console.error("IndexedDB Error:", event.target.error);
                reject(event.target.error || new Error("Failed to open IndexedDB"));
            };

            request.onblocked = (event) => {
                console.warn("IndexedDB Blocked: Please close other tabs.");
                reject(new Error("IndexedDB Blocked"));
            };
        });
    }

    function runTransaction(storeName, mode, callback) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await getDB();
                const transaction = db.transaction(storeName, mode);
                const store = transaction.objectStore(storeName);
                
                let result;
                
                transaction.oncomplete = () => {
                    resolve(result);
                };
                
                transaction.onerror = (event) => {
                    reject(event.target.error);
                };
                
                transaction.onabort = (event) => {
                    reject(new Error("Transaction aborted"));
                };

                const request = callback(store);
                if (request instanceof IDBRequest) {
                    request.onsuccess = (e) => { result = e.target.result; };
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    return {
        getDB,
        runTransaction
    };
})();

// ==================== CHECKPOINT 2.5 - ETAPAS 3/4 ====================
window.TreinamentosExtrasRepository = {
    async listByFilialAno(filial, ano) {
        const db = await SimasDB.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('treinamentosExtras', 'readonly');
            const store = tx.objectStore('treinamentosExtras');
            const req = store.getAll();
            req.onsuccess = () => {
                const results = req.result.filter(r => {
                    const matchFilial = filial === 'Todas' || r.filial === filial;
                    const matchAno = String(r.ano) === String(ano);
                    return matchFilial && matchAno;
                });
                resolve(results);
            };
            req.onerror = e => reject(e.target.error);
        });
    },
    async save(record) {
        const db = await SimasDB.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('treinamentosExtras', 'readwrite');
            const store = tx.objectStore('treinamentosExtras');
            store.put(record);
            tx.oncomplete = () => resolve(true);
            tx.onerror = e => reject(e.target.error);
        });
    },
    async delete(id) {
        const db = await SimasDB.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('treinamentosExtras', 'readwrite');
            const store = tx.objectStore('treinamentosExtras');
            store.delete(id);
            tx.oncomplete = () => resolve(true);
            tx.onerror = e => reject(e.target.error);
        });
    },
    async importLegacy(records) {
        const db = await SimasDB.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['treinamentosExtras', 'systemMetadata'], 'readwrite');
            const store = tx.objectStore('treinamentosExtras');
            const metaStore = tx.objectStore('systemMetadata');

            let migratedCount = 0;
            for (const rec of records) {
                if (rec && typeof rec === 'object' && rec.id) {
                    store.put(rec);
                    migratedCount++;
                } else if (rec && typeof rec === 'object') {
                    rec.id = "MIG-" + Math.random().toString(36).substr(2, 9);
                    store.put(rec);
                    migratedCount++;
                }
            }
            
            metaStore.put({
                key: "treinamentosExtrasMigrationV1",
                status: "completed",
                migratedAt: new Date().toISOString(),
                recordsFound: records.length,
                recordsMigrated: migratedCount
            });

            tx.oncomplete = () => resolve(true);
            tx.onerror = e => reject(e.target.error);
        });
    },
    async isMigrated() {
        const db = await SimasDB.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('systemMetadata', 'readonly');
            const store = tx.objectStore('systemMetadata');
            const req = store.get('treinamentosExtrasMigrationV1');
            req.onsuccess = () => resolve(req.result && req.result.status === 'completed');
            req.onerror = e => reject(e.target.error);
        });
    }
};

async function migrateTreinamentosLegados() {
    try {
        const migrated = await TreinamentosExtrasRepository.isMigrated();
        if (migrated) return;

        const data = localStorage.getItem('simas_treinamentos_extras');
        if (!data) {
            await TreinamentosExtrasRepository.importLegacy([]);
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(data);
        } catch(e) {
            console.warn("JSON inválido no localStorage de treinamentos extras. Erro recuperável, migração abortada.");
            return;
        }

        if (!Array.isArray(parsed)) {
            console.warn("Estrutura legada inválida (não é array). Migração abortada.");
            return;
        }

        await TreinamentosExtrasRepository.importLegacy(parsed);
        localStorage.removeItem('simas_treinamentos_extras');
        console.log("Migração de treinamentos concluída:", parsed.length, "registros.");
    } catch(e) {
        console.error("Falha na migração transacional de treinamentos:", e);
    }
}

async function reloadTreinamentosRAM() {
    try {
        const b = document.getElementById("filter-branch") ? document.getElementById("filter-branch").value : 'Todas';
        const y = document.getElementById("filter-year") ? document.getElementById("filter-year").value : new Date().getFullYear();
        treinamentosExtrasDB = await TreinamentosExtrasRepository.listByFilialAno(b, y);
    } catch (e) {
        console.error("Erro reload treinamentos RAM:", e);
    }
}

const OprHistoryRepository = {
    list: async function() {
        // --- INICIO FASE C3: SINCRONIZACAO SEGURA CLOUD -> LOCAL ---
        let localRecords = [];
        try {
            localRecords = await SimasDB.runTransaction('oprHistory', 'readonly', (store) => store.getAll());
        } catch (localErr) {
            console.error("[OprHistoryRepository] Falha ao ler IndexedDB:", localErr);
            return [];
        }

        if (typeof db === 'undefined' || !db) {
            return localRecords;
        }

        try {
            
            // --- INICIO LEITURA TOMBSTONES ---
            try {
                const tombSnap = await db.collection('opr_deleted').get();
                if (!tombSnap.empty) {
                    const tombMap = new Map();
                    tombSnap.docs.forEach(doc => tombMap.set(doc.id, doc.data()));
                    
                    let remainingLocalRecords = [];
                    for (const localRec of localRecords) {
                        if (tombMap.has(localRec.id)) {
                            console.log(`[C3 Tombstone Sync] Lápide encontrada para ${localRec.id}. Removendo localmente.`);
                            const tombData = tombMap.get(localRec.id);
                            await OprHistoryRepository.remove(localRec.id);
                            if (tombData.snapshotId) {
                                await SnapshotRepository.remove(tombData.snapshotId);
                            } else if (localRec.snapshotId) {
                                await SnapshotRepository.remove(localRec.snapshotId);
                            }
                        } else {
                            remainingLocalRecords.push(localRec);
                        }
                    }
                    localRecords = remainingLocalRecords;
                }
            } catch (e) {
                console.error("[C3 Tombstone Sync] Falha ao sincronizar lápides:", e);
            }
            // --- FIM LEITURA TOMBSTONES ---

            const cloudSnap = await db.collection('opr_history').get();
            const cloudRecords = cloudSnap.docs.map(doc => doc.data());
            
            const localMap = new Map();
            localRecords.forEach(r => localMap.set(r.id, r));
            
            const cloudMap = new Map();
            cloudRecords.forEach(r => cloudMap.set(r.id, r));
            
            for (const cloudRec of cloudRecords) {
                const localRec = localMap.get(cloudRec.id);
                
                if (!localRec) {
                    // Existe apenas na nuvem -> Baixar para local
                    console.log(`[OprHistoryRepository] Inserindo registro ausente no local: ${cloudRec.id}`);
                    try {
                        await SimasDB.runTransaction('oprHistory', 'readwrite', (store) => store.add(cloudRec));
                        localRecords.push(cloudRec); // Update RAM list
                    } catch (e) {
                        console.warn(`[OprHistoryRepository] Falha ao adicionar registro ${cloudRec.id} no local:`, e);
                    }
                } else {
                    // Existe em ambos -> Comparar updatedAt
                    if (!localRec.updatedAt || !cloudRec.updatedAt) {
                        console.warn(`[OprHistoryRepository] Conflito em ${cloudRec.id} (datas ausentes). Mantendo local.`);
                        continue;
                    }
                    
                    const localTime = new Date(localRec.updatedAt).getTime();
                    const cloudTime = new Date(cloudRec.updatedAt).getTime();
                    
                    if (isNaN(localTime) || isNaN(cloudTime)) {
                        console.warn(`[OprHistoryRepository] Conflito em ${cloudRec.id} (datas invalidas). Mantendo local.`);
                        continue;
                    }
                    
                    if (cloudTime > localTime) {
                        // Nuvem e mais nova -> Atualizar local
                        console.log(`[OprHistoryRepository] Atualizando registro local com versao da nuvem: ${cloudRec.id}`);
                        try {
                            await SimasDB.runTransaction('oprHistory', 'readwrite', (store) => store.put(cloudRec));
                            // Update RAM list
                            const idx = localRecords.findIndex(r => r.id === cloudRec.id);
                            if (idx !== -1) localRecords[idx] = cloudRec;
                        } catch (e) {
                            console.warn(`[OprHistoryRepository] Falha ao atualizar registro ${cloudRec.id} no local:`, e);
                        }
                    } else if (localTime > cloudTime) {
                        console.log(`[OprHistoryRepository] Registro local mais novo que a nuvem - sincronizacao pendente: ${localRec.id}`);
                    }
                }
            }
            
            // Check for Local-Only records
            for (const localRec of localRecords) {
                if (!cloudMap.has(localRec.id)) {
                    console.log(`[OprHistoryRepository] Registro local sem correspondente na nuvem: ${localRec.id}`);
                }
            }
            
        } catch (cloudErr) {
            console.error("[OprHistoryRepository] Falha ao sincronizar com Firestore:", cloudErr);
            if (typeof showToast === 'function') {
                showToast("Histórico exibido a partir do cache local. Nuvem indisponível.", "warning");
            }
        }
        
        return localRecords;
        // --- FIM FASE C3 ---
    },
    getById: async function(id) {
        return SimasDB.runTransaction('oprHistory', 'readonly', (store) => store.get(id));
    },
    create: async function(record) {
        // --- INICIO FASE C1: DUAL WRITE DE METADADOS ---
        const result = await SimasDB.runTransaction('oprHistory', 'readwrite', (store) => store.add(record));
        if (typeof db !== 'undefined' && db) {
            try {
                const cloudPayload = JSON.parse(JSON.stringify(record));
                await db.collection('opr_history').doc(record.id.toString()).set(cloudPayload);
            } catch (cloudErr) {
                console.warn(`[OprHistoryRepository] Falha tecnica ao espelhar opr_history na nuvem (create):`, cloudErr);
                if (typeof showToast === 'function') showToast("Histórico salvo localmente. Sincronização em nuvem pendente.", "warning");
            }
        }
        return result;
        // --- FIM FASE C1 ---
    },
    update: async function(id, record) {
        // We enforce replacing exactly the same ID
        if (record.id !== id) throw new Error("ID mismatch in update");
        
        // --- INICIO FASE C1: DUAL WRITE DE METADADOS ---
        const result = await SimasDB.runTransaction('oprHistory', 'readwrite', (store) => store.put(record));
        if (typeof db !== 'undefined' && db) {
            try {
                const cloudPayload = JSON.parse(JSON.stringify(record));
                await db.collection('opr_history').doc(id.toString()).set(cloudPayload);
            } catch (cloudErr) {
                console.warn(`[OprHistoryRepository] Falha tecnica ao espelhar opr_history na nuvem (update):`, cloudErr);
                if (typeof showToast === 'function') showToast("Histórico salvo localmente. Sincronização em nuvem pendente.", "warning");
            }
        }
        return result;
        // --- FIM FASE C1 ---
    },
    remove: async function(id) {
        // NOTE: Cascade delete (snapshots and files) must be handled externally.
        return SimasDB.runTransaction('oprHistory', 'readwrite', (store) => store.delete(id));
    }
};

const SnapshotRepository = {
    listByOpr: async function(oprId) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await SimasDB.getDB();
                const tx = db.transaction('snapshots', 'readonly');
                const index = tx.objectStore('snapshots').index('oprId');
                const request = index.getAll(oprId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
            } catch (err) {
                reject(err);
            }
        });
    },
    getById: async function(id) {
        if (!id) return null; // Bloqueio defensivo para snapshotId indefinido/nulo
        // --- INICIO FASE B1: FALLBACK LOCAL-FIRST ---
        let localSnap = null;
        try {
            localSnap = await SimasDB.runTransaction('snapshots', 'readonly', (store) => store.get(id));
        } catch(e) {
            console.warn(`[SnapshotRepository] Falha ao ler IndexedDB para ${id}:`, e);
        }

        if (localSnap) {
            return localSnap;
        }

        console.log(`[SnapshotRepository] Snapshot ${id} não encontrado localmente. Tentando fallback na nuvem...`);
        
        if (typeof db !== 'undefined' && db) {
            try {
                const docRef = db.collection('opr_snapshots').doc(id.toString());
                const docSnap = await docRef.get();

                if (docSnap.exists) {
                    const cloudSnap = docSnap.data();
                    
                    // Validar estrutura basica
                    if (cloudSnap && cloudSnap.id === id && cloudSnap.data) {
                        console.log(`[SnapshotRepository] Snapshot ${id} recuperado da nuvem com sucesso. Restaurando cache local...`);
                        
                        try {
                            await SimasDB.runTransaction('snapshots', 'readwrite', (store) => store.put(cloudSnap));
                        } catch(cacheErr) {
                            console.warn(`[SnapshotRepository] Aviso: Nao foi possivel salvar o snapshot recuperado no cache local:`, cacheErr);
                        }
                        
                        return cloudSnap;
                    } else {
                        console.warn(`[SnapshotRepository] Snapshot ${id} na nuvem possui estrutura invalida.`);
                    }
                } else {
                    console.log(`[SnapshotRepository] Snapshot ${id} tambem nao existe na nuvem.`);
                }
            } catch (cloudErr) {
                console.error(`[SnapshotRepository] Falha ao consultar nuvem para ${id} (offline ou erro):`, cloudErr);
                if (typeof showToast === 'function') {
                    showToast("Não foi possível conectar à nuvem para recuperar este relatório.", "error");
                }
            }
        }
        
        return null; // Mantem comportamento nativo para quando nao encontra em nenhum lugar
        // --- FIM FASE B1 ---
    },
    create: async function(snapshot) {
        // --- INICIO FASE A: DUAL WRITE ---
        const result = await SimasDB.runTransaction('snapshots', 'readwrite', (store) => store.add(snapshot));
        if (typeof db !== 'undefined' && db) {
            try {
                const cloudPayload = JSON.parse(JSON.stringify(snapshot));
                await db.collection('opr_snapshots').doc(snapshot.id.toString()).set(cloudPayload);
            } catch (cloudErr) {
                console.warn(`[SnapshotRepository] Falha tecnica ao espelhar OPR na nuvem (create):`, cloudErr);
                if (typeof showToast === 'function') showToast("Rascunho salvo localmente. Backup na nuvem pendente.", "warning");
            }
        }
        return result;
        // --- FIM FASE A ---
    },
    update: async function(id, snapshot) {
        if (snapshot.id !== id) throw new Error("ID mismatch in update");
        
        // --- INICIO FASE A: DUAL WRITE ---
        const result = await SimasDB.runTransaction('snapshots', 'readwrite', (store) => store.put(snapshot));
        if (typeof db !== 'undefined' && db) {
            try {
                const cloudPayload = JSON.parse(JSON.stringify(snapshot));
                await db.collection('opr_snapshots').doc(id.toString()).set(cloudPayload);
            } catch (cloudErr) {
                console.warn(`[SnapshotRepository] Falha tecnica ao espelhar OPR na nuvem (update):`, cloudErr);
                if (typeof showToast === 'function') showToast("OPR salvo localmente. Backup na nuvem pendente.", "warning");
            }
        }
        return result;
        // --- FIM FASE A ---
    },
    remove: async function(id) {
        return SimasDB.runTransaction('snapshots', 'readwrite', (store) => store.delete(id));
    }
};

const OPR_FILE_CHUNK_SIZE = 700 * 1024;

async function downloadOprFileFromCloud(fileId) {
    if (!fileId || typeof db === 'undefined' || !db) return undefined;
    
    try {
        const docSnap = await db.collection('opr_files').doc(fileId.toString()).get();
        if (!docSnap.exists) return undefined;
        
        const metadata = docSnap.data();
        if (!metadata || !metadata.numChunks || !metadata.size || !metadata.type) {
            console.warn(`[Cloud Fallback] Metadados inválidos ou corrompidos para ${fileId}.`);
            return undefined;
        }

        const chunksSnap = await db.collection('opr_files').doc(fileId.toString()).collection('chunks').get();
        
        let validChunks = [];
        const indexSet = new Set();
        
        chunksSnap.forEach(doc => {
            const d = doc.data();
            if (typeof d.index === 'number' && d.index >= 0 && d.index < metadata.numChunks) {
                if (!indexSet.has(d.index)) {
                    indexSet.add(d.index);
                    validChunks.push(d);
                }
            }
        });
        
        if (validChunks.length !== metadata.numChunks) {
            console.warn(`[Cloud Fallback] Download incompleto para ${fileId}. Esperado: ${metadata.numChunks}, Recebido: ${validChunks.length}`);
            return undefined;
        }
        
        validChunks.sort((a, b) => a.index - b.index);
        
        for (let i = 0; i < metadata.numChunks; i++) {
            if (validChunks[i].index !== i) {
                console.warn(`[Cloud Fallback] Falha de sequencia de chunks para ${fileId} no indice ${i}.`);
                return undefined;
            }
        }
        
        let finalBytesArray = [];
        for (const c of validChunks) {
            if (!c.data || typeof c.data.toUint8Array !== 'function') {
                console.warn(`[Cloud Fallback] Blob Firestore inválido em chunk do arquivo ${fileId}.`);
                return undefined;
            }
            finalBytesArray.push(c.data.toUint8Array());
        }
        
        const reconstructedBlob = new Blob(finalBytesArray, { type: metadata.type });
        
        if (reconstructedBlob.size !== metadata.size) {
            console.warn(`[Cloud Fallback] Inconsistencia de tamanho final para ${fileId}. Esperado: ${metadata.size}, Recebido: ${reconstructedBlob.size}`);
            return undefined;
        }
        
        return {
            fileId: metadata.fileId || fileId,
            oprId: metadata.oprId,
            blob: reconstructedBlob,
            name: metadata.name || 'unnamed_file',
            type: metadata.type,
            size: metadata.size,
            createdAt: metadata.createdAt || new Date().toISOString(),
            metadata: {
                module: metadata.module,
                slot: metadata.slot,
                oprId: metadata.oprId
            }
        };
    } catch (err) {
        console.warn(`[Cloud Fallback] Erro de rede ou permissao ao baixar ${fileId}:`, err);
        return undefined;
    }
}

window.migrateOprFilesToFirestore = async function(options = {}) {
    const dryRun = options.dryRun !== false; // Default is true
    console.log(`=== INICIANDO MIGRAÇÃO OPR FILES === (Dry Run: ${dryRun})`);
    
    const relatorio = {
        totalLocal: 0,
        validos: 0,
        invalidos: 0,
        jaSincronizados: 0,
        candidatosUpload: 0,
        conflitosCloud: 0,
        falhas: 0,
        tamanhoTotalBytes: 0,
        arquivos: []
    };

    if (typeof SimasDB === 'undefined' || typeof db === 'undefined') {
        console.error("Banco de dados local ou nuvem não inicializado.");
        return relatorio;
    }

    try {
        const localFiles = await SimasDB.runTransaction('files', 'readonly', store => store.getAll());
        relatorio.totalLocal = localFiles.length;
        
        for (const localDoc of localFiles) {
            const { fileId, oprId, blob, name, type, size, createdAt, metadata } = localDoc;
            
            // Validação 1: Schema Mínimo
            if (!fileId || !oprId || !blob || !(blob instanceof Blob)) {
                relatorio.invalidos++;
                relatorio.arquivos.push({ fileId, oprId, name, type, size, numChunks: 0, module: 'unknown', itemId: 'unknown', slot: 'unknown', cloudStatus: "INVALIDO_LOCAL" });
                continue;
            }
            
            relatorio.validos++;
            relatorio.tamanhoTotalBytes += blob.size;
            
            // Derivar metadados
            let module = metadata?.module || 'unknown';
            let itemId = metadata?.itemId || 'unknown';
            if (metadata?.lupId) { module = 'lup'; itemId = metadata.lupId; }
            if (metadata?.melhoriaId) { module = 'melhoria'; itemId = metadata.melhoriaId; }
            const slot = metadata?.slot || 'unknown';
            
            const numChunks = Math.ceil(blob.size / OPR_FILE_CHUNK_SIZE);
            
            const arqInfo = {
                fileId, oprId, name, type: blob.type || type, size: blob.size || size, numChunks, module, itemId, slot, cloudStatus: "PENDENTE"
            };

            // Verificar Idempotência no Cloud
            let isSincronizado = false;
            let isConflito = false;
            
            try {
                const cloudDocSnap = await db.collection('opr_files').doc(fileId.toString()).get();
                if (cloudDocSnap.exists) {
                    const cData = cloudDocSnap.data();
                    let cloudValid = true;
                    if (cData.size !== blob.size || cData.numChunks !== numChunks) cloudValid = false;
                    
                    if (cloudValid) {
                        const chunksSnap = await db.collection('opr_files').doc(fileId.toString()).collection('chunks').get();
                        if (chunksSnap.size !== numChunks) {
                            cloudValid = false;
                        } else {
                            const indices = [];
                            chunksSnap.forEach(d => indices.push(d.data().index));
                            indices.sort((a,b) => a - b);
                            for (let i = 0; i < numChunks; i++) {
                                if (indices[i] !== i) cloudValid = false;
                            }
                        }
                    }
                    
                    if (cloudValid) {
                        isSincronizado = true;
                        arqInfo.cloudStatus = "JA_SINCRONIZADO";
                        relatorio.jaSincronizados++;
                    } else {
                        isConflito = true;
                        arqInfo.cloudStatus = "CONFLITO_CLOUD";
                        relatorio.conflitosCloud++;
                    }
                }
            } catch (err) {
                console.warn(`Erro ao verificar integridade Cloud do arquivo ${fileId}:`, err);
                arqInfo.cloudStatus = "ERRO_VERIFICACAO";
                relatorio.falhas++;
                relatorio.arquivos.push(arqInfo);
                continue;
            }

            if (isSincronizado) {
                // Atualizar cache local se estivermos em produção
                if (!dryRun && localDoc.syncStatus !== "synced") {
                    await SimasDB.runTransaction('files', 'readwrite', store => {
                        return store.put({ ...localDoc, syncStatus: "synced", lastSyncAttempt: new Date().toISOString(), syncError: null });
                    });
                }
                relatorio.arquivos.push(arqInfo);
                continue;
            }
            
            if (isConflito) {
                relatorio.arquivos.push(arqInfo);
                continue;
            }
            
            // Candidato a upload
            arqInfo.cloudStatus = "CANDIDATO_UPLOAD";
            relatorio.candidatosUpload++;
            
            if (dryRun) {
                relatorio.arquivos.push(arqInfo);
                continue;
            }
            
            // --- INICIO UPLOAD REAL ---
            try {
                const buffer = await blob.arrayBuffer();
                const ui8 = new Uint8Array(buffer);
                
                const batch = db.batch();
                const docRef = db.collection('opr_files').doc(fileId.toString());
                
                for (let i = 0; i < numChunks; i++) {
                    const start = i * OPR_FILE_CHUNK_SIZE;
                    const end = Math.min(start + OPR_FILE_CHUNK_SIZE, ui8.length);
                    const slice = ui8.slice(start, end);
                    
                    batch.set(docRef.collection('chunks').doc(`chunk_${i}`), {
                        index: i,
                        data: firebase.firestore.Blob.fromUint8Array(slice)
                    });
                }
                
                batch.set(docRef, {
                    fileId, oprId, name: arqInfo.name, type: arqInfo.type, size: arqInfo.size,
                    numChunks, createdAt: createdAt || new Date().toISOString(), module, itemId, slot,
                    metadata: metadata || {}
                });
                
                await batch.commit();
                
                // Validação Pós-Upload
                const posDoc = await docRef.get();
                let posValid = true;
                if (!posDoc.exists || posDoc.data().size !== blob.size || posDoc.data().numChunks !== numChunks) posValid = false;
                
                if (posValid) {
                    const posChunks = await docRef.collection('chunks').get();
                    if (posChunks.size !== numChunks) posValid = false;
                    const cIds = [];
                    posChunks.forEach(c => cIds.push(c.data().index));
                    cIds.sort((a,b) => a - b);
                    for (let i = 0; i < numChunks; i++) {
                        if (cIds[i] !== i) posValid = false;
                    }
                }
                
                if (!posValid) {
                    throw new Error("FALHA DE INTEGRIDADE POS-UPLOAD");
                }
                
                // Sucesso
                await SimasDB.runTransaction('files', 'readwrite', store => {
                    return store.put({ ...localDoc, syncStatus: "synced", lastSyncAttempt: new Date().toISOString(), syncError: null });
                });
                arqInfo.cloudStatus = "UPLOAD_SUCESSO";
                
            } catch (uploadErr) {
                console.error(`Erro no upload do arquivo ${fileId}:`, uploadErr);
                await SimasDB.runTransaction('files', 'readwrite', store => {
                    return store.put({ ...localDoc, syncStatus: "pending", lastSyncAttempt: new Date().toISOString(), syncError: uploadErr.message });
                });
                arqInfo.cloudStatus = "FALHA_UPLOAD";
                relatorio.falhas++;
            }
            
            relatorio.arquivos.push(arqInfo);
        }
        
    } catch (globalErr) {
        console.error("Erro global na migração:", globalErr);
    }
    
    console.log("=== RELATÓRIO DE MIGRAÇÃO ===");
    console.log(relatorio);
    return relatorio;
};

// ==================== MOTORES CLOUD SYNC ====================
let isSyncingFiles = false;
let isDeletingFiles = false;

async function syncOprFileToCloud(fileId) {
    try {
        const localDoc = await SimasDB.runTransaction('files', 'readonly', store => store.get(fileId));
        if (!localDoc || localDoc.deletePending) return;
        if (localDoc.syncStatus === 'synced') return;

        const { oprId, blob, name, type, size, createdAt, metadata } = localDoc;
        if (!blob) return;

        let module = metadata?.module || 'unknown';
        let itemId = metadata?.itemId || 'unknown';
        if (metadata?.lupId) { module = 'lup'; itemId = metadata.lupId; }
        if (metadata?.melhoriaId) { module = 'melhoria'; itemId = metadata.melhoriaId; }
        const slot = metadata?.slot || 'unknown';
        const numChunks = Math.ceil(blob.size / OPR_FILE_CHUNK_SIZE);

        const buffer = await blob.arrayBuffer();
        const ui8 = new Uint8Array(buffer);
        
        const batch = db.batch();
        const docRef = db.collection('opr_files').doc(fileId.toString());
        
        for (let i = 0; i < numChunks; i++) {
            const start = i * OPR_FILE_CHUNK_SIZE;
            const end = Math.min(start + OPR_FILE_CHUNK_SIZE, ui8.length);
            const slice = ui8.slice(start, end);
            batch.set(docRef.collection('chunks').doc(`chunk_${i}`), {
                index: i,
                data: firebase.firestore.Blob.fromUint8Array(slice)
            });
        }
        
        batch.set(docRef, {
            fileId, oprId, name: name || 'unnamed_file', type: blob.type || type, size: blob.size || size,
            numChunks, createdAt: createdAt || new Date().toISOString(), module, itemId, slot,
            metadata: metadata || {}
        });

        // Dupla checagem antes do commit para proteger contra corrida de Delete
        const recheckLocal = await SimasDB.runTransaction('files', 'readonly', store => store.get(fileId));
        if (!recheckLocal || recheckLocal.deletePending) {
            console.warn(`[Sync] Upload cancelado: ${fileId} entrou na fila de exclusão.`);
            return;
        }

        await batch.commit();

        const posDoc = await docRef.get();
        if (!posDoc.exists || posDoc.data().size !== blob.size) throw new Error("FALHA DE INTEGRIDADE POS-UPLOAD (PARENT)");
        const posChunks = await docRef.collection('chunks').get();
        if (posChunks.size !== numChunks) throw new Error("FALHA DE INTEGRIDADE POS-UPLOAD (CHUNKS)");

        const finalDoc = await SimasDB.runTransaction('files', 'readonly', store => store.get(fileId));
        if (finalDoc && !finalDoc.deletePending) {
            await SimasDB.runTransaction('files', 'readwrite', store => {
                return store.put({ ...finalDoc, syncStatus: 'synced', lastSyncAttempt: new Date().toISOString(), syncError: null });
            });
        }
    } catch (err) {
        console.warn(`[Sync] Erro no upload de ${fileId}:`, err);
        const failDoc = await SimasDB.runTransaction('files', 'readonly', store => store.get(fileId));
        if (failDoc && !failDoc.deletePending) {
            await SimasDB.runTransaction('files', 'readwrite', store => {
                return store.put({ ...failDoc, syncStatus: 'pending', lastSyncAttempt: new Date().toISOString(), syncError: err.message });
            });
        }
    }
}

async function syncPendingOprFiles() {
    if (isSyncingFiles || !navigator.onLine) return;
    isSyncingFiles = true;
    try {
        const localFiles = await SimasDB.runTransaction('files', 'readonly', store => store.getAll());
        for (const f of localFiles) {
            if (f.syncStatus === 'pending' && !f.deletePending) {
                await syncOprFileToCloud(f.fileId);
            }
        }
    } catch (e) {
        console.warn('[Sync Motor] Falha:', e);
    } finally {
        isSyncingFiles = false;
    }
}

async function deleteOprFileFromCloud(fileId) {
    const docRef = db.collection('opr_files').doc(fileId.toString());
    const chunksSnap = await docRef.collection('chunks').get();
    
    const batch = db.batch();
    chunksSnap.forEach(c => batch.delete(c.ref));
    batch.delete(docRef);
    
    await batch.commit();
}

async function syncPendingOprFileDeletes() {
    if (isDeletingFiles || !navigator.onLine) return;
    isDeletingFiles = true;
    try {
        const localFiles = await SimasDB.runTransaction('files', 'readonly', store => store.getAll());
        for (const f of localFiles) {
            if (f.deletePending) {
                try {
                    await deleteOprFileFromCloud(f.fileId);
                    await SimasDB.runTransaction('files', 'readwrite', store => store.delete(f.fileId));
                } catch (e) {
                    console.warn(`[DeleteSync Motor] Falha ao excluir ${f.fileId} da nuvem.`, e);
                }
            }
        }
    } catch (e) {
        console.warn('[DeleteSync Motor] Falha:', e);
    } finally {
        isDeletingFiles = false;
    }
}

window.addEventListener('online', () => {
    syncPendingOprFiles();
    syncPendingOprFileDeletes();
});
setTimeout(() => {
    syncPendingOprFiles();
    syncPendingOprFileDeletes();
}, 5000);
// ============================================================

const FileRepository = {
    save: async function(file, metadata) {
        if (!(file instanceof Blob)) {
            throw new Error("DataError: Input is not a valid Blob or File");
        }
        
        const fileId = metadata.fileId || ('file-' + Date.now() + '-' + Math.random().toString(36).substr(2,9));
        
        const record = {
            fileId: fileId,
            oprId: metadata.oprId,
            blob: file,
            name: file.name || metadata.name || 'unnamed_file',
            type: file.type || 'application/octet-stream',
            size: file.size,
            createdAt: new Date().toISOString(),
            metadata: metadata,
            syncStatus: "pending",
            lastSyncAttempt: null,
            syncError: null
        };
        
        await SimasDB.runTransaction('files', 'readwrite', (store) => store.add(record));
        
        setTimeout(() => syncOprFileToCloud(fileId), 100);
        
        return fileId;
    },
    get: async function(fileId) {
        // 1. Tentar IndexedDB primeiro (Local-First)
        const localDoc = await SimasDB.runTransaction('files', 'readonly', (store) => store.get(fileId));
        if (localDoc && localDoc.deletePending) {
            return undefined; // Aborta leitura de arquivo zumbi em fila de exclusão
        }
        if (localDoc && localDoc.blob) {
            return localDoc;
        }
        
        // 2. Não encontrou localmente -> Cloud Fallback
        const cloudDoc = await downloadOprFileFromCloud(fileId);
        if (!cloudDoc || !cloudDoc.blob) {
            return undefined;
        }
        
        // 3. Salvar no cache local para acelerar próxima leitura
        try {
            const cacheRecord = { ...cloudDoc, syncStatus: "synced" };
            await SimasDB.runTransaction('files', 'readwrite', (store) => store.add(cacheRecord));
        } catch (e) {
            console.warn(`[Cloud Fallback] Falha ao gravar cache local para ${fileId}:`, e);
        }
        
        return cloudDoc;
    },
    remove: async function(fileId) {
        const localDoc = await SimasDB.runTransaction('files', 'readonly', (store) => store.get(fileId));
        if (!localDoc) {
            // Se já não estava local, tenta limpar nuvem por segurança
            try { await deleteOprFileFromCloud(fileId); } catch(e){}
            return;
        }
        
        // Marca deleção persistente local para resistir F5 e falhas offline
        const zumbiRecord = { ...localDoc, deletePending: true, blob: null, syncStatus: "delete_pending" };
        await SimasDB.runTransaction('files', 'readwrite', (store) => store.put(zumbiRecord));
        
        setTimeout(() => syncPendingOprFileDeletes(), 100);
    }
};

// ==================== END OF CHECKPOINT 2.4 - ETAPA 1 ====================





// ==================== INTEGRAÇÃO OUVIDORIA SIMAS ====================
// Somente leitura garantida pela implementação cliente; Firestore Security Rules não puderam ser verificadas localmente.
const firebaseConfigOuvidoria = {
  apiKey: "AIzaSyDKZc-I2nba3VN8_2uDoTyDxSQEkDxyDLI",
  authDomain: "simas-ouvidoria.firebaseapp.com",
  projectId: "simas-ouvidoria",
  storageBucket: "simas-ouvidoria.firebasestorage.app",
  messagingSenderId: "718073106066",
  appId: "1:718073106066:web:8fdbe7622167039ae8204b"
};

const ouvidoriaApp = firebase.apps.find(app => app.name === 'Ouvidoria') || firebase.initializeApp(firebaseConfigOuvidoria, 'Ouvidoria');
const ouvidoriaDb = ouvidoriaApp.firestore();

const OUVIDORIA_BRANCH_MAP = {
    'São Jose dos Pinhais': 'SJP Prefeitura'
};

const OuvidoriaRepository = {
    async fetchComplaints(branch, targetYear) {
        const normalize = (str) => String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
        let filialOuvidoria = OUVIDORIA_BRANCH_MAP[branch] || branch;
        const normTarget = normalize(filialOuvidoria);

        // Otimizacao: buscar apenas do ano alvo, sem depender de match exato no banco
        const snapshot = await ouvidoriaDb.collection('complaints')
            .where('date', '>=', `${targetYear}-01-01`)
            .where('date', '<=', `${targetYear}-12-31`)
            .get();

        let results = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Filtrar localmente pela filial normalizada
            if (normalize(data.branch) === normTarget) {
                let statusVisual = "Status não mapeado";
                if (data.status === "open") statusVisual = "Não Solucionada";
                else if (data.status === "in_progress") statusVisual = "Em Tratativa";
                else if (data.status === "closed") statusVisual = "Solucionada";
                else if (data.status === "invalid") statusVisual = "Não Procede";
                else console.warn("Status não mapeado na Ouvidoria:", data.status, "ID:", doc.id);

                results.push({
                    id: doc.id,
                    data: data.date, // Formato YYYY-MM-DD
                    filial: data.branch,
                    cliente: data.name || "N/A",
                    motivo: data.category || "Outros",
                    origem: data.origin || "",
                    descricao: data.description || "",
                    statusOriginal: data.status,
                    status: statusVisual,
                    responsavel: data.manager || "Não Definido",
                    completionDate: data.completionDate || ""
                });
            }
        });
        return results;
    }
};

let qmRequestSequence = 0;
// =====================================================================
// ==================== CHECKPOINT 2.4 - ETAPA 2: HISTÓRICO LEITURA ====================

const OPR_BRANCHES = [
    { name: "Matriz", resp: "Júnia Oscarino", status: "Operante" },
    { name: "Funeas", resp: "Maria Souza", status: "Operante" },
    { name: "São Roque", resp: "Carlos Mendes", status: "Operante" },
    { name: "Sorocaba", resp: "Ana Paula", status: "Operante" },
    { name: "Contagem", resp: "Fernando Costa", status: "Operante" },
    { name: "Juatuba", resp: "Luciana Alves", status: "Operante" },
    { name: "Governador Valadares", resp: "Não Definido", status: "Operante" },
    { name: "Camaçari", resp: "Não Definido", status: "Operante" },
    { name: "São Jose dos Pinhais", resp: "Não Definido", status: "Operante" },
    { name: "Patrimonio", resp: "Não Definido", status: "Operante" }
];

try {
    const savedBranches = localStorage.getItem('simas_opr_branches');
    if (savedBranches) {
        const parsed = JSON.parse(savedBranches);
        parsed.forEach(savedB => {
            const b = OPR_BRANCHES.find(x => x.name === savedB.name);
            if (b) {
                b.resp = savedB.resp;
                b.gestor = savedB.gestor || savedB.resp;
            }
        });
    }
} catch(e) {}

var currentOprBranch = null;
var currentOprRecordId = null;

// --- INICIO AUTOSAVE OPR ---
var oprDirty = false;
var oprAutoSaveTimer = null;
var oprAutoSaveInProgress = false;
var oprAutoSaveQueued = false;
var oprDirtyVersion = 0;

function markOprDirty() {
    if (!currentOprRecordId) return;
    if (typeof oprHistoryDB === 'undefined') return;
    const memIdx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
    if (memIdx === -1 || oprHistoryDB[memIdx].status === 'Concluído' || oprHistoryDB[memIdx].status === 'Finalizado') {
        return; 
    }

    oprDirty = true;
    oprDirtyVersion++;
    updateAutosaveStatusUI('Alterações não salvas');

    if (oprAutoSaveTimer) {
        clearTimeout(oprAutoSaveTimer);
        oprAutoSaveTimer = null;
    }
    
    oprAutoSaveTimer = setTimeout(() => {
        oprAutoSaveTimer = null;
        executeAutoSave();
    }, 3000);
}

async function executeAutoSave() {
    if (oprAutoSaveInProgress) {
        oprAutoSaveQueued = true;
        return;
    }
    if (!oprDirty) return;
    
    oprAutoSaveInProgress = true;
    oprAutoSaveQueued = false;
    const currentVersion = oprDirtyVersion;
    const savingOprId = currentOprRecordId;
    updateAutosaveStatusUI('Salvando...');
    
    try {
        await persistCurrentOpr({ conclude: false, isAutoSave: true, savingOprId: savingOprId });
        
        if (oprDirtyVersion === currentVersion) {
            oprDirty = false;
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            updateAutosaveStatusUI('Salvo automaticamente às ' + hh + ':' + mm);
        } else {
            updateAutosaveStatusUI('Alterações não salvas');
            if (oprAutoSaveTimer) clearTimeout(oprAutoSaveTimer);
            oprAutoSaveTimer = setTimeout(() => {
                oprAutoSaveTimer = null;
                executeAutoSave();
            }, 3000);
        }
    } catch (e) {
        console.error('Falha no Autosave:', e);
        updateAutosaveStatusUI('Falha ao salvar automaticamente');
    } finally {
        oprAutoSaveInProgress = false;
        if (oprAutoSaveQueued) {
            executeAutoSave();
        }
    }
}

async function flushOprAutoSave() {
    if (!currentUser || !currentUser.permissions || !currentUser.permissions.edit) {
        console.warn("[OPR] Autosave ignorado por falta de permissão. Role:", currentUser ? currentUser.role : "desconhecido");
        return;
    }
    if (oprAutoSaveTimer) {
        clearTimeout(oprAutoSaveTimer);
        oprAutoSaveTimer = null;
    }
    
    if (oprDirty && !oprAutoSaveInProgress) {
        await executeAutoSave();
    }
    
    while (oprAutoSaveInProgress || oprAutoSaveQueued) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!oprAutoSaveInProgress && oprAutoSaveQueued) {
            await executeAutoSave();
        }
    }
}

function updateAutosaveStatusUI(text) {
    const el = document.getElementById('opr-autosave-status');
    if (el) {
        el.innerText = text;
        el.style.display = text ? 'inline-block' : 'none';
    }
}
// --- FIM AUTOSAVE OPR ---

var oprOpeningSequence = 0;

window.updateBranchGestor = function(branchName, val) {
    const branch = OPR_BRANCHES.find(b => b.name === branchName);
    if (branch) {
        branch.gestor = val;
        branch.resp = val;
        localStorage.setItem('simas_opr_branches', JSON.stringify(OPR_BRANCHES));
    }
    if (typeof volatileObj !== 'undefined' && typeof currentOprBranch !== 'undefined' && currentOprBranch === branchName) {
        volatileObj.responsible = val;
    }
};

function renderOprBranchSelector() {
    const grid = document.querySelector('#opr-branch-selector .branch-cards-grid');
    if (!grid) return;
    
    let html = '';
    const today = new Date().toLocaleDateString('pt-BR');
    
    OPR_BRANCHES.forEach(branch => {
        let gestor = branch.gestor || branch.resp || branch.manager || 'Não Definido';
        
        let status = branch.status || 'Operante';
        let statusColor = status === 'Operante' ? '#2ed573' : '#ff4757';
        let statusBg = status === 'Operante' ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)';
        
        html += `
            <div class="branch-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; transition: all 0.3s ease; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h3 style="margin: 0; color: #0f172a; font-size: 20px; display: flex; align-items: center; font-weight: 700;"><i class="fa-solid fa-map-location-dot" style="color: #0B1D32; margin-right: 12px; font-size: 24px;"></i>${branch.name}</h3>
                    <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid ${statusColor}40;"><i class="fa-solid fa-circle-check"></i> ${status}</span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 5px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #f1f5f9;">
                    <div style="display: flex; align-items: center; gap: 8px; color: #475569; font-size: 13px; width: 100%;">
                        <i class="fa-solid fa-user-tie" style="width: 16px; text-align: center;"></i>
                        <span style="font-weight: 600; min-width: 50px;">Gestor:</span>
                        <input type="text" value="${gestor}" oninput="updateBranchGestor('${branch.name}', this.value)" style="flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px; font-size: 13px; background: #ffffff; color: #334155; outline: none; transition: border-color 0.2s;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; color: #475569; font-size: 13px;">
                        <i class="fa-solid fa-clock-rotate-left" style="width: 16px; text-align: center;"></i>
                        <span style="font-weight: 600; min-width: 125px;">Última Atualização:</span>
                        <span>20/07/2026</span>
                    </div>
                </div>
                
                <button onclick="openOprBranch('${branch.name}')" style="margin-top: 15px; width: 100%; border: none; background: #0B1D32; color: #ffffff; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;">ACESSAR ONE PAGE <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i></button>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function openOprBranch(branchName) {

    const selector = document.getElementById('opr-branch-selector');

    const historyList = document.getElementById('opr-history-list');

    const mainContent = document.getElementById('opr-main-content');

    

    if (selector && historyList && mainContent) {

        selector.style.display = 'none';

        mainContent.style.display = 'none';

        historyList.style.display = 'block';

        

        currentOprBranch = branchName;

        

        const titleSpan = document.querySelector('#opr-history-title span');

        if (titleSpan) titleSpan.innerText = branchName;

        

        oprCurrentPage = 1;

    renderOprHistoryList();

    }

}


function confirmDiscardPendingChanges() {
    let pendingCount = 0;
    if (typeof lupPendingFiles !== 'undefined') pendingCount += lupPendingFiles.size;
    if (typeof melhoriasPendingFiles !== 'undefined') pendingCount += melhoriasPendingFiles.size;
    if (typeof lupDeletedFilesQueue !== 'undefined') pendingCount += lupDeletedFilesQueue.size;
    if (typeof melhoriasDeletedFilesQueue !== 'undefined') pendingCount += melhoriasDeletedFilesQueue.size;
    
    if (pendingCount > 0) {
        return confirm('Existem imagens pendentes ou excluses no salvas neste rascunho. Deseja sair e perder essas alteraes temporrias?');
    }
    return true;
}

function cleanupOprSession() {
    oprOpeningSequence++;
    
    if (typeof fecharLightboxLUP === 'function') fecharLightboxLUP();
    
    // Remover src e href temporarios do DOM
    document.querySelectorAll('#opr-main-content img').forEach(img => {
        if(img.src && img.src.startsWith('blob:')) img.removeAttribute('src');
    });
    document.querySelectorAll('#opr-main-content a').forEach(a => {
        if(a.href && a.href.startsWith('blob:')) a.removeAttribute('href');
    });
    
    if (typeof lupUrlsToRevoke !== 'undefined') {
        lupUrlsToRevoke.forEach(url => URL.revokeObjectURL(url));
        lupUrlsToRevoke.clear();
    }
    if (typeof melhoriasUrlsToRevoke !== 'undefined') {
        melhoriasUrlsToRevoke.forEach(url => URL.revokeObjectURL(url));
        melhoriasUrlsToRevoke.clear();
    }
    
    if (typeof lupPendingFiles !== 'undefined') lupPendingFiles.clear();
    if (typeof melhoriasPendingFiles !== 'undefined') melhoriasPendingFiles.clear();
    if (typeof lupDeletedFilesQueue !== 'undefined') lupDeletedFilesQueue.clear();
    if (typeof melhoriasDeletedFilesQueue !== 'undefined') melhoriasDeletedFilesQueue.clear();

    currentOprRecordId = null;
}

function backToOprSelector() {
    // if (!confirmDiscardPendingChanges()) return; // Removed for autosave flush
    cleanupOprSession();
    const selector = document.getElementById('opr-branch-selector');
    const historyList = document.getElementById('opr-history-list');
    const mainContent = document.getElementById('opr-main-content');
    
    if (selector && historyList && mainContent) {
        historyList.style.display = 'none';
        mainContent.style.display = 'none';
        selector.style.display = 'block';
    }
}

function backToHistoryList() {
    // if (!confirmDiscardPendingChanges()) return; // Removed for autosave flush
    cleanupOprSession();
    const historyList = document.getElementById('opr-history-list');
    const mainContent = document.getElementById('opr-main-content');
    
    if (historyList && mainContent) {
        mainContent.style.display = 'none';
        historyList.style.display = 'block';
    }
}

async function renderOprHistoryList() {

    const tbody = document.getElementById('opr-history-tbody');

    if (!tbody) return;

    

    const anoFilter = document.getElementById('opr-filter-ano').value;

    const semanaFilter = document.getElementById('opr-filter-semana').value;

    const statusFilter = document.getElementById('opr-filter-status').value;

    const searchFilter = document.getElementById('opr-filter-search').value.toLowerCase();

    const respFilterElement = document.getElementById('opr-filter-responsavel');

    const respFilter = respFilterElement ? respFilterElement.value : '';

    const historyRecords = await OprHistoryRepository.list();

    

    let filtered = historyRecords.filter(r => r.branch === currentOprBranch);



    const branchReports = historyRecords.filter(r => r.branch === currentOprBranch);

    const total = branchReports.length;

    const finalizados = branchReports.filter(r => r.status === 'Concluído').length;

    const edicao = branchReports.filter(r => r.status === 'Rascunho').length;

    const revisados = branchReports.filter(r => r.status === 'Revisado').length;

    

    const elTotal = document.getElementById('opr-stat-total');

    const elFin = document.getElementById('opr-stat-finalizados');

    const elEd = document.getElementById('opr-stat-edicao');

    const elRev = document.getElementById('opr-stat-revisados');

    

    if (elTotal) elTotal.innerText = total;

    if (elFin) elFin.innerText = finalizados;

    if (elEd) elEd.innerText = edicao;

    if (elRev) elRev.innerText = revisados;



    

    if (anoFilter) filtered = filtered.filter(r => r.year.toString() === anoFilter);

    if (semanaFilter) filtered = filtered.filter(r => r.week.toString() === semanaFilter);

    if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter);

    if (respFilter) filtered = filtered.filter(r => r.responsible === respFilter);

    if (searchFilter) filtered = filtered.filter(r => 

        (r.responsible && r.responsible.toLowerCase().includes(searchFilter)) || 

        (r.id && r.id.toLowerCase().includes(searchFilter))

    );

    

    // Sort from newest to oldest

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    

    let html = '';

    

    

    const emptyState = document.getElementById('opr-empty-state');

    const tableContainer = document.querySelector('#opr-history-list .table-responsive');

    const paginationContainer = document.getElementById('opr-pagination-container');

    

    if (filtered.length === 0) {

        if (emptyState) emptyState.style.display = 'flex';

        if (tableContainer) tableContainer.style.display = 'none';

        if (paginationContainer) paginationContainer.style.display = 'none';

        

        tbody.innerHTML = '';

        

        // Also update dropdowns even if empty

        const anos = [...new Set(historyRecords.map(r => r.year))].sort((a, b) => b - a);

        const selAno = document.getElementById('opr-filter-ano');

        if (selAno && selAno.options.length <= 1) {

            let optHtml = '<option value="">Todos</option>';

            anos.forEach(a => optHtml += `<option value="${a}">${a}</option>`);

            selAno.innerHTML = optHtml;

        }

        return;

    } else {

        if (emptyState) emptyState.style.display = 'none';

        if (tableContainer) tableContainer.style.display = 'block';

        if (paginationContainer) paginationContainer.style.display = 'flex';

    }



    const totalItems = filtered.length;

    const totalPages = Math.ceil(totalItems / oprItemsPerPage);

    if (oprCurrentPage > totalPages) oprCurrentPage = totalPages;

    if (oprCurrentPage < 1) oprCurrentPage = 1;

    

    const startIndex = (oprCurrentPage - 1) * oprItemsPerPage;

    const endIndex = Math.min(startIndex + oprItemsPerPage, totalItems);

    

    const paginatedItems = filtered.slice(startIndex, endIndex);

    

    const elStart = document.getElementById('opr-page-info-start');

    const elEnd = document.getElementById('opr-page-info-end');

    const elTotalItems = document.getElementById('opr-page-info-total');

    const btnPrev = document.getElementById('opr-btn-prev');

    const btnNext = document.getElementById('opr-btn-next');

    

    if (elStart) elStart.innerText = startIndex + 1;

    if (elEnd) elEnd.innerText = endIndex;

    if (elTotalItems) elTotalItems.innerText = totalItems;

    

    if (btnPrev) {

        btnPrev.disabled = oprCurrentPage === 1;

        btnPrev.style.opacity = btnPrev.disabled ? '0.5' : '1';

        btnPrev.style.cursor = btnPrev.disabled ? 'not-allowed' : 'pointer';

    }

    if (btnNext) {

        btnNext.disabled = oprCurrentPage === totalPages;

        btnNext.style.opacity = btnNext.disabled ? '0.5' : '1';

        btnNext.style.cursor = btnNext.disabled ? 'not-allowed' : 'pointer';

    }



    if (true) {



        paginatedItems.forEach(r => {

            let statusBadge = '';

            let bg, color, icon, label;

            

            const st = r.status.toLowerCase();

            if (st === 'concluído' || st === 'finalizado') {

                bg = 'rgba(11, 29, 50, 0.08)'; color = '#0B1D32'; icon = 'fa-check-circle'; label = 'Finalizado';

            } else if (st === 'rascunho' || st === 'em edição') {

                bg = 'rgba(171, 35, 23, 0.08)'; color = '#AB2317'; icon = 'fa-pen-to-square'; label = 'Em edição';

            } else if (st === 'revisado') {

                bg = 'rgba(2, 1, 34, 0.08)'; color = '#020122'; icon = 'fa-clipboard-check'; label = 'Revisado';

            } else if (st === 'bloqueado') {

                bg = 'rgba(163, 13, 0, 0.08)'; color = '#A30D00'; icon = 'fa-lock'; label = 'Bloqueado';

            } else {

                bg = 'rgba(11, 29, 50, 0.08)'; color = '#0B1D32'; icon = 'fa-info-circle'; label = r.status;

            }

            

            statusBadge = `<span style="display: inline-flex; align-items: center; justify-content: center; background: ${bg}; color: ${color}; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; border: 1px solid ${color}; min-width: 100px;"><i class="fa-solid ${icon}" style="margin-right: 6px;"></i> ${label}</span>`;

                

            const obs = r.notes ? r.notes : (r.data && r.data.obs ? r.data.obs : '-');

            const truncatedObs = obs.length > 50 ? obs.substring(0, 50) + '...' : obs;



            html += `

                <tr>

                    <td style="text-align: center; font-weight: 700; color: #020122;">${r.week}</td>

                    <td style="text-align: center;">${r.year}</td>

                    <td><i class="fa-regular fa-calendar" style="color: #9ca3af; margin-right: 5px;"></i> ${new Date(r.createdAt).toLocaleDateString('pt-BR')}</td>

                    <td style="font-weight: 500;"><i class="fa-solid fa-user-tie" style="color: #0B1D32; margin-right: 6px;"></i> ${r.createdBy || r.responsible || '-'}</td>

                    <td style="text-align: center;">${statusBadge}</td>

                    <td><i class="fa-solid fa-clock-rotate-left" style="color: #9ca3af; margin-right: 5px;"></i> ${new Date(r.updatedAt).toLocaleDateString('pt-BR')} às ${new Date(r.updatedAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>

                    <td style="color: #666; font-style: ${obs === '-' ? 'italic' : 'normal'};" title="${obs}">${truncatedObs}</td>

                    <td style="text-align: right; white-space: nowrap;">

                        <div style="display: flex; gap: 8px; justify-content: flex-end;">

                                                        <button onclick="viewOpr('${r.id}')" onmouseover="this.style.background='#0B1D32'; this.style.color='#ffffff';" onmouseout="this.style.background='#ffffff'; this.style.color='#0B1D32';" title="Visualizar" style="width: 32px; height: 32px; border-radius: 6px; border: 1px solid #edf2f7; background: #ffffff; color: #0B1D32; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;"><i class="fa-solid fa-eye"></i></button>

                            ${(currentUser && currentUser.permissions && currentUser.permissions.edit) ? `
                            <button onclick="viewOpr('${r.id}')" onmouseover="this.style.background='#0B1D32'; this.style.color='#ffffff';" onmouseout="this.style.background='#ffffff'; this.style.color='#0B1D32';" title="Editar" style="width: 32px; height: 32px; border-radius: 6px; border: 1px solid #edf2f7; background: #ffffff; color: #0B1D32; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="duplicateOpr('${r.id}')" onmouseover="this.style.background='#0B1D32'; this.style.color='#ffffff';" onmouseout="this.style.background='#ffffff'; this.style.color='#0B1D32';" title="Duplicar" style="width: 32px; height: 32px; border-radius: 6px; border: 1px solid #edf2f7; background: #ffffff; color: #0B1D32; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;"><i class="fa-solid fa-copy"></i></button>
                            ` : ''}

                            ${(currentUser && currentUser.permissions && currentUser.permissions.delete) ? `
                            <button onclick="deleteOpr('${r.id}')" style="background: transparent; border: 1px solid #cbd5e1; color: #A30D00; padding: 6px 10px; border-radius: 6px; cursor: pointer; transition: 0.2s;" title="Apagar One Page" onmouseover="this.style.background='#fef2f2'; this.style.borderColor='#fecaca'" onmouseout="this.style.background='transparent'; this.style.borderColor='#cbd5e1'"><i class="fa-solid fa-trash"></i></button>
                            ` : ''}

                            <button onclick="exportOprPdf('${r.id}')" onmouseover="this.style.background='#A30D00'; this.style.color='#ffffff';" onmouseout="this.style.background='#ffffff'; this.style.color='#A30D00';" title="Exportar PDF" style="width: 32px; height: 32px; border-radius: 6px; border: 1px solid #edf2f7; background: #ffffff; color: #A30D00; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;"><i class="fa-solid fa-file-pdf"></i></button>

                        </div>

                    </td>

                </tr>

            `;

        });

    }

    

    tbody.innerHTML = html;

    

    // Atualiza dropdown de anos

    const anos = [...new Set(oprHistoryDB.map(r => r.year))].sort((a, b) => b - a);

    const selAno = document.getElementById('opr-filter-ano');

    if (selAno && selAno.options.length <= 1) {

        let optHtml = '<option value="">Todos</option>';

        anos.forEach(a => optHtml += `<option value="${a}">${a}</option>`);

        selAno.innerHTML = optHtml;

    }

    

    // Atualiza dropdown de responsáveis dinamicamente baseado na filial

    

    if (respFilterElement) {

        const uniqueResponsaveis = [...new Set(branchReports.map(r => r.responsible).filter(Boolean))].sort();

        const currentSelectedResp = respFilterElement.value;

        

        let optHtmlResp = '<option value="">Todos os Responsáveis</option>';

        uniqueResponsaveis.forEach(resp => {

            optHtmlResp += `<option value="${resp}">${resp}</option>`;

        });

        respFilterElement.innerHTML = optHtmlResp;

        

        if (uniqueResponsaveis.includes(currentSelectedResp)) {

            respFilterElement.value = currentSelectedResp;

        }

    }

}


// ==================== CHECKPOINT 2.4 - ETAPA 4: CICLO DO OPR ====================

const CP24_ETAPA4_COLLECTORS = {
    cincoS: () => {
        const mem = oprHistoryDB.find(r => r.id === currentOprRecordId);
        return mem && mem.data && mem.data.cincoSData ? JSON.parse(JSON.stringify(mem.data.cincoSData)) : [];
    },
    cruzVerdes: () => {
        const mem = oprHistoryDB.find(r => r.id === currentOprRecordId);
        return mem && mem.data && mem.data.cruzVerdes ? JSON.parse(JSON.stringify(mem.data.cruzVerdes)) : [];
    },
    piramide: () => {
        const mem = oprHistoryDB.find(r => r.id === currentOprRecordId);
        return mem && mem.data && mem.data.piramide ? JSON.parse(JSON.stringify(mem.data.piramide)) : {};
    },
    topProblemas: () => {
        const mem = oprHistoryDB.find(r => r.id === currentOprRecordId);
        const branch = mem ? mem.branch : currentOprBranch;
        const recYear = mem && mem.createdAt ? new Date(mem.createdAt).getFullYear().toString() : new Date().getFullYear().toString();
        
        let dbProbs = (typeof topProblemasDB !== 'undefined' ? topProblemasDB : [])
            .filter(p => p.filial === branch && p.ano === recYear && p.status !== 'Concluído');
            
        const critRank = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
        dbProbs.sort((a, b) => {
            if (critRank[a.criticidade] !== critRank[b.criticidade]) {
                return critRank[b.criticidade] - critRank[a.criticidade];
            }
            return new Date(a.dataAbertura) - new Date(b.dataAbertura);
        });
        
        return JSON.parse(JSON.stringify(dbProbs.slice(0, 3)));
    },
    seguranca: () => {
        const mem = oprHistoryDB.find(r => r.id === currentOprRecordId);
        return mem && mem.data ? (mem.data.acidentes || []) : [];
    },
    empilhadeiras: () => {
        const mem = oprHistoryDB.find(r => r.id === currentOprRecordId);
        return mem && mem.data ? (mem.data.empilhadeiras || []) : [];
    },
    aguaEmpilhadeiras: () => {
        const mem = oprHistoryDB.find(r => r.id === currentOprRecordId);
        return mem && mem.data && mem.data.aguaEmpilhadeiras ? JSON.parse(JSON.stringify(mem.data.aguaEmpilhadeiras)) : {};
    },
    agua: () => {
        const mem = oprHistoryDB.find(r => r.id === currentOprRecordId);
        return mem && mem.data ? (mem.data.aguaParams || null) : null;
    },
    
    nc: () => {
        const mes = document.getElementById('nc-month') ? document.getElementById('nc-month').value : '';
        const ano = document.getElementById('nc-year') ? document.getElementById('nc-year').value : new Date().getFullYear();
        return { mes, ano };
    },
    licencas: () => {
            const mem = oprHistoryDB.find(r => r.id === currentOprRecordId);
            return mem && mem.data && mem.data.licencasData ? JSON.parse(JSON.stringify(mem.data.licencasData)) : undefined;
        },
        lup: () => {
            return getSerializableLupData();
        },
        melhorias: () => {
            return getSerializableMelhoriasData();
        },
    treinamentos: () => {
        const kpiProg = document.getElementById('treinamento-anual-prog') ? document.getElementById('treinamento-anual-prog').innerText : '0';
        const kpiReal = document.getElementById('treinamento-anual-real') ? document.getElementById('treinamento-anual-real').innerText : '0';
        const kpiAtraso = document.getElementById('treinamento-anual-atraso') ? document.getElementById('treinamento-anual-atraso').innerText : '0';
        const perfProg = document.getElementById('treinamento-mensal-prog') ? document.getElementById('treinamento-mensal-prog').innerText : '0';
        const perfReal = document.getElementById('treinamento-mensal-real') ? document.getElementById('treinamento-mensal-real').innerText : '0';
        return {
            indicadoresAnuais: { programados: kpiProg, realizados: kpiReal, atrasados: kpiAtraso },
            dadosMensais: { programados: perfProg, realizados: perfReal }
        };
    }
};

async function createNewOpr() {
    if (!currentUser || !currentUser.permissions || !currentUser.permissions.create) {
        showToast("Você não tem permissão para criar One Page Reports.", "error");
        console.warn("[OPR] Criação bloqueada por permissão. Role: " + (currentUser ? currentUser.role : "desconhecido"));
        return;
    }
    if (!currentOprBranch) {
        alert("Nenhuma filial selecionada.");
        return;
    }
    
    if (!confirm('Confirma a criação de um novo One Page Report para a filial ' + currentOprBranch + '?')) {
        return;
    }
    
    const today = new Date();
    const newId = 'opr-' + Date.now();
    const newSnapId = 'snap-' + Date.now();
    let respName = 'Não Definido';
    const b = OPR_BRANCHES.find(x => x.name === currentOprBranch);
    if (b) {
        respName = b.gestor || b.resp || b.manager || 'Não Definido';
    }

    const initialSnapshot = {
        id: newSnapId,
        oprId: newId,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
        version: 1,
        data: {}
    };

    const initialMetadata = {
        id: newId,
        branch: currentOprBranch,
        week: getWeekNumber(today),
        year: today.getFullYear(),
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
        responsible: respName,
        status: 'Rascunho',
        snapshotId: newSnapId,
        createdBy: currentUser && currentUser.name ? currentUser.name : 'Desconhecido',
        createdByEmail: currentUser && currentUser.email ? currentUser.email : '',
        createdByUid: currentUser && currentUser.uid ? currentUser.uid : ''
    };

    let licencasHerdadas = [];
    let empilhadeirasHerdadas = [];
    let piramideHerdada = {};
    let cruzHerdada = [];
    let aguaEmpilhadeirasHerdada = {};
    
    try {
        const history = await OprHistoryRepository.list();
        // Ordenacao deterministica decrescente por data de criacao
        const branchOprs = history.filter(r => r.branch === currentOprBranch).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        let targetOpr = null;
        let snap = null;

        async function resolveSnapshot(opr) {
            let candidate = null;
            if (opr.snapshotId) candidate = await SnapshotRepository.getById(opr.snapshotId);
            if (!candidate) {
                const allSnaps = await SnapshotRepository.listByOpr(opr.id);
                if (allSnaps && allSnaps.length > 0) {
                    allSnaps.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
                    candidate = allSnaps[0];
                }
            }
            return candidate;
        }

        // Prioridade 1: Finalizados / Concluidos
        for (const opr of branchOprs) {
            if (opr.status === 'Finalizado' || opr.status === 'Concluído' || opr.status === 'Concludo') {
                snap = await resolveSnapshot(opr);
                if (snap) { targetOpr = opr; break; }
            }
        }

        // Prioridade 2: Rascunhos
        if (!targetOpr) {
            for (const opr of branchOprs) {
                if (opr.status === 'Rascunho') {
                    snap = await resolveSnapshot(opr);
                    if (snap) { targetOpr = opr; break; }
                }
            }
        }
        
        if (targetOpr && snap) {
            console.log(`[HERANÇA OPR] Origem selecionada: ${targetOpr.id}`);
            console.log(`[HERANÇA OPR] Snapshot recuperado: ${snap.id}`);

            // 1. Heranca de Licencas (legado mantido intocado)
            if (snap.data && snap.data.licencasData) {
                let rawCopy = null;
                if (typeof structuredClone === 'function') {
                    rawCopy = structuredClone(snap.data.licencasData);
                } else {
                    rawCopy = JSON.parse(JSON.stringify(snap.data.licencasData));
                }
                
                licencasHerdadas = rawCopy.filter(l => l.status === 'Ativa').map(l => {
                    const newLic = {...l};
                    if (!newLic.origemLicencaId) {
                        newLic.origemLicencaId = l.id; 
                    }
                    newLic.id = 'lic-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
                    return newLic;
                });
                console.log(`[HERANÇA OPR] Licenças herdadas: ${licencasHerdadas.length}`);
            }

            // 2. Heranca de Empilhadeiras (FASE B)
            if (snap.data && snap.data.empilhadeiras && Array.isArray(snap.data.empilhadeiras)) {
                if (typeof structuredClone === 'function') {
                    empilhadeirasHerdadas = structuredClone(snap.data.empilhadeiras);
                } else {
                    empilhadeirasHerdadas = JSON.parse(JSON.stringify(snap.data.empilhadeiras));
                }
                console.log(`[HERANÇA OPR] Empilhadeiras herdadas: ${empilhadeirasHerdadas.length}`);
            }
            
            // 3. Heranca da Piramide
            if (snap.data && snap.data.piramide) {
                if (typeof structuredClone === 'function') {
                    piramideHerdada = structuredClone(snap.data.piramide);
                } else {
                    piramideHerdada = JSON.parse(JSON.stringify(snap.data.piramide));
                }
            }
            
            // Controle Temporal: Mesma competencia
            const newOprDate = new Date();
            const oldOprDate = new Date(targetOpr.createdAt || 0);
            const isMesmoMes = (newOprDate.getFullYear() === oldOprDate.getFullYear() && newOprDate.getMonth() === oldOprDate.getMonth());
            console.log(`[HERANÇA OPR] Mesmo mês: ${isMesmoMes}`);

            // 4. Heranca da Cruz de Seguranca
            if (snap.data && snap.data.cruzVerdes && targetOpr.createdAt) {
                if (isMesmoMes) {
                    if (typeof structuredClone === 'function') cruzHerdada = structuredClone(snap.data.cruzVerdes);
                    else cruzHerdada = JSON.parse(JSON.stringify(snap.data.cruzVerdes));
                    console.log(`[HERANÇA OPR] Cruz herdada: true`);
                } else {
                    console.log(`[HERANÇA OPR] Cruz herdada: false`);
                }
            }
            
            // 5. Heranca da Agua Global
            if (snap.data && snap.data.aguaEmpilhadeiras && targetOpr.createdAt) {
                if (isMesmoMes) {
                    if (typeof structuredClone === 'function') aguaEmpilhadeirasHerdada = structuredClone(snap.data.aguaEmpilhadeiras);
                    else aguaEmpilhadeirasHerdada = JSON.parse(JSON.stringify(snap.data.aguaEmpilhadeiras));
                    console.log(`[HERANÇA OPR] Água empilhadeiras herdada: true`);
                } else {
                    console.log(`[HERANÇA OPR] Água empilhadeiras herdada: false`);
                }
            }
        }
    } catch(e) {
        console.error("Falha ao processar heranças no createNewOpr:", e);
    }
    
    initialSnapshot.data.licencasData = licencasHerdadas;
    initialSnapshot.data.empilhadeiras = empilhadeirasHerdadas;
    initialSnapshot.data.piramide = piramideHerdada;
    initialSnapshot.data.cruzVerdes = cruzHerdada;
    initialSnapshot.data.aguaEmpilhadeiras = aguaEmpilhadeirasHerdada;

    try {
        await SnapshotRepository.create(initialSnapshot);
    } catch (e) {
        console.error("Falha ao criar snapshot inicial:", e);
        if(typeof showToast === 'function') showToast("Erro: Falha ao criar snapshot.", "error");
        return;
    }

    try {
        await OprHistoryRepository.create(initialMetadata);
    } catch (e) {
        console.error("Falha ao criar metadados do OPR. Rollback...", e);
        await SnapshotRepository.remove(newSnapId);
        if(typeof showToast === 'function') showToast("Erro ao criar OPR. Rollback executado.", "error");
        return;
    }

    currentOprRecordId = newId;

    const volatileObj = {
        id: initialMetadata.id,
        branch: initialMetadata.branch,
        week: initialMetadata.week,
        year: initialMetadata.year,
        createdAt: initialMetadata.createdAt,
        updatedAt: initialMetadata.updatedAt,
        responsible: initialMetadata.responsible,
        status: initialMetadata.status,
        data: JSON.parse(JSON.stringify(initialSnapshot.data))
    };
    
    if (typeof oprHistoryDB === 'undefined') window.oprHistoryDB = [];
    const idx = oprHistoryDB.findIndex(r => r.id === newId);
    if(idx !== -1) oprHistoryDB[idx] = volatileObj;
    else oprHistoryDB.push(volatileObj);

    openOprForm(newId);
}

async function persistCurrentOpr(options = { conclude: false, isAutoSave: false, savingOprId: null }) {
    if (!currentUser || !currentUser.permissions) return;
    if (options.conclude) {
        if (!currentUser.permissions.validate) {
            console.warn("[OPR] Persistência (Concluir) bloqueada. Role:", currentUser.role);
            return;
        }
    } else {
        if (!currentUser.permissions.edit) {
            console.warn("[OPR] Persistência (Editar/Autosave) bloqueada. Role:", currentUser.role);
            return;
        }
    }
    const targetId = options.savingOprId || currentOprRecordId;
    if (!targetId) {
        console.error("ID não definido na persistência.");
        return;
    }
    
    

    // --- PREFLIGHT TOMBSTONE ---
    if (typeof db !== 'undefined' && db) {
        try {
            const tombDoc = await db.collection('opr_deleted').doc(targetId.toString()).get();
            if (tombDoc.exists) {
                console.warn(`[Anti-Ressurreição] OPR ${targetId} possui tombstone. Persistência bloqueada.`);
                alert("Este One Page Report foi excluído em outro acesso e não pode mais ser salvo.");
                if (typeof oprDirty !== 'undefined') oprDirty = false;
                if (typeof oprAutoSaveInProgress !== 'undefined') oprAutoSaveInProgress = false;
                if (typeof oprAutoSaveTimer !== 'undefined' && oprAutoSaveTimer) clearTimeout(oprAutoSaveTimer);
                return;
            }
        } catch (e) {
            console.error("Erro ao checar tombstone:", e);
        }
    }
    // ---------------------------
let meta = null;
    let snap = null;

    try {
        meta = await OprHistoryRepository.getById(targetId);
        if (!meta) throw new Error("Metadados não encontrados.");
        if (!meta.snapshotId) throw new Error("snapshotId não existe nos metadados.");

        snap = await SnapshotRepository.getById(meta.snapshotId);
        if (!snap) throw new Error("Snapshot relacionado não encontrado.");
        if (snap.oprId !== meta.id) throw new Error("Vínculo oprId divergente.");
    } catch (e) {
        console.error("Falha de validação pré-salvamento:", e);
        alert("Falha de integridade: " + e.message);
        return;
    }

    let newData = {};
    try {
        newData.acidentes = CP24_ETAPA4_COLLECTORS.seguranca();
        newData.empilhadeiras = CP24_ETAPA4_COLLECTORS.empilhadeiras();
        newData.aguaEmpilhadeiras = CP24_ETAPA4_COLLECTORS.aguaEmpilhadeiras();
        newData.aguaParams = CP24_ETAPA4_COLLECTORS.agua();
        newData.ncSnapshot = CP24_ETAPA4_COLLECTORS.nc();
        newData.treinamentoSnapshot = CP24_ETAPA4_COLLECTORS.treinamentos();
        newData.licencasData = CP24_ETAPA4_COLLECTORS.licencas();
        newData.topProblemasSnapshot = CP24_ETAPA4_COLLECTORS.topProblemas();
        newData.cincoSData = CP24_ETAPA4_COLLECTORS.cincoS();
        newData.cruzVerdes = CP24_ETAPA4_COLLECTORS.cruzVerdes();
        newData.piramide = CP24_ETAPA4_COLLECTORS.piramide();
        
        // --- INÍCIO MELHORIAS PERSISTÊNCIA ---
        let melhoriasRollbackQueue = [];
        if (typeof prepareMelhoriasPersistence === 'function') {
            melhoriasRollbackQueue = await prepareMelhoriasPersistence();
            newData.melhoriasData = CP24_ETAPA4_COLLECTORS.melhorias();
        }
        // --- FIM MELHORIAS PERSISTÊNCIA ---
        
        // --- INÍCIO LUP PERSISTÊNCIA ---
        let lupRollbackQueue = [];
        if (typeof prepareLupPersistence === 'function') {
            lupRollbackQueue = await prepareLupPersistence();
            newData.lupData = CP24_ETAPA4_COLLECTORS.lup();
        }
        // --- FIM LUP PERSISTÊNCIA ---

    } catch(e) {
        console.error("Falha fatal na coleta de dados:", e);
        alert("Erro na coleta de módulos: " + e.message);
        return;
    }

    const backupSnapData = JSON.parse(JSON.stringify(snap.data));
    const backupSnapUpdate = snap.updatedAt;

    const todayIso = new Date().toISOString();
    snap.data = newData;
    snap.updatedAt = todayIso;
    
    meta.updatedAt = todayIso;
    if (typeof volatileObj !== 'undefined' && volatileObj.responsible) {
        meta.responsible = volatileObj.responsible;
    }
    if (options.conclude) {
        meta.status = 'Concluído';
    }

    try {
        await SnapshotRepository.update(snap.id, snap);
    } catch (e) {
        console.error("Erro no update do snapshot:", e);
        alert("Falha ao salvar snapshot.");
        return;
    }

    try {
        await OprHistoryRepository.update(meta.id, meta);
    } catch (e) {
        console.error("Erro no update dos metadados. Rollback do snapshot necessário.", e);
        snap.data = backupSnapData;
        snap.updatedAt = backupSnapUpdate;
        try {
            await SnapshotRepository.update(snap.id, snap);
        } catch(rollbackErr) {
            console.error("FALHA DE ROLLBACK NO SNAPSHOT:", rollbackErr);
        }
        alert("Erro ao salvar metadados. Modificações canceladas.");
        return;
    }

    const memIdx = oprHistoryDB.findIndex(r => r.id === targetId);
    if(memIdx !== -1) {
        oprHistoryDB[memIdx].data = JSON.parse(JSON.stringify(newData));
        oprHistoryDB[memIdx].updatedAt = meta.updatedAt;
        oprHistoryDB[memIdx].status = meta.status;
    }

    if (options.conclude) {
        if(typeof showToast === 'function') showToast("Relatório Concluído com sucesso!", "success");
        if (typeof finalizeLupPersistence === 'function') finalizeLupPersistence();
        if (typeof finalizeMelhoriasPersistence === 'function') finalizeMelhoriasPersistence();
        cancelOprEdit();
    } else {
        if(!options.isAutoSave && typeof showToast === "function") showToast("Rascunho salvo com sucesso!", "success");
        if (typeof finalizeLupPersistence === 'function') finalizeLupPersistence();
        if (typeof finalizeMelhoriasPersistence === 'function') finalizeMelhoriasPersistence();
    }
}

async function saveCurrentOpr() {
    if (!currentUser || !currentUser.permissions || !currentUser.permissions.edit) {
        showToast("Você não tem permissão para editar One Page Reports.", "error");
        console.warn("[OPR] Salvamento bloqueado por permissão. Role:", currentUser ? currentUser.role : "desconhecido");
        return;
    } 
    if (typeof flushOprAutoSave === 'function') await flushOprAutoSave();
    try {
        await persistCurrentOpr({ conclude: false });
        if (typeof oprDirty !== 'undefined') oprDirty = false;
        if (typeof oprAutoSaveQueued !== 'undefined') oprAutoSaveQueued = false;
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        if (typeof updateAutosaveStatusUI === 'function') updateAutosaveStatusUI('Salvo às ' + hh + ':' + mm);
    } catch(e) {
        console.error(e);
    }
}

async function concludeCurrentOpr() {
    if (!currentUser || !currentUser.permissions || !currentUser.permissions.validate) {
        showToast("Você não tem permissão para concluir One Page Reports.", "error");
        console.warn("[OPR] Conclusão bloqueada por permissão. Role:", currentUser ? currentUser.role : "desconhecido");
        return;
    }
    if(confirm("Tem certeza que deseja CONCLUIR? Após concluído, não será possível alterar.")) {
        if (typeof flushOprAutoSave === 'function') await flushOprAutoSave();
        await persistCurrentOpr({ conclude: true });
        if (typeof updateAutosaveStatusUI === 'function') updateAutosaveStatusUI('');
    }
}

async function openOprForm(id) {
    if (typeof flushOprAutoSave === 'function' && currentOprRecordId && currentOprRecordId !== id) {
        updateAutosaveStatusUI('Salvando relatório anterior...');
        await flushOprAutoSave();
        updateAutosaveStatusUI('');
    }
    
    if (currentOprRecordId && currentOprRecordId !== id) {
        // // if (!confirmDiscardPendingChanges()) return; // Removed for autosave flush // Removed confirm since we autosave
    }

    try {
        const meta = await OprHistoryRepository.getById(id);
        if (!meta) throw new Error("Metadados no encontrados.");
        
        let snap = null;
        if (meta.snapshotId) {
            snap = await SnapshotRepository.getById(meta.snapshotId);
        } else {
            console.warn(`[OPR LEGADO] Registro sem snapshotId. Tentando localizar snapshot por oprId: ${id}`);
            const allSnaps = await SnapshotRepository.listByOpr(id);
            if (allSnaps && allSnaps.length > 0) {
                allSnaps.sort((a, b) => {
                    const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                    const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                    return tB - tA;
                });
                snap = allSnaps[0];
                console.log(`[OPR LEGADO] Snapshot recuperado: ${snap.id}`);
            } else {
                console.warn(`[OPR LEGADO] Nenhum snapshot encontrado para: ${id}`);
            }
        }

        if (!snap) throw new Error("Snapshot não encontrado para este OPR legado.");

        cleanupOprSession();

        const openingToken = ++oprOpeningSequence;
        
        if (typeof oprHistoryDB === 'undefined') window.oprHistoryDB = [];
        const volatileObj = {
            id: meta.id, branch: meta.branch, week: meta.week, year: meta.year,
            createdAt: meta.createdAt, updatedAt: meta.updatedAt, responsible: meta.responsible,
            status: meta.status, data: JSON.parse(JSON.stringify(snap.data))
        };

        const idx = oprHistoryDB.findIndex(r => r.id === id);
        if(idx !== -1) oprHistoryDB[idx] = volatileObj;
        else oprHistoryDB.push(volatileObj);

        currentOprRecordId = id;
        if(typeof oprDirty !== "undefined") { oprDirty = false; oprAutoSaveQueued = false; oprDirtyVersion++; }

        if (!volatileObj.data.lupData) volatileObj.data.lupData = [];
        if (!volatileObj.data.melhoriasData) volatileObj.data.melhoriasData = [];

        const selector = document.getElementById('opr-branch-selector');
        const historyList = document.getElementById('opr-history-list');
        const mainContent = document.getElementById('opr-main-content');
        
        if (selector && historyList && mainContent) {
            selector.style.display = 'none';
            historyList.style.display = 'none';
            mainContent.style.display = 'block';
        }
        
        const lblFilial = document.getElementById('opr-current-branch-label');
        if (lblFilial) {
            lblFilial.innerText = meta.branch;
        }

        const badgesContainer = document.getElementById('opr-header-badges');
        if (badgesContainer) {
            // Badge 1: Semana
        const weekStr = `${meta.week}`.padStart(2, '0');
        const weekBadge = `<div style="padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; height: 36px; box-sizing: border-box;"><i class="fa-regular fa-calendar" style="color: #64748b;"></i> Semana ${weekStr}/${meta.year || meta.ano}</div>`;

        // Badge 2: Status
        let statusBadge = '';
        if (meta.status === 'Rascunho') {
            statusBadge = `<div style="padding: 6px 12px; border-radius: 6px; border: 1px solid #fcd34d; background: #fef3c7; color: #d97706; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; height: 36px; box-sizing: border-box;"><i class="fa-solid fa-pen" style="color: #f59e0b;"></i> Rascunho</div>`;
        } else if (meta.status === 'Concluído' || meta.status === 'Finalizado') {
            statusBadge = `<div style="padding: 6px 12px; border-radius: 6px; border: 1px solid #6ee7b7; background: #d1fae5; color: #059669; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; height: 36px; box-sizing: border-box;"><i class="fa-solid fa-check" style="color: #10b981;"></i> Concluído</div>`;
        } else {
            statusBadge = `<div style="padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; height: 36px; box-sizing: border-box;"><i class="fa-solid fa-circle-info"></i> ${meta.status}</div>`;
        }

        const isReadOnly = (meta.status === 'Concluído' || meta.status === 'Finalizado') ? 'readonly' : '';
        const inputStyle = isReadOnly ? 'border: none; outline: none; background: transparent; font-weight: 600; color: #334155; width: 140px; margin: 0;' : 'border: 1px solid #cbd5e1; border-radius: 4px; padding: 0 6px; height: 24px; outline: none; background: #ffffff; font-weight: 600; color: #334155; width: 140px; margin: 0; box-sizing: border-box;';
        
        const gestorBadge = `<div style="padding: 0 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; color: #334155; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; height: 36px; box-sizing: border-box;">
            <i class="fa-solid fa-user-tie" style="color: #64748b;"></i> Gestor:
            <input type="text" value="${meta.responsible || ''}" ${isReadOnly} oninput="if(typeof volatileObj !== 'undefined') volatileObj.responsible = this.value; if(typeof markOprDirty==='function') markOprDirty();" style="${inputStyle}">
        </div>`;

        badgesContainer.innerHTML = weekBadge + gestorBadge + statusBadge;
        }
        
        if (typeof renderOnePageReport === 'function') renderOnePageReport();
        if (typeof renderLicencas === 'function') renderLicencas();
if (typeof renderizarLUP === 'function') renderizarLUP();
        if (typeof renderizarMelhorias === 'function') renderizarMelhorias();
if (typeof popularFiltrosQm === 'function') popularFiltrosQm();
        if (typeof renderizarQm === 'function') renderizarQm();
        if (typeof renderizarTreinamentosDashboardOpr === 'function') renderizarTreinamentosDashboardOpr();
        if (typeof renderizarTopProblemas === 'function') renderizarTopProblemas();
        if (typeof renderizar5S === 'function') renderizar5S();
    // [CORRECAO AUTOSAVE FALSO] if (typeof markOprDirty === "function") markOprDirty();
if (typeof renderizarNcsDashboardOpr === 'function') renderizarNcsDashboardOpr();
    if (typeof renderizarCruz === 'function') renderizarCruz();
    // [CORRECAO AUTOSAVE FALSO] if (typeof markOprDirty === "function") markOprDirty();
    if (typeof calcularDiasSemAcidente === 'function') calcularDiasSemAcidente().catch(err => console.error("Erro ao atualizar seguranca:", err));
    if (typeof renderizarEmpilhadeiras === 'function') renderizarEmpilhadeiras();
    // [CORRECAO AUTOSAVE FALSO] if (typeof markOprDirty === "function") markOprDirty();
if (typeof renderizarPiramide === 'function') renderizarPiramide();
    // [CORRECAO AUTOSAVE FALSO] if (typeof markOprDirty === "function") markOprDirty();
if (typeof renderizarGraficoAgua === 'function') renderizarGraficoAgua();

        if (meta.status === 'Concludo' || meta.status === 'Finalizado') disableOprEditMode();
        else enableOprEditMode();

        const promises = [];
        if (typeof loadLupImagesForCache === 'function') promises.push(loadLupImagesForCache(openingToken));
        if (typeof loadMelhoriasImagesForCache === 'function') promises.push(loadMelhoriasImagesForCache(openingToken));
        
        if (promises.length > 0) {
            const results = await Promise.allSettled(promises);
            results.forEach(res => {
                if (res.status === 'rejected') console.error("Falha ao carregar lote de imagens:", res.reason);
            });
        }
        
        if (currentOprRecordId !== id || oprOpeningSequence !== openingToken) return;

        if (typeof renderizarLUP === 'function') renderizarLUP();
    // [CORRECAO AUTOSAVE FALSO] if (typeof markOprDirty === "function") markOprDirty();
        if (typeof renderizarMelhorias === 'function') renderizarMelhorias();
    // [CORRECAO AUTOSAVE FALSO] if (typeof markOprDirty === "function") markOprDirty();
if (typeof popularFiltrosQm === 'function') popularFiltrosQm();
        if (typeof renderizarQm === 'function') renderizarQm();
        if (typeof renderizarTreinamentosDashboardOpr === 'function') renderizarTreinamentosDashboardOpr();
        if (typeof renderizarTopProblemas === 'function') renderizarTopProblemas();
        if (typeof renderizar5S === 'function') renderizar5S();
    // [CORRECAO AUTOSAVE FALSO] if (typeof markOprDirty === "function") markOprDirty();
if (typeof renderizarNcsDashboardOpr === 'function') renderizarNcsDashboardOpr();
    if (typeof renderizarCruz === 'function') renderizarCruz();
    // [CORRECAO AUTOSAVE FALSO] if (typeof markOprDirty === "function") markOprDirty();
    if (typeof calcularDiasSemAcidente === 'function') calcularDiasSemAcidente().catch(err => console.error("Erro ao atualizar seguranca:", err));
    if (typeof renderizarEmpilhadeiras === 'function') renderizarEmpilhadeiras();
    // [CORRECAO AUTOSAVE FALSO] if (typeof markOprDirty === "function") markOprDirty();
if (typeof renderizarPiramide === 'function') renderizarPiramide();
    // [CORRECAO AUTOSAVE FALSO] if (typeof markOprDirty === "function") markOprDirty();
if (typeof renderizarGraficoAgua === 'function') renderizarGraficoAgua();

    } catch (e) {
        console.error("Erro ao abrir formulrio:", e);
        alert("Falha ao abrir registro: " + e.message);
    }
}

function viewOpr(id) { openOprForm(id); }

function enableOprEditMode() {
    if (!currentUser || !currentUser.permissions || !currentUser.permissions.edit) {
        console.warn("[OPR] Edição bloqueada por permissão (Consulta). Aplicando read-only.");
        disableOprEditMode();
        return;
    }
    const mainContent = document.getElementById('opr-main-content');
    if (!mainContent) return;

    const inputs = mainContent.querySelectorAll('input, select, textarea');
    inputs.forEach(inp => {
        inp.removeAttribute('readonly');
        inp.removeAttribute('disabled');
    });

    const selectors = [
        '[data-opr-action="true"]',
        '[data-opr-action^="licenca-"]',
        '[onclick*="salvar"]',
        '[onclick*="excluir"]',
        '[onclick*="abrirModal"]',
        '[onclick*="showModal"]',
        '[onclick*="removeUploaded"]',
        '[onclick*="remove5S"]',
        '[onclick*="adicionarLinha"]',
        '[onclick*="add5S"]'
    ].join(', ');
    
    const actionControls = mainContent.querySelectorAll(selectors);
    actionControls.forEach(el => {
        el.style.display = '';
    });
}

function disableOprEditMode() {
    const mainContent = document.getElementById('opr-main-content');
    if (!mainContent) return;

    const inputs = mainContent.querySelectorAll('input, select, textarea');
    inputs.forEach(inp => {
        inp.setAttribute('readonly', 'true');
        inp.setAttribute('disabled', 'true');
    });

    // Disable all known action controls across modules in OPR
    const selectors = [
        '[data-opr-action="true"]',
        '[data-opr-action^="licenca-"]',
        '[onclick*="salvar"]',
        '[onclick*="excluir"]',
        '[onclick*="abrirModal"]',
        '[onclick*="showModal"]',
        '[onclick*="removeUploaded"]',
        '[onclick*="remove5S"]',
        '[onclick*="adicionarLinha"]',
        '[onclick*="add5S"]'
    ].join(', ');
    
    const actionControls = mainContent.querySelectorAll(selectors);
    actionControls.forEach(el => {
        el.style.display = 'none';
    });
}

function duplicateOpr() {
    alert("Operação duplicateOpr desabilitada no modo CP 2.4");
}

// Hook navigation
if (typeof window.oprNavHooked2 === "undefined") {
    window.oprNavHooked2 = true;
    let originalNavSwitch = window.switchView;
    window.switchView = function(viewId) {
        if (typeof originalNavSwitch === "function") {
            originalNavSwitch(viewId);
        }
        if (viewId === 'view-one-page-report' || viewId === 'opr') {
            const selector = document.getElementById('opr-branch-selector');
            if(selector) selector.style.display = 'block';
            const historyList = document.getElementById('opr-history-list');
            if(historyList) historyList.style.display = 'none';
            const mainContent = document.getElementById('opr-main-content');
            if(mainContent) mainContent.style.display = 'none';
            renderOprBranchSelector();
        }
    };
}

// ==================== END CHECKPOINT 2.4 - ETAPA 2 ====================

// Test Data Generator for Etapa 2
async function generateTestRecordsEtapa2() {
    console.log("Iniciando geração de dados de teste CP24-Etapa2...");
    await OprHistoryRepository.create({
        id: 'cp24-etapa2-test-1',
        branch: 'Matriz',
        week: 25,
        year: 2026,
        createdAt: new Date('2026-06-15T10:00:00Z').toISOString(),
        updatedAt: new Date('2026-06-15T10:00:00Z').toISOString(),
        responsible: 'Test User A',
        status: 'Concluído'
    });
    
    await OprHistoryRepository.create({
        id: 'cp24-etapa2-test-2',
        branch: 'Matriz',
        week: 26,
        year: 2026,
        createdAt: new Date('2026-06-22T10:00:00Z').toISOString(),
        updatedAt: new Date('2026-06-22T10:00:00Z').toISOString(),
        responsible: 'Test User A',
        status: 'Concluído'
    });
    
    await OprHistoryRepository.create({
        id: 'cp24-etapa2-test-3',
        branch: 'Filial Sul',
        week: 26,
        year: 2026,
        createdAt: new Date('2026-06-23T10:00:00Z').toISOString(),
        updatedAt: new Date('2026-06-23T10:00:00Z').toISOString(),
        responsible: 'Test User B',
        status: 'Concluído'
    });
    
    console.log("Registros técnicos criados com sucesso.");
}

async function cleanTestRecordsEtapa2() {
    await OprHistoryRepository.remove('cp24-etapa2-test-1');
    await OprHistoryRepository.remove('cp24-etapa2-test-2');
    await OprHistoryRepository.remove('cp24-etapa2-test-3');
    console.log("Registros técnicos limpos com sucesso.");
}


// ==================== MÓDULO LICENÇAS (ETAPA 5) ====================

function abrirModalLicenca(id = null) {
    document.getElementById('licenca-id').value = '';
    document.getElementById('licenca-tipo').value = '';
    document.getElementById('licenca-numero').value = '';
    document.getElementById('licenca-orgao').value = '';
    document.getElementById('licenca-emissao').value = '';
    document.getElementById('licenca-validade').value = '';
    document.getElementById('licenca-obs').value = '';
    document.getElementById('licenca-sem-validade').checked = false;
    document.getElementById('licenca-validade').disabled = false;

    if (id && currentOprRecordId) {
        const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
        if (idx !== -1 && oprHistoryDB[idx].data.licencasData) {
            const lic = oprHistoryDB[idx].data.licencasData.find(l => l.id === id);
            if (lic) {
                document.getElementById('licenca-id').value = lic.id;
                document.getElementById('licenca-tipo').value = lic.tipo || lic.documento || '';
                document.getElementById('licenca-numero').value = lic.numero || '';
                document.getElementById('licenca-orgao').value = lic.orgaoEmissor || lic.orgao || '';
                document.getElementById('licenca-emissao').value = lic.dataEmissao || '';
                document.getElementById('licenca-validade').value = lic.dataValidade || lic.vencimento || '';
                if (!lic.dataValidade && !lic.vencimento) {
                    document.getElementById('licenca-sem-validade').checked = true;
                    document.getElementById('licenca-validade').disabled = true;
                }
                document.getElementById('licenca-obs').value = lic.observacao || '';
            }
        }
    }
    
    document.getElementById('modal-licenca').style.display = 'flex';
}

function fecharModalLicenca() {
    document.getElementById('modal-licenca').style.display = 'none';
}

function salvarLicenca() {
    const id = document.getElementById('licenca-id').value;
    const tipo = document.getElementById('licenca-tipo').value.trim();
    const numero = document.getElementById('licenca-numero').value.trim();
    const orgao = document.getElementById('licenca-orgao').value.trim();
    const emissao = document.getElementById('licenca-emissao').value;
    const validade = document.getElementById('licenca-validade').value;
    const obs = document.getElementById('licenca-obs').value.trim();

    const semValidade = document.getElementById('licenca-sem-validade').checked;
    if (!tipo || !orgao || (!validade && !semValidade)) {
        alert("Os campos Tipo, Órgão Emissor e Data de Validade são obrigatórios (exceto se marcado 'Sem validade').");
        return;
    }

    if (emissao && validade) {
        if (new Date(validade) < new Date(emissao)) {
            alert("A Data de Validade não pode ser menor que a Data de Emissão.");
            return;
        }
    }

    const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
    if (idx === -1) return;
    if (!oprHistoryDB[idx].data.licencasData) oprHistoryDB[idx].data.licencasData = [];
    const licencas = oprHistoryDB[idx].data.licencasData;

    const todayIso = new Date().toISOString();

    if (id) {
        const lic = licencas.find(l => l.id === id);
        if (lic) {
            lic.tipo = tipo;
            lic.numero = numero;
            lic.orgaoEmissor = orgao;
            lic.dataEmissao = emissao;
            lic.dataValidade = validade;
            lic.observacao = obs;
            lic.updatedAt = todayIso;
        }
    } else {
        const newLic = {
            id: 'lic-' + Date.now().toString(36) + Math.random().toString(36).substr(2),
            tipo: tipo,
            numero: numero,
            orgaoEmissor: orgao,
            dataEmissao: emissao,
            dataValidade: validade,
            status: 'Ativa',
            observacao: obs,
            createdAt: todayIso,
            updatedAt: todayIso
        };
        
        const dup = licencas.find(l => l.status === 'Ativa' && l.tipo === tipo && l.orgaoEmissor === orgao && (numero === '' || l.numero === numero));
        if (dup) {
            if(!confirm("Possível duplicidade detectada (mesmo Tipo e Órgão). Deseja cadastrar mesmo assim?")) {
                return;
            }
        }
        
        licencas.push(newLic);
    }

    fecharModalLicenca();
    renderLicencas();
    if (typeof markOprDirty === "function") markOprDirty();
if (typeof showToast === 'function') showToast("Licença salva temporariamente. Não esqueça de Salvar o OPR.");
}

function inativarLicenca(id) {
    if (!confirm("Tem certeza que deseja INATIVAR esta licença? O registro será mantido na base, mas oculto na visão principal.")) return;
    
    const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
    if (idx === -1) return;
    if (!oprHistoryDB[idx].data.licencasData) return;
    
    const lic = oprHistoryDB[idx].data.licencasData.find(l => l.id === id);
    if (lic) {
        lic.status = 'Inativa';
        lic.updatedAt = new Date().toISOString();
        renderLicencas();
    if (typeof markOprDirty === "function") markOprDirty();
if (typeof showToast === 'function') showToast("Licença inativada com sucesso.");
    }
}

function calcularDiasRestantes(dataValidade) {
    if (!dataValidade) return null;
    let [year, month, day] = dataValidade.split('-');
    if (!year) {
        [day, month, year] = dataValidade.split('/'); // Fallback para data brasileira antiga
    }
    const vDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (isNaN(vDate.getTime())) return null;
    
    const now = new Date();
    now.setHours(0,0,0,0);
    
    const diffTime = vDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calcularStatusLicenca(diasRestantes, statusAdmin) {
    if (statusAdmin === 'Inativa') return { label: 'Inativa', color: '#94a3b8', bg: '#f1f5f9' };
    
    if (diasRestantes === null) return { label: 'Sem Validade', color: '#64748b', bg: '#f1f5f9' };
    
    if (diasRestantes < 0) return { label: 'VENCIDA', color: '#A30D00', bg: 'rgba(163,13,0,0.1)' };
    if (diasRestantes <= LICENCAS_ALERTA_DIAS) return { label: 'A VENCER', color: '#b77900', bg: 'rgba(255,171,0,0.15)' };
    
    return { label: 'VIGENTE', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
}

function renderLicencas() {
    if (!currentOprRecordId) return;
    const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
    if (idx === -1) return;
    
    const isReadOnly = (oprHistoryDB[idx].status === 'Concluído');
    
    const btnAdd = document.getElementById('btn-add-licenca');
    if (btnAdd) btnAdd.style.display = isReadOnly ? 'none' : 'flex';
    
    const tbody = document.getElementById('opr-licencas-tbody');
    const emptyMsg = document.getElementById('licencas-empty-msg');
    
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let licencas = oprHistoryDB[idx].data.licencasData || [];
    
    // Migração Legado on-the-fly
    licencas.forEach(lic => {
        if (!lic.tipo && lic.documento) lic.tipo = lic.documento;
        if (!lic.orgaoEmissor && lic.orgao) lic.orgaoEmissor = lic.orgao;
        if (!lic.dataValidade && lic.vencimento) lic.dataValidade = lic.vencimento;
        if (!lic.status) lic.status = 'Ativa';
    });
    
    const selectFiltro = document.getElementById('filtro-licencas');
    const filtro = selectFiltro ? selectFiltro.value : 'Ativas';
    
    let filtered = licencas.filter(lic => {
        if (filtro === 'Todas') return true;
        
        const dias = calcularDiasRestantes(lic.dataValidade);
        const sit = calcularStatusLicenca(dias, lic.status).label;
        
        if (filtro === 'Ativas') return lic.status === 'Ativa';
        if (filtro === 'Inativas') return lic.status === 'Inativa';
        if (filtro === 'Vencidas') return sit === 'VENCIDA';
        if (filtro === 'A Vencer') return sit === 'A VENCER';
        if (filtro === 'Vigentes') return sit === 'VIGENTE';
        return true;
    });
    
    let qtdVencidas = 0;
    let qtdAvencer = 0;
    licencas.forEach(lic => {
        if (lic.status === 'Ativa') {
            const dias = calcularDiasRestantes(lic.dataValidade);
            if (dias !== null) {
                if (dias < 0) qtdVencidas++;
                else if (dias <= LICENCAS_ALERTA_DIAS) qtdAvencer++;
            }
        }
    });
    
    const indV = document.getElementById('indicador-licencas-vencidas');
    const indA = document.getElementById('indicador-licencas-avencer');
    if (indV) indV.innerText = qtdVencidas;
    if (indA) indA.innerText = qtdAvencer;
    
    if (filtered.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    } else {
        if (emptyMsg) emptyMsg.style.display = 'none';
    }
    
    filtered.sort((a, b) => {
        const dA = calcularDiasRestantes(a.dataValidade);
        const dB = calcularDiasRestantes(b.dataValidade);
        const sA = calcularStatusLicenca(dA, a.status).label;
        const sB = calcularStatusLicenca(dB, b.status).label;
        
        const priority = { 'VENCIDA': 1, 'A VENCER': 2, 'VIGENTE': 3, 'Sem Validade': 4, 'Inativa': 5 };
        
        if (priority[sA] !== priority[sB]) return priority[sA] - priority[sB];
        
        if (dA === null && dB === null) return 0;
        if (dA === null) return 1;
        if (dB === null) return -1;
        
        return dA - dB;
    });
    
    filtered.forEach(lic => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #f1f5f9';
        
        const dias = calcularDiasRestantes(lic.dataValidade);
        const sit = calcularStatusLicenca(dias, lic.status);
        
        let diasStr = '-';
        if (lic.status === 'Ativa' && dias !== null) {
            if (dias < 0) diasStr = `Vencida há ${Math.abs(dias)} dias`;
            else if (dias === 0) diasStr = 'Vence hoje';
            else diasStr = `Vence em ${dias} dias`;
        }
        
        let formattedDate = '-';
        if (lic.dataValidade) {
            if (lic.dataValidade.includes('-')) formattedDate = lic.dataValidade.split('-').reverse().join('/');
            else formattedDate = lic.dataValidade;
        }
        
        tr.innerHTML = `
            <td style="padding: 12px 15px; color: #020122; font-weight: 600;">${lic.tipo || ''} ${lic.numero ? '<br><span style="font-size: 11px; color:#64748b; font-weight:400;">'+lic.numero+'</span>' : ''}</td>
            <td style="padding: 12px 15px; color: #64748b;">${lic.orgaoEmissor || ''}</td>
            <td style="padding: 12px 15px; color: #64748b;">${formattedDate}</td>
            <td style="padding: 12px 15px; color: ${sit.color}; font-weight: 600; font-style: italic; font-size: 12px;">${diasStr}</td>
            <td style="padding: 12px 15px;"><span style="background: ${sit.bg}; color: ${sit.color}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">${sit.label}</span></td>
            <td class="opr-actions-only" style="padding: 12px 15px; text-align: center; white-space: nowrap; display: ${isReadOnly ? 'none' : 'table-cell'};">
                <button data-opr-action="licenca-edit" onclick="abrirModalLicenca('${lic.id}')" style="background: none; border: none; color: #0ea5e9; cursor: pointer; margin-right: 12px; font-size: 14px;" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button data-opr-action="licenca-inactivate" onclick="inativarLicenca('${lic.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; display: ${lic.status === 'Inativa' ? 'none' : 'inline-block'};" title="Inativar"><i class="fa-solid fa-ban"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateUserProfileUI() {
    try {
        const avatar = document.getElementById("sidebar-user-avatar");
        const name = document.getElementById("sidebar-user-name");
        const badge = document.getElementById("sidebar-user-role-badge");
        const headerSelect = document.getElementById("header-role-select");
        
        let computedAvatar = 'US';
        if (currentUser && currentUser.name) {
            const parts = currentUser.name.trim().split(/\s+/).filter(Boolean);
            if (parts.length > 1) {
                computedAvatar = (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
            } else if (parts.length === 1) {
                computedAvatar = parts[0].charAt(0).toUpperCase();
            }
        } else if (currentUser && currentUser.avatar) {
            computedAvatar = currentUser.avatar;
        }
        if (avatar) avatar.innerText = computedAvatar;
        if (name) name.innerText = currentUser.name;
        if (badge) {
            badge.innerText = currentUser.roleName;
            if (currentUser.role === 'admin' || currentUser.isAdmin) {
                badge.style.backgroundColor = 'rgba(200, 32, 50, 0.25)';
                badge.style.color = '#F4A0A8';
            } else if (currentUser.role === 'qualidade') {
                badge.style.backgroundColor = 'rgba(21, 128, 61, 0.2)';
                badge.style.color = '#86EFAC';
            } else if (currentUser.role === 'operacao') {
                badge.style.backgroundColor = 'rgba(29, 78, 216, 0.2)';
                badge.style.color = '#93C5FD';
            } else if (currentUser.role === 'gestao') {
                badge.style.backgroundColor = 'rgba(71, 85, 105, 0.25)';
                badge.style.color = '#CBD5E1';
            } else {
                badge.style.backgroundColor = 'rgba(255,255,255,0.1)';
                badge.style.color = 'rgba(255,255,255,0.55)';
            }
        }
        if (headerSelect) headerSelect.value = currentUser.role === 'admin' ? 'qualidade' : currentUser.role;

        const adminTotalPops = document.getElementById('admin-info-total-pops');
        const adminTotalUsers = document.getElementById('admin-info-total-users');
        if (adminTotalPops && typeof pops !== 'undefined') adminTotalPops.innerText = pops.length;
    } catch (e) {
        console.error("Erro ao atualizar perfil do usuário na UI:", e);
    }
}



// --- RESTORED MISSING FUNCTIONS ---

function fillLoginFields(profileKey) {
    const user = CORPORATE_USERS[profileKey];
    if (user) {
        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("login-password");
        if (emailInput) emailInput.value = user.email;
        if (passwordInput) passwordInput.value = "password123";
    }
}

function selectQuickProfile(profileKey) {
    try {
        currentUser = CORPORATE_USERS[profileKey];
        SafeStorage.setItem("simas_active_user", profileKey);
        
        // Atualizar bordas/seleção dos cards de login rápido
        const cards = document.querySelectorAll(".role-select-card");
        cards.forEach(card => card.style.borderColor = "var(--border-color)");
        
        // Destacar o card clicado
        const eventTarget = window.event ? window.event.currentTarget : null;
        if (eventTarget) {
            eventTarget.style.borderColor = "var(--secondary)";
        }
        
        fillLoginFields(profileKey);
        
        // Simula login imediato com carregamento visual
        showToast(`Conectando como ${currentUser.name}...`, "info");
        setTimeout(() => {
            performLogin();
        }, 500);
    } catch (e) {
        console.error("Erro no login rápido:", e);
    }
}


window.showAuthScreen = function(screen) {
    const screens = {
        'login': document.getElementById('login-screen'),
        'register': document.getElementById('register-screen'),
        'forgot': document.getElementById('forgot-screen')
    };
    for (const key in screens) {
        if (screens[key]) {
            if (key === screen) {
                screens[key].classList.remove('hidden');
            } else {
                screens[key].classList.add('hidden');
            }
        }
    }
};

window.handleRegister = function(event) {
    event.preventDefault();
    const regEmail = document.getElementById("reg-email");
    const regPassword = document.getElementById("reg-password");
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");
    
    if (regEmail && loginEmail) loginEmail.value = regEmail.value;
    if (regPassword && loginPassword) loginPassword.value = regPassword.value;
    
    handleRegistration();
};

async function handleFormLogin(event) {
    event.preventDefault();
    try {
        const email = document.getElementById("login-email").value;
        const passwordInput = document.getElementById("login-password");
        const password = passwordInput ? passwordInput.value : "password123";
        
        showToast("Autenticando...", "info");
        await firebase.auth().signInWithEmailAndPassword(email, password);
        // O onAuthStateChanged assumira o controle.
    } catch (e) {
        console.error("Erro de login:", e);
        showToast("Acesso negado. Verifique suas credenciais.", "error");
    }
}

function performLogin() {
    try {
        // Grava login não log de auditoria
        logAction("Login", "-", `Acesso autorizado para o usuário ${currentUser.name} (${currentUser.roleName}).`);
        
        // Atualiza widgets visuais
        updateUserProfileUI();
        applyPermissions();
        
        // Oculta tela de login e exibe a aplicacao
        const loginScreen = document.getElementById("login-screen");
        const mainApp = document.getElementById("main-application");
        
        if (loginScreen) loginScreen.classList.add("hidden");
        if (mainApp) mainApp.style.display = "flex";
        
        // Inicializa o Dashboard
        switchView("dashboard");
        
        // Dispara alertas automáticos de vencimento
        checkExpirationsAndAlert();
        
        showToast(`Bem-vindo, ${currentUser.name}! Acesso de nível '${currentUser.roleName}' concedido.`, "success");
    } catch (e) {
        console.error("Erro no processamento do login:", e);
        alert("Erro crítico no login do sistema. Detalhes salvos no console.");
    }
}

async function logout() {
    try {
        logAction("Logout", "-", `Usuário ${currentUser ? currentUser.name : 'desconhecido'} encerrou a sessão.`);
        await firebase.auth().signOut();
        SafeStorage.removeItem("simas_active_user");
        currentUser = null;
        authenticatedAppInitialized = false;
        console.log("[AUTH] Estado anterior limpo no logout");
        
        // Oculta app e exibe login
        const loginScreen = document.getElementById("login-screen");
        const mainApp = document.getElementById("main-application");
            
            if (adminUsersUnsubscribe) {
                adminUsersUnsubscribe();
                adminUsersUnsubscribe = null;
            }
            if (mainApp) mainApp.style.display = "none";


        if (loginScreen) loginScreen.classList.remove("hidden");
        
        showToast("Sessão encerrada com segurança.", "info");
    } catch (e) {
        console.error("Erro ao efetuar logout:", e);
    }
}

function changeActiveRole(roleKey) {
    try {
        if (CORPORATE_USERS[roleKey]) {
            currentUser = CORPORATE_USERS[roleKey];
            SafeStorage.setItem("simas_active_user", roleKey);
            
            updateUserProfileUI();
            applyPermissions();
            
            logAction("Permissão", "-", `Alterou perfil de simulao para ${currentUser.roleName}.`);
            showToast(`Perfil alterado para ${currentUser.roleName}. Interface adaptada.`, "info");
            
            // Re-renderiza a tabela e atualiza telas
            if (activeView === 'pops') {
                renderPopsTable();
            }
        }
    } catch (e) {
        console.error("Erro ao alterar papel de usuário:", e);
    }
}

function applyPermissions() {
    try {
        const btnNew = document.getElementById("btn-open-create-modal");
        if (btnNew) {
            btnNew.style.display = currentUser.permissions.create ? "flex" : "none";
        }
        
        const oprButtons = document.querySelectorAll('button[onclick="createNewOpr()"]');
        oprButtons.forEach(btn => {
            btn.style.display = currentUser.permissions.create ? "" : "none";
        });

        const btnConclude = document.getElementById("btn-conclude-opr");
        if (btnConclude) {
            btnConclude.style.display = currentUser.permissions.validate ? "flex" : "none";
        }
        
        const btnSave = document.getElementById("btn-save-opr");
        if (btnSave) {
            btnSave.style.display = currentUser.permissions.edit ? "flex" : "none";
        }
    } catch (e) {
        console.error("Erro ao aplicar restrições de permissões:", e);
    }
}

function checkExpirationsAndAlert() {
    try {
        const today = new Date("2026-05-20"); // Data congelada de hoje
        let expiredCount = 0;
        let criticalCount = 0;
        
        pops.forEach(pop => {
            const nextReviewDate = new Date(pop.proximaRevisao);
            const timeDiff = nextReviewDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysDiff < 0) {
                pop.status = "VENCIDO";
                expiredCount++;
            } else if (daysDiff <= 30) {
                criticalCount++;
            }
        });
        
        DBStore.setItem("simas_pops", pops);
        
        const banner = document.getElementById("vencimento-alert-banner-container");
        const desc = document.getElementById("vencimento-alert-banner-desc");
        const badge = document.getElementById("notification-bell-badge");
        const notifCountBadge = document.getElementById("notif-count-badge");
        
        const totalAlerts = expiredCount + criticalCount;
        
        if (totalAlerts > 0) {
            if (banner) {
                banner.style.display = "block";
                if (desc) {
                    desc.innerHTML = `Existem <strong>${expiredCount} POPs vencidos</strong> e <strong>${criticalCount} próximos do vencimento</strong> (prazo de 30 dias). Atualize-os para manter conformidade Anvisa.`;
                }
            }
            if (badge) {
                badge.style.display = "flex";
                badge.innerText = totalAlerts;
            }
            if (notifCountBadge) {
                notifCountBadge.innerText = `${totalAlerts} Críticos`;
            }
            renderNotificationsPanel();
        } else {
            if (banner) banner.style.display = "none";
            if (badge) badge.style.display = "none";
        }
    } catch (e) {
        console.error("Erro na verificao de vencimentos:", e);
    }
}

function renderNotificationsPanel() {
    try {
        const list = document.getElementById("notifications-list-container");
        if (!list) return;
        
        let html = "";
        const today = new Date("2026-05-20");
        
        pops.forEach(pop => {
            const nextReviewDate = new Date(pop.proximaRevisao);
            const timeDiff = nextReviewDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysDiff < 0) {
                html += `
                    <div style="padding: 10px 16px; border-bottom: 1px solid var(--border-color); background-color: var(--danger-light); display: flex; gap: 10px; align-items: start;">
                        <i class="fa-solid fa-radiation text-danger" style="margin-top: 3px;"></i>
                        <div>
                            <strong style="font-size: 0.8rem; color: var(--danger-dark);">${pop.codigo} - VENCIDO</strong>
                            <p style="font-size: 0.725rem; color: var(--text-secondary); margin-top: 2px;">Venceu em ${formatDate(pop.proximaRevisao)} - Filial: ${pop.filial}</p>
                        </div>
                    </div>
                `;
            } else if (daysDiff <= 30) {
                html += `
                    <div style="padding: 10px 16px; border-bottom: 1px solid var(--border-color); background-color: var(--warning-light); display: flex; gap: 10px; align-items: start;">
                        <i class="fa-solid fa-triangle-exclamation text-warning" style="margin-top: 3px;"></i>
                        <div>
                            <strong style="font-size: 0.8rem; color: var(--warning-dark);">${pop.codigo} - Vence em ${daysDiff} dias</strong>
                            <p style="font-size: 0.725rem; color: var(--text-secondary); margin-top: 2px;">Vencimento: ${formatDate(pop.proximaRevisao)} - Responsável: ${pop.responsavel}</p>
                        </div>
                    </div>
                `;
            }
        });
        
        list.innerHTML = html || `<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 0.8rem;">Nenhum alerta crítico ativo.</div>`;
    } catch (e) {
        console.error("Erro ao renderizar central de alertas:", e);
    }
}

function toggleNotificationsPanel() {
    const panel = document.getElementById("notifications-panel");
        if (viewId !== "ncs") { stopNcListener(); }
    if (!panel) return;
    panel.style.display = panel.style.display === "none" ? "block" : "none";
}

function clearAllNotifications() {
    try {
        const panel = document.getElementById("notifications-panel");
        if (viewId !== "ncs") { stopNcListener(); }
        const badge = document.getElementById("notification-bell-badge");
        const banner = document.getElementById("vencimento-alert-banner-container");
        
        if (panel) panel.style.display = "none";
        if (badge) badge.style.display = "none";
        if (banner) banner.style.display = "none";
        
        showToast("Notificações marcadas como lidas.", "success");
    } catch (e) {
        console.error("Erro ao limpar notificações:", e);
    }
}

function filterByUrgency() {
    switchView("pops");
    const statusSelect = document.getElementById("filter-status");
    if (statusSelect) statusSelect.value = "VENCIDO";
    
    const searchInput = document.getElementById("pop-search-input");
    if (searchInput) searchInput.value = "";
    
    applyFilters();
}

function filterByStatus(status) {
    try {
        switchView("pops");
        const statusSelect = document.getElementById("filter-status");
        if (statusSelect) {
            statusSelect.value = (status === 'all' ? '' : status);
        }
        const searchInput = document.getElementById("pop-search-input");
        if (searchInput) searchInput.value = "";
        
        applyFilters();
    } catch (e) {
        console.error("Erro ao filtrar por status:", e);
    }
}

function initOrUpdateCharts() {
    try {
        const filiais = ["Matriz", "Camaçari", "Funeas", "SJP Prefeitura", "São Roque", "Sorocaba", "Governador Valadares", "Juatuba", "Contagem"];
        const countsPerFilial = filiais.map(f => pops.filter(pop => pop.filial === f).length);
        
        const countsStatus = {
            Revisado: pops.filter(pop => pop.status === "REVISADO").length,
            Validacao: pops.filter(pop => pop.status === "AGUARDANDO APROVAÇÃO").length,
            Aprovado: pops.filter(pop => pop.status === "AGUARDANDO TREINAMENTO").length,
            Homologado: pops.filter(pop => pop.status === "HOMOLOGADO").length,
            Vencido: pops.filter(pop => pop.status === "VENCIDO").length
        };
        
        // Atualizar Contadores dos Cards
        const cTotal = document.getElementById("card-total-value");
        const cRev = document.getElementById("card-revisado-value");
        const cVal = document.getElementById("card-validacao-value");
        const cAprov = document.getElementById("card-aprovado-value");
        const cHomol = document.getElementById("card-homologado-value");
        const cVen = document.getElementById("card-vencido-value");
        
        if (cTotal) cTotal.innerText = pops.length;
        if (cRev) cRev.innerText = countsStatus.Revisado;
        if (cVal) cVal.innerText = countsStatus.Validacao;
        if (cAprov) cAprov.innerText = countsStatus.Aprovado;
        if (cHomol) cHomol.innerText = countsStatus.Homologado;
        if (cVen) cVen.innerText = countsStatus.Vencido;

        // === SE O CHART.JS NÃƒO ESTIVER CARREGADO (SEM INTERNET) ===
        if (typeof Chart === 'undefined') {
            console.warn("Chart.js indisponível. Renderizando gráficos através de fallback CSS.");
            
            const canvasFilial = document.getElementById("chart-pop-filial");
            const canvasStatus = document.getElementById("chart-pop-status");
            
            if (canvasFilial) {
                const parent = canvasFilial.parentNode;
                parent.innerHTML = `
                    <div style="display:flex; flex-direction:column; width:100%; gap:8px; font-size:0.8rem; padding:10px; max-height:260px; overflow-y:auto;">
                        ${filiais.map((f, idx) => {
                            const count = countsPerFilial[idx];
                            const maxCount = Math.max(...countsPerFilial) || 1;
                            const pct = (count / maxCount) * 100;
                            return `
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span style="width:130px; font-weight:600; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${f}</span>
                                    <div style="flex:1; background:#f1f5f9; height:12px; border-radius:6px; overflow:hidden;">
                                        <div style="width:${pct}%; background:#0f2c59; height:100%; border-radius:6px;"></div>
                                    </div>
                                    <span style="width:20px; font-weight:700; text-align:left;">${count}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
            
            if (canvasStatus) {
                const parent = canvasStatus.parentNode;
                const total = pops.length || 1;
                
                parent.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:12px; width:100%; padding:15px; font-size:0.825rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                            <span><i class="fa-solid fa-circle" style="color:#10b981;"></i> REVISADO:</span> <strong>${countsStatus.Revisado} (${((countsStatus.Revisado/total)*100).toFixed(0)}%)</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                            <span><i class="fa-solid fa-circle" style="color:#3b82f6;"></i> AGUARDANDO APROVAÇÃO:</span> <strong>${countsStatus.Validacao} (${((countsStatus.Validacao/total)*100).toFixed(0)}%)</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                            <span><i class="fa-solid fa-circle" style="color:#0d9488;"></i> AGUARDANDO TREINAMENTO:</span> <strong>${countsStatus.Aprovado} (${((countsStatus.Aprovado/total)*100).toFixed(0)}%)</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                            <span><i class="fa-solid fa-circle" style="color:#8b5cf6;"></i> HOMOLOGADO:</span> <strong>${countsStatus.Homologado} (${((countsStatus.Homologado/total)*100).toFixed(0)}%)</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:6px;">
                            <span><i class="fa-solid fa-circle" style="color:#ef4444;"></i> VENCIDO:</span> <strong>${countsStatus.Vencido} (${((countsStatus.Vencido/total)*100).toFixed(0)}%)</strong>
                        </div>
                    </div>
                `;
            }
            return;
        }

        // --- Gráfico 1: Por Filial (Barras Horizontais) ---
        const ctxFilial = document.getElementById("chart-pop-filial");
        if (ctxFilial) {
            if (chartFilialInstance) chartFilialInstance.destroy();
            
            ctxFilial.height = 100;
            chartFilialInstance = new Chart(ctxFilial, {
                type: 'bar',
                plugins: [{
                    id: 'customDataLabels',
                    afterDatasetsDraw(chart) {
                        const { ctx, data } = chart;
                        ctx.save();
                        ctx.font = 'bold 13px Montserrat, sans-serif';
                        ctx.fillStyle = '#0B1D32';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
                            const value = data.datasets[0].data[index];
                            if (value > 0) {
                                ctx.fillText(value, datapoint.x + 8, datapoint.y);
                            }
                        });
                    }
                }],
                data: {
                    labels: filiais,
                    datasets: [{
                        label: 'Quantidade de POPs',
                        data: countsPerFilial,
                        backgroundColor: 'rgba(11, 29, 50, 0.95)', /* Azul Principal */
                        borderColor: '#0B1D32',
                        borderWidth: 1.5,
                        borderRadius: 4,
                        hoverBackgroundColor: 'rgba(163, 13, 0, 0.9)' /* Vermelho Institucional */
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: '#0B1D32' }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            border: { display: false },
                            ticks: { display: false }
                        },
                        y: {
                            grid: { display: false },
                            border: { display: false },
                            ticks: { color: '#0B1D32', font: { weight: '600' } }
                        }
                    }
                }
            });
        }

        // --- Gráfico 2: Por Status (Donut) ---
        const ctxStatus = document.getElementById("chart-pop-status");
        if (ctxStatus) {
            if (chartStatusInstance) chartStatusInstance.destroy();
            
            chartStatusInstance = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['REVISADO', 'AGUARDANDO APROVAÇÃO', 'AGUARDANDO TREINAMENTO', 'HOMOLOGADO', 'VENCIDO'],
                    datasets: [{
                        data: [countsStatus.Revisado, countsStatus.Validacao, countsStatus.Aprovado, countsStatus.Homologado, countsStatus.Vencido],
                        backgroundColor: ['#0B1D32', '#F57C00', '#6A1B9A', '#2E7D32', '#A30D00'], /* Novas cores solicitadas */
                        borderColor: '#ffffff',
                        borderWidth: 3,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#0B1D32',
                                boxWidth: 12,
                                font: { size: 11, weight: '500' }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#0B1D32',
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const val = context.raw;
                                    const pct = ((val / total) * 100).toFixed(1);
                                    return ` ${context.label}: ${val} (${pct}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        }
    } catch (e) {
        console.error("Erro na inicializao dos gráficos Chart.js:", e);
    }
}

function renderUrgentDashboardList() {
    try {
        const list = document.getElementById("urgent-pops-list");
        if (!list) return;
        
        const today = new Date("2026-05-20");
        let urgents = [];
        
        pops.forEach(pop => {
            const nextReviewDate = new Date(pop.proximaRevisao);
            const timeDiff = nextReviewDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysDiff < 0 || daysDiff <= 30) {
                urgents.push({ pop, daysDiff });
            }
        });
        
        urgents.sort((a, b) => a.daysDiff - b.daysDiff);
        
        if (urgents.length === 0) {
            list.innerHTML = `
                <div style="padding: 1.5rem; text-align: center; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                    <i class="fa-solid fa-circle-check text-success" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                    Excelente! Sem nao-conformidades de prazos documentais ativas no momento.
                </div>
            `;
            return;
        }
        
        let html = "";
        urgents.slice(0, 3).forEach(item => {
            const isExpired = item.daysDiff < 0;
            const colorClass = isExpired ? 'danger' : 'warning';
            const iconClass = isExpired ? 'fa-radiation' : 'fa-triangle-exclamation';
            const labelText = isExpired ? `EXPIRADO HÁ ${Math.abs(item.daysDiff)} DIAS` : `VENCE EM ${item.daysDiff} DIAS`;
            
            html += `
                <div style="background-color: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px; overflow:hidden; flex: 1; padding-right:10px;">
                        <div class="metric-icon ${colorClass}" style="width: 34px; height: 34px; font-size: 0.9rem; border-radius: 6px; flex-shrink:0;">
                            <i class="fa-solid ${iconClass}"></i>
                        </div>
                        <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            <strong style="color: var(--primary); font-size: 0.85rem; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.pop.codigo} - ${item.pop.titulo}</strong>
                            <p style="font-size: 0.725rem; color: var(--text-secondary); margin-top: 1px;">Filial: ${item.pop.filial} | Resp: ${item.pop.responsavel}</p>
                        </div>
                    </div>
                    <div style="text-align: right; flex-shrink:0;">
                        <span class="status-badge ${colorClass}" style="font-size:0.65rem; padding: 2px 8px;">${labelText}</span>
                        <button class="btn-outline" style="padding: 3px 6px; font-size: 0.65rem; margin-top: 4px; display: block; margin-left: auto;" onclick="openDetailsModal('${item.pop.id}')">Análise</button>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    } catch (e) {
        console.error("Erro ao renderizar urgências no dashboard:", e);
    }
}


function formatDate(dateStr) {
    if (!dateStr) return "-";
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

function renderPopsTable() {
    try {
        const tbody = document.getElementById("pops-table-body");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        
        if (filteredPops.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; display: block; margin-bottom: 8px; color: var(--text-light);"></i>
                        Nenhum POP localizado sob os critérios ativos de filtragem.
                    </td>
                </tr>
            `;
            document.getElementById("table-pagination-info-id").innerText = "Exibindo 0 de 0 POPs";
            document.getElementById("pagination-pages-list").innerHTML = "";
            return;
        }
        
        const totalItems = filteredPops.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (currentPage > totalPages) currentPage = totalPages || 1;
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const paginatedItems = filteredPops.slice(startIndex, endIndex);
        
        paginatedItems.forEach(pop => {
            const tr = document.createElement("tr");
            
            let statusClass = "status-badge ";
            let statusIcon = "fa-circle";
            
            if (pop.status === "REVISADO") {
                statusClass += "revisado";
                statusIcon = "fa-circle-check";
            } else if (pop.status === "AGUARDANDO TREINAMENTO") {
                statusClass += "treinamento";
                statusIcon = "fa-user-graduate";
            } else if (pop.status === "COPIA NÃƒO CONTROLADA") {
                statusClass += "copia";
                statusIcon = "fa-copy";
            } else if (pop.status === "HOMOLOGADO") {
                statusClass += "homologado";
                statusIcon = "fa-stamp";
            } else if (pop.status === "AGUARDANDO APROVAÇÃO" || pop.status === "AGUARDANDO REVISÃƒO") {
                statusClass += "aguardando";
                tr.className = "row-aguardando";
                statusIcon = "fa-clock-rotate-left";
            } else if (pop.status === "VENCIDO") {
                statusClass += "vencido";
                statusIcon = "fa-radiation";
            }
            
            let editBtn = `<button class="btn-icon" onclick="openEditPOPModal('${pop.id}')" title="Editar Informações"><i class="fa-solid fa-pen-to-square"></i></button>`;
            let deleteBtn = `<button class="btn-icon delete" onclick="deletePOP('${pop.id}')" title="Excluir POP"><i class="fa-solid fa-trash"></i></button>`;
            let downloadBtn = `<button class="btn-icon" onclick="downloadPOP('${pop.id}')" style="color: var(--brand);" title="Baixar Arquivo"><i class="fa-solid fa-download"></i></button>`;
            let approveBtn = "";
            if (currentUser.isAdmin && (pop.status === "AGUARDANDO APROVAÇÃO" || pop.status === "AGUARDANDO REVISÃƒO")) {
                approveBtn = `<button class="btn-icon" onclick="approvePOP('${pop.id}')" style="color: #2E7D32; border-color: #BBF7D0;" title="Aprovar/Revisar POP"><i class="fa-solid fa-check-circle"></i></button>`;
            }
            
            if (currentUser.role === 'visualizacao') {
                editBtn = `<button class="btn-icon" disabled style="opacity: 0.4; cursor: not-allowed;" title="Apenas Leitura"><i class="fa-solid fa-lock"></i></button>`;
                deleteBtn = "";
            } else if (currentUser.role === 'operacao' || currentUser.role === 'gestao') {
                deleteBtn = ""; // Apenas administrador / qualidade pode excluir de fato
            }
            
            // Definir classe do Tipo
            const tipoLower = String(pop.tipo || "POP").toLowerCase();
            let tipoIcon = "fa-file-lines";
            if (tipoLower === "anexo") tipoIcon = "fa-paperclip";
            else if (tipoLower === "manual") tipoIcon = "fa-book";
            else if (tipoLower === "fluxo") tipoIcon = "fa-diagram-project";
            else if (tipoLower === "mapa") tipoIcon = "fa-map";
            const tipoBadgeHtml = `<span class="tipo-badge ${tipoLower}"><i class="fa-solid ${tipoIcon}"></i> ${pop.tipo || "POP"}</span>`;
            
            const abrg = pop.abrangencia || "Global";
            let abrgBadge = abrg === "Global" 
                ? `<span style="font-size: 11px; font-weight: 600; color: #0369a1; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; border: 1px solid #bae6fd; margin-left: 6px; display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;"><i class="fa-solid fa-globe"></i> Global</span>`
                : `<span style="font-size: 11px; font-weight: 600; color: #854d0e; background: #fef9c3; padding: 2px 6px; border-radius: 4px; border: 1px solid #fde047; margin-left: 6px; display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;"><i class="fa-solid fa-location-dot"></i> Específico</span>`;
            
            tr.innerHTML = `
                <td><span class="pop-code-badge">${pop.codigo}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="pop-title-cell" title="${pop.titulo}">${pop.titulo}</span>
                    </div>
                </td>
                <td style="text-align: center;">${abrgBadge}</td>
                <td><span class="filial-badge">${pop.filial}</span></td>
                <td>${tipoBadgeHtml}</td>
                <td>${pop.area}</td>
                <td style="text-align: center;">${pop.responsavel}</td>
                <td style="text-align: center;">${formatDate(pop.dataRevisao)}</td>
                <td style="text-align: center;">${formatDate(pop.proximaRevisao)}</td>
                <td><span class="${statusClass}"><i class="fa-solid ${statusIcon}"></i> ${pop.status}</span></td>
                <td style="text-align: center; vertical-align: middle;">
                    <div class="action-buttons" style="display: flex; gap: 6px; justify-content: center;">
                        ${approveBtn}
                        <button class="btn-icon" onclick="downloadPOP('${pop.id}')" title="Baixar documento"><i class="fa-solid fa-download"></i></button>
                        <button class="btn-icon" onclick="openDetailsModal('${pop.id}')" title="Visualizar informações"><i class="fa-solid fa-circle-info"></i></button>
                        <button class="btn-icon" onclick="openHistoryModal('${pop.id}')" title="Histórico de revisões"><i class="fa-solid fa-clock-rotate-left"></i></button>
                        <button class="btn-icon" onclick="openViewerModal('${pop.id}')" title="Visualizar POP"><i class="fa-solid fa-eye"></i></button>
                        ${editBtn}
                        ${deleteBtn}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Paginao UI
        document.getElementById("table-pagination-info-id").innerHTML = `Exibindo <strong>${startIndex + 1}-${endIndex}</strong> de <strong>${totalItems}</strong> POPs`;
        document.getElementById("btn-prev-page-id").disabled = (currentPage === 1);
        document.getElementById("btn-next-page-id").disabled = (currentPage === totalPages || totalPages === 0);
        
        const pagesContainer = document.getElementById("pagination-pages-list");
        pagesContainer.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.className = `btn-page ${i === currentPage ? 'active' : ''}`;
            btn.innerText = i;
            btn.onclick = () => {
                currentPage = i;
                renderPopsTable();
            };
            pagesContainer.appendChild(btn);
        }
    } catch (e) {
        console.error("Erro ao renderizar tabela de POPs:", e);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPopsTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredPops.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderPopsTable();
    }
}

function autoSuggestNextRevision() {
    try {
        const inputVal = document.getElementById("form-pop-data-revisao").value;
        if (inputVal) {
            // Divide o valor YYYY-MM-DD para evitar desvios de fuso horário no navegador
            const parts = inputVal.split("-");
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Mês 0-indexado
                const day = parseInt(parts[2], 10);
                
                const base = new Date(year, month, day);
                // Adiciona exatamente 2 anos (24 meses) para o ciclo de revisão regulatória corporativa
                base.setFullYear(base.getFullYear() + 2);
                
                const y = base.getFullYear();
                const m = String(base.getMonth() + 1).padStart(2, '0');
                const d = String(base.getDate()).padStart(2, '0');
                
                document.getElementById("form-pop-proxima-revisao").value = `${y}-${m}-${d}`;
            }
        }
    } catch (e) {
        console.error("Erro ao calcular próxima revisão:", e);
    }
}

function triggerFileUpload() {
    document.getElementById("form-pop-file").click();
}

function getFileIconClass(filename) {
    if (!filename) return "fa-file-lines text-secondary";
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf text-danger';
    if (ext === 'xlsx' || ext === 'xls') return 'fa-file-excel text-success';
    if (ext === 'docx' || ext === 'doc') return 'fa-file-word text-primary';
    if (ext === 'pptx' || ext === 'ppt') return 'fa-file-powerpoint' + ' style="color:#d97706"';
    return 'fa-file-lines text-secondary';
}

function processSelectedFile(file) {
    if (!file) return;

    try {
        // Validação de formato
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx'];
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(extension)) {
            showToast("Formato não permitido. Utilize PDF, DOCX, XLSX ou PPTX.", "error");
            document.getElementById("form-pop-file").value = "";
            return;
        }

        // Validação de tamanho (15 MB)
        const maxSizeInBytes = 15 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            showToast("Arquivo excede o limite máximo permitido de 15MB.", "error");
            document.getElementById("form-pop-file").value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            activeUploadedFile = {
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
                data: e.target.result // Base64 data URL
            };
            
            document.getElementById("upload-zone").style.display = "none";
            document.getElementById("uploaded-file-info").style.display = "flex";
            document.getElementById("uploaded-filename").innerText = activeUploadedFile.name;
            document.getElementById("uploaded-filesize").innerText = activeUploadedFile.size;
            
            // Atualiza ícone do arquivo dinamicamente
            const iconElem = document.getElementById("uploaded-file-icon");
            if (iconElem) {
                iconElem.className = "fa-solid " + getFileIconClass(file.name);
            }
            
            showToast(`Anexo '${file.name}' carregado com sucesso para upload.`, "success");
        };
        reader.onerror = function() {
            showToast("Não foi possível processar o arquivo. Tente novamente.", "error");
            document.getElementById("form-pop-file").value = "";
        };
        reader.readAsDataURL(file);
    } catch (e) {
        console.error("Erro no processamento do arquivo:", e);
        showToast("Não foi possível processar o arquivo. Tente novamente.", "error");
        document.getElementById("form-pop-file").value = "";
    }
}

function handleFileSelect(event) {
    try {
        const file = event.target.files[0];
        if (file) {
            processSelectedFile(file);
        }
    } catch (e) {
        console.error("Erro no upload do arquivo:", e);
        showToast("Não foi possível processar o arquivo. Tente novamente.", "error");
    }
}

function removeUploadedFile(event) {
    event.stopPropagation();
    event.preventDefault();
    
    activeUploadedFile = null;
    document.getElementById("form-pop-file").value = "";
    document.getElementById("uploaded-file-info").style.display = "none";
    document.getElementById("upload-zone").style.display = "flex";
}

let activeEvidenciaFile = null;

let activeCopiaNcFile = null;
let activePopHomologadoFile = null;
let existingCopiaNc = null;
let existingPopHomologado = null;


function triggerEvidenciaUpload() {
    document.getElementById("form-pop-evidencia").click();
}

function processSelectedEvidencia(file) {
    if (!file) return;

    try {
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'xlsm', 'jpg', 'jpeg', 'png'];
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(extension)) {
            showToast("Formato não permitido. Utilize PDF, DOCX, XLSX, JPG ou PNG.", "error");
            document.getElementById("form-pop-evidencia").value = "";
            return;
        }

        const maxSizeInBytes = 15 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            showToast("Arquivo excede o limite máximo permitido de 15MB.", "error");
            document.getElementById("form-pop-evidencia").value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            activeEvidenciaFile = {
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
                data: e.target.result
            };
            
            document.getElementById("upload-zone-evidencia").style.display = "none";
            document.getElementById("uploaded-evidencia-info").style.display = "flex";
            document.getElementById("uploaded-evidencia-filename").innerText = activeEvidenciaFile.name;
            document.getElementById("uploaded-evidencia-filesize").innerText = activeEvidenciaFile.size;
            
            const iconElem = document.getElementById("uploaded-evidencia-icon");
            if (iconElem) {
                iconElem.className = "fa-solid " + getFileIconClass(file.name);
            }
            
            showToast(`Evidência '${file.name}' carregada com sucesso para upload.`, "success");
        };
        reader.onerror = function() {
            showToast("Não foi possível processar a evidência. Tente novamente.", "error");
            document.getElementById("form-pop-evidencia").value = "";
        };
        reader.readAsDataURL(file);
    } catch (e) {
        console.error("Erro no processamento da evidência:", e);
        showToast("Não foi possível processar a evidência. Tente novamente.", "error");
        document.getElementById("form-pop-evidencia").value = "";
    }
}

function handleEvidenciaSelect(event) {
    try {
        const file = event.target.files[0];
        if (file) {
            processSelectedEvidencia(file);
        }
    } catch (e) {
        console.error("Erro no upload da evidência:", e);
        showToast("Não foi possível processar a evidência. Tente novamente.", "error");
    }
}


function triggerCopiaNcUpload() { document.getElementById("form-pop-copia-nc").click(); }
function handleCopiaNcSelect(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;
        const maxSize = 15 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast("Arquivo excede limite de 15MB", "error");
            return;
        }
        activeCopiaNcFile = file;
        document.getElementById("upload-zone-copia-nc").style.display = "none";
        document.getElementById("uploaded-copia-nc-info").style.display = "flex";
        document.getElementById("uploaded-copia-nc-filename").innerText = file.name;
        document.getElementById("uploaded-copia-nc-filesize").innerText = (file.size / (1024*1024)).toFixed(1) + " MB";
    } catch(e) {
        showToast("Erro ao processar Cópia Não Controlada", "error");
    }
}
function removeUploadedCopiaNc(event) {
    event.stopPropagation();
    event.preventDefault();
    if (!currentUser.permissions.edit) { showToast("Sem permissão", "error"); return; }
    activeCopiaNcFile = null;
    existingCopiaNc = null;
    document.getElementById("form-pop-copia-nc").value = "";
    document.getElementById("uploaded-copia-nc-info").style.display = "none";
    document.getElementById("upload-zone-copia-nc").style.display = "flex";
}
async function downloadCopiaNc(event) {
    event.stopPropagation();
    event.preventDefault();
    if (activeCopiaNcFile) {
        const url = URL.createObjectURL(activeCopiaNcFile);
        const a = document.createElement("a");
        a.href = url;
        a.download = activeCopiaNcFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else if (existingCopiaNc && existingCopiaNc.fileId) {
        try {
            const f = await FileRepository.get(existingCopiaNc.fileId);
            if(f && f.blob) {
                const url = URL.createObjectURL(f.blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = existingCopiaNc.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                showToast("Arquivo não encontrado", "error");
            }
        } catch(e) { showToast("Erro ao baixar", "error"); }
    }
}

function triggerPopHomologadoUpload() { document.getElementById("form-pop-pop-homologado").click(); }
function handlePopHomologadoSelect(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;
        const maxSize = 15 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast("Arquivo excede limite de 15MB", "error");
            return;
        }
        activePopHomologadoFile = file;
        document.getElementById("upload-zone-pop-homologado").style.display = "none";
        document.getElementById("uploaded-pop-homologado-info").style.display = "flex";
        document.getElementById("uploaded-pop-homologado-filename").innerText = file.name;
        document.getElementById("uploaded-pop-homologado-filesize").innerText = (file.size / (1024*1024)).toFixed(1) + " MB";
    } catch(e) {
        showToast("Erro ao processar POP Homologado", "error");
    }
}
function removeUploadedPopHomologado(event) {
    event.stopPropagation();
    event.preventDefault();
    if (!currentUser.permissions.edit) { showToast("Sem permissão", "error"); return; }
    activePopHomologadoFile = null;
    existingPopHomologado = null;
    document.getElementById("form-pop-pop-homologado").value = "";
    document.getElementById("uploaded-pop-homologado-info").style.display = "none";
    document.getElementById("upload-zone-pop-homologado").style.display = "flex";
}
async function downloadPopHomologado(event) {
    event.stopPropagation();
    event.preventDefault();
    if (activePopHomologadoFile) {
        const url = URL.createObjectURL(activePopHomologadoFile);
        const a = document.createElement("a");
        a.href = url;
        a.download = activePopHomologadoFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else if (existingPopHomologado && existingPopHomologado.fileId) {
        try {
            const f = await FileRepository.get(existingPopHomologado.fileId);
            if(f && f.blob) {
                const url = URL.createObjectURL(f.blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = existingPopHomologado.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                showToast("Arquivo não encontrado", "error");
            }
        } catch(e) { showToast("Erro ao baixar", "error"); }
    }
}

function removeUploadedEvidencia(event) {
    event.stopPropagation();
    event.preventDefault();
    
    activeEvidenciaFile = null;
    document.getElementById("form-pop-evidencia").value = "";
    document.getElementById("uploaded-evidencia-info").style.display = "none";
    document.getElementById("upload-zone-evidencia").style.display = "flex";
}

function downloadEvidenciaFromModal(event) {
    event.stopPropagation();
    event.preventDefault();
    
    // Se o usuário acabou de selecionar um novo arquivo, baixa da memória
    if (activeEvidenciaFile && activeEvidenciaFile.data) {
        const link = document.createElement("a");
        link.setAttribute("href", activeEvidenciaFile.data);
        link.setAttribute("download", activeEvidenciaFile.name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }
    
    // Se já estiver persistido no banco, pega o ID do formulário e baixa
    const id = document.getElementById("form-pop-id").value;
    if (id) {
        downloadPOPEvidencia(id);
    } else {
        showToast("Nenhuma evidência disponível para download.", "error");
    }
}

    

function openCreatePOPModal() {
    try {
        if (!currentUser.permissions.create) {
            showToast("Nível de acesso insuficiente para cadastrar documentos.", "error");
            return;
        }
        
        document.getElementById("form-pop-id").value = "";
        document.getElementById("pop-form").reset();
        document.getElementById("pop-modal-title").innerHTML = `<i class="fa-solid fa-file-circle-plus"></i> Registrar Novo POP`;
        document.getElementById("btn-save-pop-submit").innerText = "Registrar POP";
        
        // Garante que todas as opções do status select sejam reabilitadas
        const statusSelect = document.getElementById("form-pop-status");
        if (statusSelect) {
            Array.from(statusSelect.options).forEach(opt => opt.disabled = false);
            if (!currentUser.isAdmin) {
                statusSelect.value = "AGUARDANDO APROVAÇÃO";
                statusSelect.disabled = true;
            } else {
                statusSelect.disabled = false;
            }
        }
        
        activeUploadedFile = null;
        document.getElementById("uploaded-file-info").style.display = "none";
        document.getElementById("upload-zone").style.display = "flex";
        
        activeEvidenciaFile = null;
        document.getElementById("uploaded-evidencia-info").style.display = "none";
        document.getElementById("upload-zone-evidencia").style.display = "flex";

        activeCopiaNcFile = null;
        existingCopiaNc = null;
        document.getElementById("uploaded-copia-nc-info").style.display = "none";
        document.getElementById("upload-zone-copia-nc").style.display = "flex";
        document.getElementById("trash-copia-nc").style.display = "block";
        document.getElementById("form-pop-copia-nc").value = "";

        activePopHomologadoFile = null;
        existingPopHomologado = null;
        document.getElementById("uploaded-pop-homologado-info").style.display = "none";
        document.getElementById("upload-zone-pop-homologado").style.display = "flex";
        document.getElementById("trash-pop-homologado").style.display = "block";
        document.getElementById("form-pop-pop-homologado").value = "";

        
        document.getElementById("pop-modal").classList.add("active");
    } catch (e) {
        console.error("Erro ao abrir modal de criacao:", e);
        }
}

function openEditPOPModal(id) {
    try {
        if (!currentUser.permissions.edit) {
            showToast("Nível de acesso insuficiente para propçãor edições.", "error");
            return;
        }
        
        const pop = pops.find(p => p.id === id);
        if (!pop) return;
        
        document.getElementById("form-pop-id").value = pop.id;
        document.getElementById("form-pop-codigo").value = pop.codigo;
        document.getElementById("form-pop-titulo").value = pop.titulo;
        document.getElementById("form-pop-filial").value = pop.filial;
        document.getElementById("form-pop-tipo").value = pop.tipo || "POP";
        document.getElementById("form-pop-abrangencia").value = pop.abrangencia || "Global";
        document.getElementById("form-pop-area").value = pop.area;
        let respNorm = (pop.responsavel && pop.responsavel.toUpperCase().includes("BRUN")) ? "BRUNO" : pop.responsavel;
        document.getElementById("form-pop-responsavel").value = respNorm;
        document.getElementById("form-pop-status").value = pop.status;
        document.getElementById("form-pop-data-revisao").value = pop.dataRevisao;
        document.getElementById("form-pop-proxima-revisao").value = pop.proximaRevisao;
        document.getElementById("form-pop-observacoes").value = pop.observacoes || "";
        
        activeUploadedFile = { name: pop.arquivo, size: "1.8 MB" };
        
        document.getElementById("upload-zone").style.display = "none";
        document.getElementById("uploaded-file-info").style.display = "flex";
        document.getElementById("uploaded-filename").innerText = pop.arquivo;
        
        // Atualiza ícone do arquivo na edição
        const iconElem = document.getElementById("uploaded-file-icon");
        if (iconElem) {
            iconElem.className = "fa-solid " + getFileIconClass(pop.arquivo);
        }
        document.getElementById("uploaded-filesize").innerText = "1.8 MB";
        
        // Evidência de Treinamento
        if (pop.evidencia) {
            activeEvidenciaFile = { name: pop.evidencia, size: "1.0 MB" };
            document.getElementById("upload-zone-evidencia").style.display = "none";
            document.getElementById("uploaded-evidencia-info").style.display = "flex";
            document.getElementById("uploaded-evidencia-filename").innerText = pop.evidencia;
            
            const evIconElem = document.getElementById("uploaded-evidencia-icon");
            if (evIconElem) {
                evIconElem.className = "fa-solid " + getFileIconClass(pop.evidencia);
            }
            document.getElementById("uploaded-evidencia-filesize").innerText = "1.0 MB";
        } else {
            activeEvidenciaFile = null;
            document.getElementById("uploaded-evidencia-info").style.display = "none";
            document.getElementById("upload-zone-evidencia").style.display = "flex";
        }

        if (pop.copiaNaoControlada) {
            existingCopiaNc = pop.copiaNaoControlada;
            activeCopiaNcFile = null;
            document.getElementById("upload-zone-copia-nc").style.display = "none";
            document.getElementById("uploaded-copia-nc-info").style.display = "flex";
            document.getElementById("uploaded-copia-nc-filename").innerText = existingCopiaNc.name;
            document.getElementById("uploaded-copia-nc-filesize").innerText = existingCopiaNc.size || "";
        } else {
            existingCopiaNc = null;
            activeCopiaNcFile = null;
            document.getElementById("uploaded-copia-nc-info").style.display = "none";
            document.getElementById("upload-zone-copia-nc").style.display = "flex";
        }
        if (!currentUser.permissions.edit) { document.getElementById("trash-copia-nc").style.display = "none"; }
        else { document.getElementById("trash-copia-nc").style.display = "block"; }

        if (pop.popHomologado) {
            existingPopHomologado = pop.popHomologado;
            activePopHomologadoFile = null;
            document.getElementById("upload-zone-pop-homologado").style.display = "none";
            document.getElementById("uploaded-pop-homologado-info").style.display = "flex";
            document.getElementById("uploaded-pop-homologado-filename").innerText = existingPopHomologado.name;
            document.getElementById("uploaded-pop-homologado-filesize").innerText = existingPopHomologado.size || "";
        } else {
            existingPopHomologado = null;
            activePopHomologadoFile = null;
            document.getElementById("uploaded-pop-homologado-info").style.display = "none";
            document.getElementById("upload-zone-pop-homologado").style.display = "flex";
        }
        if (!currentUser.permissions.edit) { document.getElementById("trash-pop-homologado").style.display = "none"; }
        else { document.getElementById("trash-pop-homologado").style.display = "block"; }
        
        document.getElementById("pop-modal-title").innerHTML = `<i class="fa-solid fa-file-pen"></i> Atualizar POP: ${pop.codigo}`;
        document.getElementById("btn-save-pop-submit").innerText = "Salvar Alterações";
        
        // Regras de validao baseadas no papel
        const statusSelect = document.getElementById("form-pop-status");
        if (statusSelect) {
            Array.from(statusSelect.options).forEach(opt => {
                opt.disabled = false;
                opt.style.display = 'block';
            });
            
            if (!currentUser.permissions.validate) {
                Array.from(statusSelect.options).forEach(opt => {
                    if (opt.value === 'REVISADO') {
                        opt.disabled = true;
                        opt.style.display = 'none';
                    }
                });
            }
            
            if (!currentUser.isAdmin) {
                Array.from(statusSelect.options).forEach(opt => {
                    if (opt.value === 'AGUARDANDO TREINAMENTO') {
                        opt.disabled = true;
                        opt.style.display = 'none';
                    }
                });
            }
        }
        
        document.getElementById("pop-modal").classList.add("active");
    } catch (e) {
        console.error("Erro ao abrir modal de edição:", e);
    }
}

async function deletePOP(id) {
    try {
        if (!currentUser.permissions.delete) {
            showToast("Nível de acesso insuficiente para exclusão definitiva.", "error");
            return;
        }
        
        const pop = pops.find(p => p.id === id);
        if (!pop) return;
        
        const check = confirm(`ATENÇÃO DE CONTROLE DE QUALIDADE!\nVocê está excluindo DEFINITIVAMENTE o POP '${pop.codigo}'.\nEsta ação gera um registro compulsório e não-refutável na trilha de auditoria.\nDeseja prosseguir?`);
        
        if (check) {
            pops = pops.filter(p => p.id !== id);
            await db.collection("simas_pops").doc(id).delete();
            
            await DBStore.setItem("simas_pops", pops);
            console.log(`[POPs] Cache atualizado após exclusão: ${pops.length} registros restantes`);
            
            logAction("Exclusão", pop.codigo, `EXCLUIU DEFINITIVAMENTE o POP ${pop.codigo} da filial ${pop.filial}.`);
            showToast(`POP ${pop.codigo} removido. Log de exclusão registrado.`, "success");
            
            applyFilters();
            checkExpirationsAndAlert();
        }
    } catch (e) {
        console.error("Erro ao deletar POP:", e);
    }
}

function closePOPModal() {
    document.getElementById("pop-modal").classList.remove("active");
}

async function savePOP(event) {
    event.preventDefault();
    try {
        const id = document.getElementById("form-pop-id").value;
        const codigo = document.getElementById("form-pop-codigo").value.trim().toUpperCase();
        const titulo = document.getElementById("form-pop-titulo").value.trim();
        const filial = document.getElementById("form-pop-filial").value;
        const tipo = document.getElementById("form-pop-tipo").value;
        const abrangencia = document.getElementById("form-pop-abrangencia").value;
        const area = document.getElementById("form-pop-area").value;
        const responsavel = document.getElementById("form-pop-responsavel").value.trim();
        let status = document.getElementById("form-pop-status").value;
        if (!currentUser.isAdmin) {
            status = "AGUARDANDO APROVAÇÃO";
        }
        const dataRevisao = document.getElementById("form-pop-data-revisao").value;
        const proximaRevisao = document.getElementById("form-pop-proxima-revisao").value;
        const observacoes = document.getElementById("form-pop-observacoes").value.trim();

        if (!activeUploadedFile && !id) {
            showToast("É obrigatório carregar um documento regulamentar (PDF/Word/Excel).", "error");
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        let popToSave = null;
        let newIdStr = id;

        // --- PREPARAÇÃO DE CHUNKS ---
        let targetIndex = -1;
        if (id) {
            targetIndex = pops.findIndex(p => p.id === id);
            if (targetIndex === -1) return;
        }

        const chunks = [];
        if (activeUploadedFile && activeUploadedFile.data) {
            const fileData = activeUploadedFile.data;
            for (let i = 0; i < fileData.length; i += 800000) {
                chunks.push(fileData.substring(i, i + 800000));
            }
        }

        
        const popToEdit = id ? pops[targetIndex] : null;
        let finalCopiaNc = popToEdit ? (popToEdit.copiaNaoControlada || null) : null;
        if (activeCopiaNcFile) {
            const savedId = await FileRepository.save(activeCopiaNcFile, { module: 'pop' });
            finalCopiaNc = {
                fileId: savedId,
                name: activeCopiaNcFile.name,
                size: (activeCopiaNcFile.size / (1024*1024)).toFixed(1) + " MB"
            };
        } else if (!existingCopiaNc) {
            finalCopiaNc = null;
        }

        let finalPopHomologado = popToEdit ? (popToEdit.popHomologado || null) : null;
        if (activePopHomologadoFile) {
            const savedId = await FileRepository.save(activePopHomologadoFile, { module: 'pop' });
            finalPopHomologado = {
                fileId: savedId,
                name: activePopHomologadoFile.name,
                size: (activePopHomologadoFile.size / (1024*1024)).toFixed(1) + " MB"
            };
        } else if (!existingPopHomologado) {
            finalPopHomologado = null;
        }

const evChunks = [];
        if (activeEvidenciaFile && activeEvidenciaFile.data) {
            const evData = activeEvidenciaFile.data;
            for (let i = 0; i < evData.length; i += 800000) {
                evChunks.push(evData.substring(i, i + 800000));
            }
        }
        // ------------------------------------

        let logActionArgs = null;

        if (id) {
            const oldPop = pops[targetIndex];
            const oldStatus = oldPop.status;
            
            popToSave = {
                ...oldPop,
                codigo,
                titulo,
                filial,
                tipo,
                abrangencia,
                area,
                responsavel,
                status,
                dataRevisao,
                proximaRevisao,
                observacoes,
                arquivo: activeUploadedFile ? activeUploadedFile.name : (oldPop.arquivo || null),
                evidencia: activeEvidenciaFile ? activeEvidenciaFile.name : (oldPop.evidencia || null),
                copiaNaoControlada: finalCopiaNc,
                popHomologado: finalPopHomologado,
                numChunks: chunks.length > 0 ? chunks.length : (oldPop.numChunks || 0),
                numEvidenciaChunks: evChunks.length > 0 ? evChunks.length : (oldPop.numEvidenciaChunks || 0),
                historico: [
                    ...oldPop.historico,
                    { data: todayStr, autor: `${currentUser.name} (${currentUser.roleName})`, acao: `Edição de ciclo documental. Status anterior: ${oldStatus} -> Atual: ${status}.` }
                ]
            };
            if (popToSave.fileUrl) delete popToSave.fileUrl; // Limpar url legada se existir
            logActionArgs = ["Edição", codigo, `Editou o POP ${codigo} (${filial}). Status alterado: ${oldStatus} -> ${status}.`];
        } else {
            if (pops.some(p => p.codigo === codigo)) {
                showToast(`Código documental '${codigo}' já existente no sistema!`, "error");
                return;
            }
            const maxNum = pops.reduce((max, p) => {
                const num = parseInt(p.id.replace("pop-", ""), 10);
                return isNaN(num) ? max : Math.max(max, num);
            }, 0);
            newIdStr = "pop-" + String(maxNum + 1).padStart(3, '0');
            popToSave = {
                id: newIdStr,
                codigo,
                titulo,
                filial,
                tipo,
                abrangencia,
                area,
                responsavel,
                status,
                dataRevisao,
                proximaRevisao,
                observacoes,
                arquivo: activeUploadedFile ? activeUploadedFile.name : null,
                evidencia: activeEvidenciaFile ? activeEvidenciaFile.name : null,
                copiaNaoControlada: finalCopiaNc,
                popHomologado: finalPopHomologado,
                numChunks: chunks.length,
                numEvidenciaChunks: evChunks.length,
                historico: [
                    { data: todayStr, autor: `${currentUser.name} (${currentUser.roleName})`, acao: `Criação documental primária. Status: ${status}.` }
                ]
            };
            logActionArgs = ["Criação", codigo, `Criou o POP ${codigo} (${filial}) na área ${area}.`];
        }

        // --- 1. OPERAÇÕES FIRESTORE (Upload primeiro!) ---
        showToast("Salvando metadados na nuvem...", "info");
        await db.collection("simas_pops").doc(newIdStr).set(popToSave);

        if (chunks.length > 0) {
            showToast("Fazendo upload fragmentado do anexo principal...", "info");
            for (let i = 0; i < chunks.length; i++) {
                await db.collection("simas_pops").doc(newIdStr).collection("chunks").doc(`chunk_${i}`).set({
                    data: chunks[i],
                    index: i
                });
            }
        }

        if (evChunks.length > 0) {
            showToast("Fazendo upload da Evidência de Treinamento...", "info");
            for (let i = 0; i < evChunks.length; i++) {
                await db.collection("simas_pops").doc(newIdStr).collection("evidencia_chunks").doc(`chunk_${i}`).set({
                    data: evChunks[i],
                    index: i
                });
            }
        }

        // --- 2. VALIDAÇÃO REAL APÓS UPLOAD ---
        if (chunks.length > 0) {
            showToast("Verificando integridade na nuvem...", "info");
            const snapshot = await db.collection("simas_pops").doc(newIdStr).collection("chunks").get();
            
            // Validar exclusivamente os índices necessários (0 a numChunks - 1)
            let validationDocs = [];
            const indexSet = new Set();
            
            snapshot.forEach(doc => {
                const d = doc.data();
                if (typeof d.index === 'number' && d.index >= 0 && d.index < chunks.length) {
                    if (indexSet.has(d.index)) {
                        throw new Error(`Validação Pós-Upload Falhou: Duplicidade de chunk detectada no índice ${d.index}.`);
                    }
                    indexSet.add(d.index);
                    validationDocs.push(d);
                }
            });

            if (validationDocs.length !== chunks.length) {
                throw new Error(`Validação Pós-Upload Falhou: Fragmentos incompletos. Esperado: ${chunks.length}, Válidos: ${validationDocs.length}. O processo foi interrompido antes do final.`);
            }

            validationDocs.sort((a, b) => a.index - b.index);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = validationDocs[i];
                if (chunk === undefined || chunk.index !== i || !chunk.data) {
                    throw new Error(`Validação Pós-Upload Falhou: Sequência corrompida ou vazia no índice ${i}.`);
                }
            }
        }

        // --- 3. SOMENTE APÓS VALIDAÇÃO COMPLETA: Consolidar RAM, DBStore e UI ---
        if (id) {
            pops[targetIndex] = popToSave;
        } else {
            pops.push(popToSave);
        }

        if (logActionArgs) {
            logAction(logActionArgs[0], logActionArgs[1], logActionArgs[2]);
        }

        await DBStore.setItem("simas_pops", pops);

        closePOPModal();

        if (!id) {
            currentPage = 1;
            clearFilters(false);
        } else {
            applyFilters();
        }
        
        checkExpirationsAndAlert();

        // --- 4. Mensagem de Sucesso ---
        if (!currentUser.isAdmin) {
            showToast(`POP '${codigo}' enviado! Aguardando aprovação do administrador.`, "success");
        } else {
            showToast(`POP '${codigo}' salvo na nuvem com sucesso!`, "success");
        }

    } catch (e) {
        console.error("Erro ao salvar POP:", e);
        showToast("Erro crítico no upload: " + e.message, "error");
        // O estado anterior da RAM e do DBStore não foi alterado, então não precisamos dar rollback no array.
        // O pop simplesmente não foi efetivado na interface local se a nuvem falhou.
    }
}

function openDetailsModal(id) {
    try {
        const pop = pops.find(p => p.id === id);
        if (!pop) return;
        
        document.getElementById("details-codigo").innerText = pop.codigo;
        document.getElementById("details-titulo").innerText = pop.titulo;
        document.getElementById("details-filial").innerText = pop.filial;
        
        const detailsTipoElem = document.getElementById("details-tipo");
        if (detailsTipoElem) {
            const tipoLowerDetails = (pop.tipo || "POP").toLowerCase();
            let tipoIconDetails = "fa-file-lines";
            if (tipoLowerDetails === "anexo") tipoIconDetails = "fa-paperclip";
            else if (tipoLowerDetails === "manual") tipoIconDetails = "fa-book";
            else if (tipoLowerDetails === "fluxo") tipoIconDetails = "fa-diagram-project";
            else if (tipoLowerDetails === "mapa") tipoIconDetails = "fa-map";
            
            detailsTipoElem.innerHTML = `<span class="tipo-badge ${tipoLowerDetails}"><i class="fa-solid ${tipoIconDetails}"></i> ${pop.tipo || "POP"}</span>`;
        }
        
        document.getElementById("details-area").innerText = pop.area;
        let respNormDetails = (pop.responsavel && pop.responsavel.toUpperCase().includes("BRUN")) ? "BRUNO" : pop.responsavel;
        document.getElementById("details-responsavel").innerText = respNormDetails;
        document.getElementById("details-data-revisao").innerText = formatDate(pop.dataRevisao);
        document.getElementById("details-proxima-revisao").innerText = formatDate(pop.proximaRevisao);
        document.getElementById("details-observacoes").innerText = pop.observacoes || "Nenhuma observao ou justificativa documental inserida para este ciclo.";
        document.getElementById("details-filename-lbl").innerText = pop.arquivo;
        
        // Atualiza ícone do anexo no modal de detalhes
        const detailsIconElem = document.getElementById("details-filename-icon");
        if (detailsIconElem) {
            detailsIconElem.className = "fa-solid " + getFileIconClass(pop.arquivo);
        }
        
        const badge = document.getElementById("details-status-badge");
        if (badge) {
            let badgeClass = 'vencido';
            let badgeIcon = 'fa-radiation';
            if (pop.status === 'REVISADO')       { badgeClass = 'revisado';   badgeIcon = 'fa-circle-check'; }
            else if (pop.status === 'AGUARDANDO APROVAÇÃO') { badgeClass = 'validacao';  badgeIcon = 'fa-clock-rotate-left'; }
            else if (pop.status === 'AGUARDANDO TREINAMENTO') { badgeClass = 'treinamento'; badgeIcon = 'fa-user-graduate'; }
            else if (pop.status === 'COPIA NÃƒO CONTROLADA')    { badgeClass = 'aprovado';   badgeIcon = 'fa-circle-check'; }
            else if (pop.status === 'HOMOLOGADO')  { badgeClass = 'homologado'; badgeIcon = 'fa-stamp'; }
            badge.className = `status-badge ${badgeClass}`;
            badge.innerHTML = `<i class="fa-solid ${badgeIcon}"></i> ${pop.status}`;
        }
        
        const container = document.getElementById("details-timeline-container");
        if (container) {
            container.innerHTML = "";
            if (pop.historico && pop.historico.length > 0) {
                const reversed = [...pop.historico].reverse();
                reversed.forEach((h, idx) => {
                    const item = document.createElement("div");
                    item.className = `timeline-item ${idx === 0 ? 'latest' : ''}`;
                    item.innerHTML = `
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <div class="timeline-date-author">
                                <span><i class="fa-regular fa-calendar"></i> ${formatDate(h.data)}</span>
                                <span><i class="fa-regular fa-user"></i> ${h.autor}</span>
                            </div>
                            <div class="timeline-desc">${h.acao}</div>
                        </div>
                    `;
                    container.appendChild(item);
                });
            } else {
                container.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic;">Sem logs de alterações legadas.</p>`;
            }
        }
        
        document.getElementById("details-modal").classList.add("active");
    } catch (e) {
        console.error("Erro ao carregar detalhes do POP:", e);
    }
}

function closeDetailsModal() {
    document.getElementById("details-modal").classList.remove("active");
}

function simulateDocDownload(event) {
    event.preventDefault();
    const f = document.getElementById("details-filename-lbl").innerText;
    showToast(`Baixando anexo '${f}' integrado com SharePoint corporativo...`, "success");
}

function logAction(action, popCodigo, descricao) {
    try {
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        
        const newLog = {
            timestamp,
            usuario: currentUser.name,
            perfil: currentUser.roleName,
            acao: action,
            popCodigo,
            descricao
        };
        
        auditLogs.unshift(newLog);
        SafeStorage.setItem("simas_audit_logs", JSON.stringify(auditLogs));
    } catch (e) {
        console.error("Erro ao registrar log de auditoria:", e);
    }
}

function filterLogs() {
    try {
        const search = document.getElementById("log-search-input").value.toLowerCase().trim();
        const tbody = document.getElementById("audit-logs-body");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        
        const filtered = auditLogs.filter(log => {
            if (!search) return true;
            return (
                log.timestamp.toLowerCase().includes(search) ||
                log.usuario.toLowerCase().includes(search) ||
                log.perfil.toLowerCase().includes(search) ||
                log.acao.toLowerCase().includes(search) ||
                log.popCodigo.toLowerCase().includes(search) ||
                log.descricao.toLowerCase().includes(search)
            );
        });
        
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Nenhum log encontrado.</td></tr>`;
            return;
        }
        
        filtered.forEach(log => {
            const tr = document.createElement("tr");
            let acaoBadge = `<span style="font-size:0.75rem; font-weight:700; color: #b45309; background:#fef3c7; padding:2px 6px; border-radius:4px;">${log.acao}</span>`;
            
            if (log.acao === 'Criao') acaoBadge = `<span style="font-size:0.75rem; font-weight:700; color:#047857; background:#d1fae5; padding:2px 6px; border-radius:4px;"><i class="fa-solid fa-plus-circle"></i> Criação</span>`;
            else if (log.acao === 'Edição') acaoBadge = `<span style="font-size:0.75rem; font-weight:700; color:#1d4ed8; background:#dbeafe; padding:2px 6px; border-radius:4px;"><i class="fa-solid fa-pencil"></i> Edição</span>`;
            else if (log.acao === 'Exclusão') acaoBadge = `<span style="font-size:0.75rem; font-weight:700; color:#b91c1c; background:#fee2e2; padding:2px 6px; border-radius:4px;"><i class="fa-solid fa-trash-can"></i> Exclusão</span>`;
            else if (log.acao === 'Login') acaoBadge = `<span style="font-size:0.75rem; font-weight:700; color:#4b5563; background:#e5e7eb; padding:2px 6px; border-radius:4px;"><i class="fa-solid fa-key"></i> Conexão</span>`;
            else if (log.acao === 'Validao') acaoBadge = `<span style="font-size:0.75rem; font-weight:700; color:#0369a1; background:#e0f2fe; padding:2px 6px; border-radius:4px;"><i class="fa-solid fa-circle-check"></i> Validação</span>`;
            else if (log.acao === 'Permissão') acaoBadge = `<span style="font-size:0.75rem; font-weight:700; color:#6d28d9; background:#ede9fe; padding:2px 6px; border-radius:4px;"><i class="fa-solid fa-user-lock"></i> Permissões</span>`;

            tr.innerHTML = `
                <td><strong style="color:var(--primary); font-family: monospace;">${log.timestamp}</strong></td>
                <td><strong>${log.usuario}</strong></td>
                <td><span class="user-role-badge" style="background:#cbd5e1; color:#1e293b; font-size:0.65rem;">${log.perfil}</span></td>
                <td>${acaoBadge}</td>
                <td><span class="pop-code-cell">${log.popCodigo}</span></td>
                <td style="color:var(--text-secondary); font-size:0.8rem; font-weight: 500;">${log.descricao}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Erro ao buscar logs:", e);
    }
}

function clearLogs() {
    const confirmClear = confirm("Deseja apagar permanentemente a trilha de auditoria local de homologação?");
    if (confirmClear) {
        auditLogs = [];
        SafeStorage.removeItem("simas_audit_logs");
        logAction("Logs Limpos", "-", "O usuário redefiniu a trilha de auditoria local.");
        renderLogsTable();
        showToast("Histórico de auditoria local limpo.", "success");
    }
}

function exportToCSV() {
    try {
        logAction("Exportao", "-", "Exportou catálogo de POPs para planilha Excel.");
        let csv = "\uFEFF"; // BOM
        csv += "Código;Título;Filial;Tipo;ÁÁrea;Responsável;Data de Revisão;Próxima Revisão;Status;Observações\r\n";
        
        filteredPops.forEach(pop => {
            const row = [
                `"${pop.codigo}"`,
                `"${pop.titulo}"`,
                `"${pop.filial}"`,
                `"${pop.tipo || "POP"}"`,
                `"${pop.area}"`,
                `"${pop.responsavel}"`,
                `"${formatDate(pop.dataRevisao)}"`,
                `"${formatDate(pop.proximaRevisao)}"`,
                `"${pop.status}"`,
                `"${(pop.observacoes || "").replace(/"/g, '""')}"`
            ];
            csv += row.join(";") + "\r\n";
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `pops_simas_logistica_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast("Planilha gerada e baixada com sucesso.", "success");
    } catch (e) {
        console.error("Erro ao exportar CSV:", e);
        showToast("Erro ao gerar planilha. Tente novamente.", "danger");
    }
}

function exportMasterList(filialKey = 'MATRIZ') {
    try {
        logAction("Exportação", "-", "Gerou a Lista Mestre Geral de POPs em PDF para a filial " + filialKey);
        
        if (!window.jspdf || !window.jspdf.jsPDF) {
            showToast('Erro: Biblioteca jsPDF não carregada.', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4'); 
        
        // 1. Cabeçalho
        doc.setDrawColor(11, 29, 50); 
        doc.setLineWidth(0.5);
        doc.rect(14, 14, 269, 25); 
        
        // Linha divisória vertical
        doc.line(180, 14, 180, 39);
        
        // Logo Simas (Nova Logo Azul)
        try {
            const base64Data = "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";
            doc.addImage(base64Data, 'PNG', 20, 17, 50, 18);
        } catch(e) {
            console.error("Erro ao adicionar logo no PDF", e);
        }
        
        // Título Central
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(11, 29, 50);
        doc.text("LISTA MESTRA DE CONTROLE DE POPs", 125, 27, { align: 'center' });
        
        // Caixa de Informações (Direita) - Reaproveitando a estrutura das filiais
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        const headerPrefix = MASTER_LIST_BRANCH_PREFIXES[filialKey] || "MT";
        const correctDocCode = headerPrefix + " FM LM 00";
        const currentDate = new Date().toLocaleDateString('pt-BR');
        
        const dataF = {
            doc: correctDocCode,
            versao: "01",
            emissao: currentDate
        };

        doc.text("Doc:", 185, 19);
        doc.setFont('helvetica', 'normal');
        doc.text(dataF.doc, 195, 19);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Versão:", 185, 24);
        doc.setFont('helvetica', 'normal');
        doc.text(dataF.versao, 200, 24);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Emissão:", 185, 29);
        doc.setFont('helvetica', 'normal');
        doc.text(dataF.emissao, 202, 29);
        
        // 2. Tabela de POPs - Filtrada por filial/prefixo
        const prefixMap = {
            "SOROCABA": "SC",
            "CAMAÃ‡ARI": "CAM",
            "CAMACARI": "CAM",
            "CAMAÇARI": "CAM",
            "SÃƒO ROQUE": "SR",
            "SAO ROQUE": "SR",
            "SÃO ROQUE": "SR",
            "SJP PREFEITURA": "SJP",
            "TIGRE": "TG",
            "JUATUBA": "JB",
            "GOVERNADOR VALADARES": "GV",
            "FUNEAS": "PR",
            "MATRIZ": "MT"
        };
        const prefix = prefixMap[filialKey];
        
        const filteredPops = pops.filter(pop => {
            if (!pop) return false;
            
            // Verifica pela property filial
            let matchesFilial = false;
            if (pop.filial) {
                const pFilial = pop.filial.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase();
                const fKey = filialKey.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase();
                matchesFilial = pFilial === fKey || pFilial.includes(fKey);
            }
            
            // Verifica pelo prefixo do código do POP (Ex: "SC POP RH...")
            let matchesPrefix = false;
            if (pop.codigo && prefix) {
                // Checa se comeca exatamente com a inicial e depois um espaco ou traco
                matchesPrefix = pop.codigo.toUpperCase().startsWith(prefix);
            }
            
            return matchesFilial || matchesPrefix;
        });

        const tableRows = [];
        filteredPops.forEach(pop => {
            tableRows.push([
                pop.codigo || "-",
                pop.titulo || "-",
                pop.filial || "-",
                pop.tipo || "POP",
                pop.area || "-",
                pop.responsavel || "-",
                formatDate(pop.dataRevisao) || "-",
                formatDate(pop.proximaRevisao) || "-",
                pop.status || "-"
            ]);
        });
        
        if (tableRows.length === 0) {
            tableRows.push(["Nenhum documento encontrado para esta filial", "", "", "", "", "", "", "", ""]);
        }
        
        // AutoTable
        doc.autoTable({
            startY: 45,
            head: [['Código', 'Título', 'Filial', 'Tipo', 'Área', 'Responsável', 'Data Revisão', 'Próx. Revisão', 'Status']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [11, 29, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                1: { cellWidth: 50 }
            }
        });
        
        // Salvar Arquivo
        doc.save(`Lista_Mestre_POPs_${filialKey}_${new Date().toISOString().split('T')[0]}.pdf`);
        
        showToast("Lista Mestre em PDF gerada com sucesso.", "success");
    } catch (e) {
        console.error("Erro ao exportar Lista Mestre:", e);
        showToast("Erro ao gerar Lista Mestre. Tente novamente.", "danger");
    }
}

function openModeloAvaliacaoModal() {
    document.getElementById("modelo-avaliacao-filial").value = "";
    document.getElementById("modelo-avaliacao-modal").classList.add("active");
}

function closeModeloAvaliacaoModal() {
    document.getElementById("modelo-avaliacao-modal").classList.remove("active");
}

function downloadModeloAvaliacao() {
    const filial = document.getElementById("modelo-avaliacao-filial").value;
    
    if (!filial) {
        showToast("Selecione uma filial para baixar o Modelo de Avaliação.", "error");
        return;
    }
    
    // Mapa específico para o Modelo de Avaliação
    const filialParaPrefixo = {
        "MATRIZ": "MT",
        "SAO ROQUE": "SR",
        "SOROCABA": "SC",
        "CAMACARI": "CAM",
        "FUNEAS": "PR",
        "SJP PREFEITURA": "SJP",
        "GOVERNADOR VALADARES": "GV",
        "JUATUBA": "JB"
    };
    
    const prefixo = filialParaPrefixo[filial];
    if (!prefixo) {
        showToast("Prefixo não encontrado para a filial selecionada.", "error");
        return;
    }
    
    const fileName = `${prefixo}_003_RH.ANX3_REV_03.docx`;
    const filePath = `./modelos/${fileName}`;
    
    const link = document.createElement("a");
    link.setAttribute("href", filePath);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Modelo de Avaliação (${filial}) baixado com sucesso!`, "success");
    logAction("Download", "MODELO_AVALIACAO", `Realizou o download do Modelo de Avaliação da filial ${filial}.`);
    
    closeModeloAvaliacaoModal();
}

async function downloadModeloImportacaoPOPs() {
    try {
        if (typeof XLSX === 'undefined') {
            showToast("Biblioteca Excel não carregada.", "error");
            return;
        }

        const headers = [
            ["Código", "Título", "Abrangência", "Filial", "Tipo", "Área", "Responsável", "Data Revisão", "Próx. Revisão", "Status", "URL Documento"]
        ];

        const ws = XLSX.utils.aoa_to_sheet(headers);

        const wscols = [
            {wch: 15}, // Código
            {wch: 40}, // Título
            {wch: 15}, // Abrangência
            {wch: 15}, // Filial
            {wch: 15}, // Tipo
            {wch: 20}, // Área
            {wch: 20}, // Responsável
            {wch: 15}, // Data Revisão
            {wch: 15}, // Próx. Revisão
            {wch: 20}, // Status
            {wch: 50}  // URL Documento
        ];
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo POPs");

        XLSX.writeFile(wb, "Modelo_Importacao_POPs.xlsx");
        showToast("Modelo de importação baixado com sucesso.", "success");
    } catch (e) {
        console.error("Erro ao gerar modelo:", e);
        showToast("Erro ao gerar modelo de importação.", "error");
    }
}

async function downloadPOP(id) {
    try {
        const pop = pops.find(p => p.id === id);
        if (!pop) return;

        showToast(`Baixando fragmentos seguros: ${pop.arquivo || 'documento_simas'}...`, "info");

        let fileData = pop.fileData; // Caso seja um fallback antigo

        // Se usar o novo sistema de chunks do Firestore
        if (pop.numChunks && pop.numChunks > 0) {
            
            // Otimização: Única consulta para baixar todos os chunks de uma vez
            const snapshot = await db.collection("simas_pops").doc(id).collection("chunks").get();
            
            // Validação 1: Quantidade MÍNIMA de chunks
            if (snapshot.size < pop.numChunks) {
                showToast(`Erro de Integridade: Fragmentos incompletos. Esperado: ${pop.numChunks}, Encontrado: ${snapshot.size}`, "error");
                return;
            }

            let chunkDocs = [];
            const indexSet = new Set();
            let temErroDuplicidade = false;

            snapshot.forEach(doc => {
                const d = doc.data();
                // Ignora resíduos históricos >= pop.numChunks
                if (typeof d.index === 'number' && d.index >= 0 && d.index < pop.numChunks) {
                    if (indexSet.has(d.index)) {
                        temErroDuplicidade = true;
                    }
                    indexSet.add(d.index);
                    chunkDocs.push(d);
                }
            });

            // Validação 2: Duplicidade
            if (temErroDuplicidade) {
                showToast(`Erro de Integridade: Múltiplos fragmentos com o mesmo índice encontrados.`, "error");
                return;
            }

            // Validação 3: Quantidade exata filtrada
            if (chunkDocs.length !== pop.numChunks) {
                showToast(`Erro de Integridade: Faltam fragmentos úteis. Esperado: ${pop.numChunks}, Encontrados válidos: ${chunkDocs.length}`, "error");
                return;
            }

            // Ordenação estrita pelo campo index crescente
            chunkDocs.sort((a, b) => a.index - b.index);

            // Validação 4 e 5: Sequência contínua e existência de 'data' não vazia
            let assembledData = "";
            for (let i = 0; i < pop.numChunks; i++) {
                const chunk = chunkDocs[i];
                if (chunk === undefined || chunk.index !== i || !chunk.data) {
                    showToast(`Erro de Integridade: Sequência quebrada ou conteúdo vazio no índice ${i}.`, "error");
                    return;
                }
                assembledData += chunk.data;
            }

            if (assembledData.length > 0) {
                fileData = assembledData;
            }
        }

        if (fileData) {
            const link = document.createElement("a");
            link.setAttribute("href", fileData);
            link.setAttribute("download", pop.arquivo || `${pop.codigo}_documento`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Download concluído com sucesso!", "success");
        } else {
            showToast("Erro: Este POP não possui um arquivo anexado.", "error");
        }

        logAction("Download", pop.codigo, `Realizou o download do documento corporativo ${pop.codigo}.`);
    } catch (e) {
        console.error("Erro ao baixar POP:", e);
        showToast("Falha ao reconstruir o arquivo da nuvem.", "error");
    }
}

async function downloadPOPEvidencia(id) {
    try {
        const pop = pops.find(p => p.id === id);
        if (!pop) return;
        
        if (!pop.evidencia) {
            showToast("Erro: Este POP não possui Evidência de Treinamento anexada.", "error");
            return;
        }

        showToast(`Baixando fragmentos seguros: ${pop.evidencia}...`, "info");
        
        let fileData = null; 
        
        if (pop.numEvidenciaChunks && pop.numEvidenciaChunks > 0) {
            let assembledData = "";
            for (let i = 0; i < pop.numEvidenciaChunks; i++) {
                const chunkDoc = await db.collection("simas_pops").doc(id).collection("evidencia_chunks").doc(`chunk_${i}`).get();
                if (chunkDoc.exists) {
                    assembledData += chunkDoc.data().data;
                }
            }
            if (assembledData.length > 0) {
                fileData = assembledData;
            }
        }
        
        if (fileData) {
            const link = document.createElement("a");
            link.setAttribute("href", fileData);
            link.setAttribute("download", pop.evidencia);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Download da evidência concluído com sucesso!", "success");
        } else {
            showToast("Falha: Dados da evidência corrompidos ou não encontrados.", "error");
        }
        
        logAction("Download", pop.codigo, `Realizou o download da Evidência de Treinamento do POP ${pop.codigo}.`);
    } catch (e) {
        console.error("Erro ao baixar Evidência:", e);
        showToast("Falha ao reconstruir o arquivo da nuvem.", "error");
    }
}



function applyTrainingFilters() {
    try {
        if (activeView !== 'trainings') return;
        
        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
        
        const mesVal = getVal("filter-training-mes");
        const tipoVal = getVal("filter-training-tipo");
        const searchVal = getVal("training-search-input").toLowerCase().trim();
        
        filteredTrainings = trainings.filter(t => {
            if (mesVal && t.mes !== mesVal) return false;
            if (tipoVal && t.tipo !== tipoVal) return false;
            
            if (searchVal) {
                const tema = String(t.tema || "").toLowerCase();
                const trilha = String(t.trilha || "").toLowerCase();
                if (!tema.includes(searchVal) && !trilha.includes(searchVal)) return false;
            }
            return true;
        });
        
        if (typeof updateTrainingDashboard === 'function') updateTrainingDashboard();
        renderTrainingsTable();
    } catch (e) {
        console.error("Erro ao aplicar filtros de treinamento:", e);
    }
}

function clearTrainingFilters() {
    document.getElementById("filter-training-mes").value = "";
    document.getElementById("filter-training-tipo").value = "";
    document.getElementById("training-search-input").value = "";
    applyTrainingFilters();
}

function renderTrainingsTable() {
    const tbody = document.getElementById("trainings-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (filteredTrainings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-chalkboard-user" style="font-size: 2rem; display: block; margin-bottom: 8px; color: var(--text-light);"></i>
                    Nenhum Treinamento localizado com os filtros atuais.
                </td>
            </tr>
        `;
        return;
    }
    
    filteredTrainings.forEach(t => {
        const tr = document.createElement("tr");
        
        let editBtn = `<button class="btn-icon" onclick="openTrainingModal('${t.id}')" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>`;
        let deleteBtn = `<button class="btn-icon delete" onclick="deleteTraining('${t.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>`;
        
        if (currentUser && currentUser.role === 'visualizacao') {
            editBtn = "";
            deleteBtn = "";
        }
        
        const badgeTipoClass = (t.tipo === "Formação") ? "tipo-badge manual" : 
                              (t.tipo === "Reciclagem") ? "tipo-badge pop" : "tipo-badge anexo";
                              
        const badgeModalidade = t.modalidade === "Online" ? 
            `<span style="color: #0284c7; font-weight:600;"><i class="fa-solid fa-laptop"></i> Online</span>` :
            `<span style="color: #166534; font-weight:600;"><i class="fa-solid fa-users"></i> Presencial</span>`;
            
        tr.innerHTML = `
            <td style="font-weight: 600;">${t.mes || "-"}</td>
            <td><strong style="color: var(--navy-deep);">${t.tema || "-"}</strong></td>
            <td>${t.trilha || "-"}</td>
            <td><span class="${badgeTipoClass}">${t.tipo || "-"}</span></td>
            <td>${badgeModalidade}</td>
            <td style="text-align:center;">${formatDate(t.dataAplicacao)}</td>
            <td style="text-align:center;">${formatDate(t.dataPrevista)}</td>
            <td style="text-align:center;">${formatDate(t.dataRealizacao)}</td>
            <td style="text-align: center;">
                <div class="action-buttons" style="display: flex; gap: 6px; justify-content: center;">
                    ${editBtn}
                    ${deleteBtn}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openTrainingModal(id = null) {
    const modal = document.getElementById("training-modal");
    if (!modal) return;
    
    const filialSel = document.getElementById("training-filial");
    if (filialSel) {
        filialSel.innerHTML = '<option value="Todas">Todas</option>';
        if (typeof branches !== 'undefined') {
            branches.forEach(b => {
                filialSel.innerHTML += `<option value="${b.name}">${b.name}</option>`;
            });
        }
    }
    
    if (id) {
        const t = trainings.find(x => x.id === id);
        if (t) {
            document.getElementById("training-modal-title").innerHTML = `<i class="fa-solid fa-pen"></i> Editar Treinamento`;
            document.getElementById("training-id").value = t.id;
            if (document.getElementById("training-filial")) document.getElementById("training-filial").value = t.filial || "Todas";
            document.getElementById("training-tema").value = t.tema || "";
            document.getElementById("training-mes").value = t.mes || "";
            document.getElementById("training-trilha").value = t.trilha || "";
            document.getElementById("training-tipo").value = t.tipo || "";
            document.getElementById("training-modalidade").value = t.modalidade || "Presencial";
            document.getElementById("training-data-aplicacao").value = t.dataAplicacao || "";
            document.getElementById("training-data-prevista").value = t.dataPrevista || "";
            document.getElementById("training-data-realizacao").value = t.dataRealizacao || "";
        }
    } else {
        document.getElementById("training-modal-title").innerHTML = `<i class="fa-solid fa-chalkboard-user"></i> Agendar Novo Treinamento`;
        document.getElementById("training-id").value = "";
        if (document.getElementById("training-filial")) document.getElementById("training-filial").value = "Todas";
        document.getElementById("training-tema").value = "";
        document.getElementById("training-mes").value = "";
        document.getElementById("training-trilha").value = "";
        document.getElementById("training-tipo").value = "";
        document.getElementById("training-modalidade").value = "Presencial";
        document.getElementById("training-data-aplicacao").value = "";
        document.getElementById("training-data-prevista").value = "";
        document.getElementById("training-data-realizacao").value = "";
    }
    
    modal.classList.add("active");
}

function closeTrainingModal() {
    const modal = document.getElementById("training-modal");
    if (modal) modal.classList.remove("active");
}

async function saveTraining() {
    try {
        if (currentUser && currentUser.role === 'visualizacao') {
            showToast("Você não tem permissão para cadastrar treinamentos.", "error");
            return;
        }
        
        const btn = document.getElementById("btn-save-training");
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;
        
        const id = document.getElementById("training-id").value;
        const filialEl = document.getElementById("training-filial");
        const filial = filialEl ? filialEl.value : "Todas";
        const tema = document.getElementById("training-tema").value.trim();
        const mes = document.getElementById("training-mes").value;
        const trilha = document.getElementById("training-trilha").value.trim();
        const tipo = document.getElementById("training-tipo").value;
        const modalidade = document.getElementById("training-modalidade").value;
        const dataAplicacao = document.getElementById("training-data-aplicacao").value;
        const dataPrevista = document.getElementById("training-data-prevista").value;
        const dataRealizacao = document.getElementById("training-data-realizacao").value;
        
        if (!tema || !mes || !tipo || !modalidade || !dataPrevista) {
            showToast("Preencha todos os campos obrigatórios (marcados com *).", "warning");
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar Treinamento`;
            return;
        }
        
                const trainingObj = {
            filial,
            tema,
            mes,
            trilha,
            tipo,
            modalidade,
            dataAplicacao,
            dataPrevista,
            dataRealizacao,
            updatedAt: new Date().toISOString()
        };
        
        if (id) {
            trainingObj.id = id;
            const idx = trainings.findIndex(t => t.id === id);
            if (idx !== -1) {
                // Preservar createdAt
                trainingObj.createdAt = trainings[idx].createdAt || new Date().toISOString();
                trainings[idx] = trainingObj;
            } else {
                trainings.push(trainingObj);
            }
        } else {
            trainingObj.id = 'train-' + Date.now();
            trainingObj.createdAt = new Date().toISOString();
            trainings.push(trainingObj);
        }
        
        // Fora reordenao e atualizao do DB local
        trainings.sort((a, b) => new Date(b.dataAplicacao) - new Date(a.dataAplicacao));
        DBStore.setItem("simas_trainings", trainings);
        
        if (typeof db !== 'undefined') {
            await db.collection("simas_trainings").doc(trainingObj.id).set(trainingObj);
            showToast("Treinamento salvo com sucesso!", "success");
            logAction("Treinamento", trainingObj.tema, `Agendou/Editou o treinamento: ${trainingObj.tema}`);
            if (typeof applyTrainingFilters === 'function') applyTrainingFilters();
        } else {
            showToast("Treinamento salvo com sucesso! (Modo Offline Local)", "success");
            logAction("Treinamento", trainingObj.tema, `Agendou/Editou treinamento (Offline): ${trainingObj.tema}`);
            if (typeof applyTrainingFilters === 'function') applyTrainingFilters();
        }
        
        closeTrainingModal();
    } catch (e) {
        console.error("Erro ao salvar treinamento:", e);
        showToast("Erro ao salvar. Verifique sua conexão.", "error");
    } finally {
        const btn = document.getElementById("btn-save-training");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar Treinamento`;
        }
    }
}

async function deleteTraining(id) {
    if (!confirm("Tem certeza que deseja excluir permanentemente este treinamento?")) return;
    
    try {
        trainings = trainings.filter(t => t.id !== id);
        DBStore.setItem("simas_trainings", trainings);
        
        if (typeof db !== 'undefined') {
            await db.collection("simas_trainings").doc(id).delete();
            showToast("Treinamento excluído com sucesso.", "success");
        } else {
            showToast("Treinamento excluído (Modo Offline Local).", "success");
            if (typeof applyTrainingFilters === 'function') applyTrainingFilters();
        }
    } catch (e) {
        console.error("Erro ao excluir treinamento:", e);
        showToast("Erro ao excluir treinamento.", "error");
    }
}

function updateTrainingDashboard() {
    if (!document.getElementById('dash-total-trainings')) return;
    
    let total = trainings.length;
    let aplicados = 0;
    let atrasados = 0;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    trainings.forEach(t => {
        // Regra 1: Aplicado = Data de Realização preenchida
        if (t.dataRealizacao && t.dataRealizacao.trim() !== '') {
            aplicados++;
        } else {
            // Regra 3: Atrasado = Data Prevista < Hoje E não realizado
            if (t.dataPrevista) {
                const prevDate = new Date(t.dataPrevista + 'T00:00:00');
                if (prevDate < hoje) {
                    atrasados++;
                }
            }
        }
    });
    
    document.getElementById('dash-total-trainings').innerText = total;
    document.getElementById('dash-applied-trainings').innerText = aplicados;
    document.getElementById('dash-delayed-trainings').innerText = atrasados;
}

function downloadTrainingTemplate() {
    // Cria uma planilha vazia com cabeçalhos corretos
    const headers = [
        'Mês (Ex: Janeiro)',
        'Tema do Treinamento',
        'Trilha',
        'Tipo (Formação, Reciclagem, Ação Pontual)',
        'Modalidade (Presencial, Online, Híbrido)',
        'Data Aplicação (DD-MM-YYYY)',
        'Data Prevista (DD-MM-YYYY)',
        'Data Realização (DD-MM-YYYY)'
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo Treinamentos');
    
    XLSX.writeFile(wb, 'Modelo_Importacao_Treinamentos.xlsx');
}

async function importTrainingsExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (currentUser && currentUser.role === 'visualizacao') {
        showToast('Sem permissão para importar.', 'error');
        return;
    }
    
    showToast('Lendo planilha, aguarde...', 'info');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            
            // Converte para JSON (pula a linha de cabeçalho via header: 1)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            
            if (jsonData.length <= 1) {
                showToast('A planilha parece estar vazia.', 'warning');
                return;
            }
            
            let countImported = 0;
            
            // Helper local para conversão de datas (DD-MM-YYYY ou serial do Excel -> YYYY-MM-DD)
            const parseExcelDate = (val) => {
                if (!val) return '';
                if (typeof val === 'number') {
                    const jsDate = new Date(Date.UTC(1899, 11, 30));
                    jsDate.setTime(jsDate.getTime() + val * 86400000);
                    return `${jsDate.getUTCFullYear()}-${String(jsDate.getUTCMonth() + 1).padStart(2, '0')}-${String(jsDate.getUTCDate()).padStart(2, '0')}`;
                }
                const str = String(val).trim();
                if (str.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)) {
                    const p = str.split(/[\/\-]/);
                    return `${p[2]}-${p[1]}-${p[0]}`;
                }
                if (str.match(/^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/)) {
                    const p = str.split(/[\/\-]/);
                    return `${p[0]}-${p[1]}-${p[2]}`;
                }
                return str;
            };
            
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0 || !row[1]) continue; // Pula linha vazia
                
                const trainingObj = {
                    id: 'train-' + Date.now() + '-' + i,
                    mes: row[0] || '',
                    tema: row[1] || 'Tema não informado',
                    trilha: row[2] || '',
                    tipo: row[3] || 'Formação',
                    modalidade: row[4] || 'Presencial',
                    dataAplicacao: parseExcelDate(row[5]),
                    dataPrevista: parseExcelDate(row[6]),
                    dataRealizacao: parseExcelDate(row[7]),
                    createdAt: new Date().toISOString()
                };
                
                                if (typeof db !== 'undefined') {
                    await db.collection('simas_trainings').doc(trainingObj.id).set(trainingObj);
                }
                
                // Atualiza o array local imediatamente para garantir que aparea na tela
                trainings.push(trainingObj);
                countImported++;
            }
            
            // Fora reordenao e atualizao do DB local
            trainings.sort((a, b) => new Date(b.dataAplicacao) - new Date(a.dataAplicacao));
            DBStore.setItem('simas_trainings', trainings);
            applyTrainingFilters();
            
            if (countImported === 0) {
                showToast('Nenhum dado importado. Verifique se a coluna Tema est preenchida na planilha.', 'warning');
            } else {
                showToast(countImported + ' treinamentos importados com sucesso!', 'success');
                logAction('Treinamento', 'Importao', `Importou ${countImported} treinamentos via planilha.`);
            }
            
        } catch (err) {
            console.error('Erro na importação:', err);
            showToast('Erro ao processar a planilha. Verifique o formato.', 'error');
        } finally {
            event.target.value = ''; // Limpa o input
        }
    };
    reader.readAsArrayBuffer(file);
}

function openExportPDFModal(type = 'TRAININGS') {
    currentPDFExportType = type;
    const modal = document.getElementById("pdf-filial-modal");
    if (modal) modal.classList.add("active");
}

function closeExportPDFModal() {
    const modal = document.getElementById("pdf-filial-modal");
    if (modal) modal.classList.remove("active");
}

function generatePDFForFilial() {
    const select = document.getElementById("pdf-filial-select");
    if (select) {
        const filialKey = select.value;
        if (currentPDFExportType === 'MASTER_LIST') {
            exportMasterList(filialKey);
        } else {
            exportTrainingsToPDF(filialKey);
        }
        closeExportPDFModal();
    }
}

function exportTrainingsToPDF(filialKey = 'MATRIZ') {
    try {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            showToast('Erro: Biblioteca jsPDF não carregada.', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4'); // Paisagem para caber a tabela melhor
        
        // 1. Cabeçalho
        // Desenha borda do cabeçalho
        doc.setDrawColor(11, 29, 50); // #0B1D32
        doc.setLineWidth(0.5);
        doc.rect(14, 14, 269, 25); // x, y, w, h
        
        // Linha divisória vertical
        doc.line(180, 14, 180, 39);
        
        // Logo Simas (Nova Azul)
        try {
            const logoNovaAzulB64 = "data:image/png;base64,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";
            const logoParts = logoNovaAzulB64.split(',');
            const base64Data = logoParts.length > 1 ? logoParts[1] : logoParts[0];
            // imageType, x, y, width, height
            doc.addImage(base64Data, 'PNG', 20, 17, 50, 18);
        } catch(e) {
            console.error("Erro ao adicionar logo no PDF", e);
        }
        
        // Título Central
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(11, 29, 50);
        doc.text("CRONOGRAMA DE TREINAMENTOS", 125, 27, { align: 'center' });
        
        // Caixa de Informações (Direita)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        const filialPDFData = {
            "MATRIZ": { doc: "MT FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" },
            "SOROCABA": { doc: "SC FM RH 003.ANX3", rev: "01", elaborado: "16/02/2026", aprovado: "17/02/2026" },
            "SÃƒO ROQUE": { doc: "SR FM RH 003.ANX3", rev: "01", elaborado: "13/11/2024", aprovado: "05/05/2025" },
            "CAMAÃ‡ARI": { doc: "CAM FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" },
            "FUNEAS": { doc: "PR FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" },
            "SJP PREFEITURA": { doc: "SJP FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" }
        };
        const rawDataF = filialPDFData[filialKey] || filialPDFData["MATRIZ"];
        const correctDocCode = TRAINING_DOCUMENT_CODES[filialKey] || "MT FM RH 003.ANX1";
        
        const dataF = {
            doc: correctDocCode,
            rev: rawDataF.rev,
            elaborado: rawDataF.elaborado,
            aprovado: rawDataF.aprovado
        };

        doc.text("Doc:", 185, 19);
        doc.setFont('helvetica', 'normal');
        doc.text(dataF.doc, 195, 19);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Revisão:", 185, 24);
        doc.setFont('helvetica', 'normal');
        doc.text(dataF.rev, 200, 24);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Elaborado em:", 185, 29);
        doc.setFont('helvetica', 'normal');
        doc.text(dataF.elaborado, 210, 29);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Aprovado em:", 185, 34);
        doc.setFont('helvetica', 'normal');
        doc.text(dataF.aprovado, 208, 34);
        
        // 2. Tabela de Treinamentos
        // Preparando os dados
        const tableData = filteredTrainings && filteredTrainings.length > 0 
                          ? filteredTrainings 
                          : trainings;
                          
        const tableRows = [];
        tableData.forEach(t => {
            let statusName = "Previsto";
            if (t.status === 'realizado') statusName = "Realizado";
            if (t.status === 'atrasado') statusName = "Atrasado";
            if (t.status === 'cancelado') statusName = "Cancelado";
            
            tableRows.push([
                t.tema || '-',
                t.trilha || '-',
                t.tipo || '-',
                t.modalidade || '-',
                t.mes || '-',
                t.dataPrevista ? formatDate(t.dataPrevista) : '-',
                statusName
            ]);
        });
        
        // AutoTable
        doc.autoTable({
            startY: 45,
            head: [['Tema do Treinamento', 'Trilha', 'Tipo', 'Modalidade', 'Mês', 'Data Prevista', 'Status']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [11, 29, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });
        
        // Salvar Arquivo
        doc.save('Cronograma_Treinamentos_Simas.pdf');
        
        showToast('Cronograma em PDF gerado com sucesso!', 'success');
        
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        showToast('Erro ao gerar o PDF. Verifique o console.', 'error');
    }
}

async function approvePOP(id) {
    if (!currentUser.isAdmin) {
        showToast("Acesso negado: Apenas administradores podem aprovar.", "error");
        return;
    }
    
    if (confirm("Você confirma a aprovação e revisão deste POP? O status mudará para REVISADO.")) {
        try {
            const popIndex = pops.findIndex(p => p.id === id);
            if (popIndex === -1) return;
            
            pops[popIndex].status = "REVISADO";
            
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
            pops[popIndex].dataRevisao = dateStr;
            
            if (!pops[popIndex].historico) pops[popIndex].historico = [];
            pops[popIndex].historico.unshift({
                data: dateStr,
                autor: currentUser.name,
                detalhe: "POP aprovado e revisado pelo administrador."
            });
            
            DBStore.setItem("simas_pops", pops);
            
            if (typeof db !== 'undefined') {
                await db.collection("simas_pops").doc(id).update({
                    status: "REVISADO",
                    dataRevisao: dateStr,
                    historico: pops[popIndex].historico
                });
            }
            
            showToast("POP aprovado com sucesso!", "success");
            logAction("Aprovação", pops[popIndex].codigo, "POP aprovado pelo administrador");
            
            renderPopsTable();
            renderDashboardStats();
        } catch (e) {
            console.error(e);
            showToast("Erro ao aprovar POP", "error");
        }
    }
}

async function handleBulkImportSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check permissions
    if (!currentUser.permissions.create) {
        showToast("Nível de acesso insuficiente para realizar importações em massa.", "error");
        document.getElementById("bulk-import-file").value = "";
        return;
    }
    
    showToast("Lendo arquivo Excel...", "info");
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Expected headers are not strictly enforced by name, we assume column order or specific names if possible
            // To be robust, let's read the raw array of arrays to map columns by index, or by header matching.
            // Using header: 1 gives an array of arrays
            const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ""});
            
            if (rows.length < 2) {
                showToast("A planilha parece estar vazia ou sem dados válidos.", "error");
                return;
            }
            
            // Assume Row 0 is header.
            // Find column indexes based on keywords to make it flexible
            const normalizeStr = (str) => String(str).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const headers = rows[0].map(normalizeStr);
            
            const idxCodigo = headers.findIndex(h => h.includes("CODIGO"));
            const idxTitulo = headers.findIndex(h => h.includes("TITULO"));
            const idxFilial = headers.findIndex(h => h.includes("FILIAL"));
            const idxTipo = headers.findIndex(h => h.includes("TIPO"));
            const idxAbrangencia = headers.findIndex(h => h.includes("ABRANGENCIA"));
            const idxArea = headers.findIndex(h => h.includes("AREA"));
            const idxResp = headers.findIndex(h => h.includes("RESPONSAVEL"));
            const idxStatus = headers.findIndex(h => h.includes("STATUS"));
            const idxDataRev = headers.findIndex(h => h.includes("DATA") && h.includes("REVIS"));
            
            if (idxCodigo === -1 || idxTitulo === -1 || idxArea === -1) {
                showToast("A planilha precisa ter pelo menos as colunas: Código, Título e Área.", "error");
                return;
            }
            
            let successCount = 0;
            let skippedCount = 0;
            
            const todayStr = new Date().toISOString().split('T')[0];
            
            // Find max ID to start from
            let maxNum = pops.reduce((max, p) => {
                const num = parseInt(p.id.replace("pop-", ""), 10);
                return isNaN(num) ? max : Math.max(max, num);
            }, 0);
            
            showToast("Iniciando importação em lote...", "info");
            
            // Iterate rows starting from index 1
            for (let i = 1; i < rows.length; i++) {
                const r = rows[i];
                if (!r || r.length === 0) continue;
                
                const codigo = r[idxCodigo] ? String(r[idxCodigo]).trim().toUpperCase() : "";
                if (!codigo) continue; // Skip empty rows
                
                // Check for duplicates
                if (pops.some(p => p.codigo === codigo)) {
                    skippedCount++;
                    continue; // Skip existing
                }
                
                const titulo = r[idxTitulo] ? String(r[idxTitulo]).trim() : "Sem Título";
                const filial = idxFilial !== -1 && r[idxFilial] ? String(r[idxFilial]).trim() : "MATRIZ (SÃƒO PAULO)";
                const tipo = idxTipo !== -1 && r[idxTipo] ? String(r[idxTipo]).trim() : "POP";
                const abrangencia = idxAbrangencia !== -1 && r[idxAbrangencia] ? String(r[idxAbrangencia]).trim() : "Global";
                const area = r[idxArea] ? String(r[idxArea]).trim() : "Não Informada";
                const responsavel = idxResp !== -1 && r[idxResp] ? String(r[idxResp]).trim() : "N/A";
                const status = idxStatus !== -1 && r[idxStatus] ? String(r[idxStatus]).trim().toUpperCase() : "AGUARDANDO APROVAÇÃO";
                
                // Tratar Data de Revisão
                let dataRevisao = todayStr;
                if (idxDataRev !== -1 && r[idxDataRev]) {
                    // Excel dates might be numbers or strings
                    let d = r[idxDataRev];
                    if (typeof d === 'number') {
                        const date = new Date(Math.round((d - 25569) * 86400 * 1000));
                        dataRevisao = date.toISOString().split('T')[0];
                    } else if (typeof d === 'string') {
                        // Assuming DD/MM/YYYY
                        const parts = d.split('/');
                        if (parts.length === 3) dataRevisao = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                        else dataRevisao = d; // fallback
                    }
                }
                
                // Calculate next revision (+2 years)
                let proximaRevisao = "";
                try {
                    let dRev = new Date(dataRevisao);
                    if (!isNaN(dRev.getTime())) {
                        dRev.setFullYear(dRev.getFullYear() + 2);
                        proximaRevisao = dRev.toISOString().split('T')[0];
                    }
                } catch(e){}
                
                maxNum++;
                const newIdStr = "pop-" + String(maxNum).padStart(3, '0');
                
                const popToSave = {
                    id: newIdStr,
                    codigo,
                    titulo,
                    filial,
                    tipo,
                    abrangencia,
                    area,
                    responsavel,
                    status,
                    dataRevisao,
                    proximaRevisao,
                    observacoes: "Importado via planilha de lote.",
                    arquivo: null, // No file attached during bulk import
                    historico: [
                        { data: todayStr, autor: `${currentUser.name} (${currentUser.roleName})`, acao: `Criação documental primária via importação em massa.` }
                    ]
                };
                
                // Save to Firebase
                if (typeof db !== 'undefined') {
                    await db.collection("simas_pops").doc(newIdStr).set(popToSave);
                }
                
                pops.push(popToSave);
                successCount++;
            }
            
            DBStore.setItem('simas_pops', pops);
            applyFilters();
            renderMetricsGrid();
            
            showToast(`Importação Concluída: ${successCount} salvos, ${skippedCount} ignorados (já existiam).`, "success");
            
        } catch (err) {
            console.error("Erro na leitura da planilha:", err);
            showToast("Erro ao processar o arquivo Excel.", "error");
        }
        
        // Reset input
        document.getElementById("bulk-import-file").value = "";
    };
    reader.onerror = function() {
        showToast("Erro ao ler o arquivo local.", "error");
        document.getElementById("bulk-import-file").value = "";
    };
    reader.readAsArrayBuffer(file);
}

function setSelectValue(selectId, targetValue) {
    const select = document.getElementById(selectId);
    if (!select) return;
    if (!targetValue) {
        select.value = "";
        return;
    }
    
    // First, exact match
    select.value = targetValue;
    if (select.value === targetValue) return;
    
    // Normalize string (remove accents and make uppercase)
    const normalize = str => str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    const targetNorm = normalize(targetValue);
    
    for (let i = 0; i < select.options.length; i++) {
        if (normalize(select.options[i].value) === targetNorm || normalize(select.options[i].text) === targetNorm) {
            select.selectedIndex = i;
            return;
        }
    }
    
    // Fallback: leave empty if completely unmatched
    select.value = "";
}





function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return weekNo;
}

function exportOprPdf(id) {
    // Abre e depois imprime
    openOprForm(id);
    setTimeout(() => {
        window.print();
    }, 500);
}

function cancelOprEdit() {
    const historyList = document.getElementById('opr-history-list');
    const mainContent = document.getElementById('opr-main-content');
    
    if (historyList && mainContent) {
        mainContent.style.display = 'none';
        historyList.style.display = 'block';
        renderOprHistoryList();
    }
}

function updateBranchManager(branchName, newName) {
    const branch = OPR_BRANCHES.find(b => b.name === branchName);
    if (branch) {
        branch.resp = newName;
        localStorage.setItem('simas_opr_branches', JSON.stringify(OPR_BRANCHES));
    }
}




// ==================== NCS FASE 3 RESTORE ====================
let ncUnsubscribe = null;

function startNcListener() {
    if (ncUnsubscribe) return; // já ativo
    if (typeof db !== 'undefined') {
        ncUnsubscribe = db.collection("nonConformities").onSnapshot((snapshot) => {
            try {
                if (!snapshot.empty) {
                    ncs = snapshot.docs.map(doc => {
                        let data = doc.data();
                        data.id = doc.id;
                        return data;
                    });
                } else {
                    ncs = [];
                }
                if (activeView === 'ncs') {
                    applyNcFilters();
                }
                
                // [CORRECAO CIRURGICA - OPR REFRESH RACE CONDITION]
                // Se o listener foi invocado via OPR ou atualizou em background enquanto OPR está aberto,
                // solicita o redesenho dos gráficos (a função possui trava de renderização se a div não existir).
                if (typeof renderizarNcsDashboardOpr === 'function') {
                    renderizarNcsDashboardOpr();
                }





            } catch(e) { console.error("Erro processando NCs:", e); }
        }, (error) => { console.error("Erro listener NCs:", error); });
    }
}

let trainingsUnsubscribe = null;

async function startTrainingsListener() {
    if (trainingsUnsubscribe) return;
    
    // 1. Carrega do cache local IMEDIATAMENTE e DE FORMA ASSÍNCRONA
    try {
        const rawTrainings = await DBStore.getItem("simas_trainings");
        
        let parsedTrainings = rawTrainings;
        if (typeof rawTrainings === 'string') {
            try {
                parsedTrainings = JSON.parse(rawTrainings);
            } catch (parseErr) {
                console.error("Erro ao fazer parse do cache local:", parseErr);
                return; // Aborta para proteger o banco
            }
        }
        
        if (Array.isArray(parsedTrainings)) {
            trainings = parsedTrainings;
            window.trainings = parsedTrainings;
        } else if (parsedTrainings == null) {
            trainings = [];
            window.trainings = [];
        } else {
            console.error("Formato inválido em simas_trainings:", parsedTrainings);
            return; // Aborta para não propagar lixo e não corromper banco
        }
        
        console.log(`[TREINAMENTOS] Cache local carregado: ${trainings.length} registros`);
        
        if (typeof applyTrainingFilters === 'function') applyTrainingFilters();
        
    } catch (e) {
        console.error("Erro ao carregar treinamentos do IndexedDB:", e);
        return; // Retorna imediatamente e NÃO inicia onSnapshot em caso de falha no IndexedDB
    }
    
    // 2. Conecta ao Firebase para manter sincronizado (se disponível)
    if (typeof db !== 'undefined') {
        trainingsUnsubscribe = db.collection("simas_trainings").onSnapshot(async (snapshot) => {
            try {
                console.log(`[TREINAMENTOS] Snapshot Cloud recebido: ${snapshot.size} documentos`);
                
                const cloudData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        ...data,
                        id: data.id || doc.id
                    };
                });
                
                trainings = cloudData;
                window.trainings = trainings;
                trainings.sort((a, b) => new Date(b.dataAplicacao || 0) - new Date(a.dataAplicacao || 0));
                
                await DBStore.setItem("simas_trainings", trainings);
                console.log(`[TREINAMENTOS] Cache reconciliado com Cloud: ${trainings.length} registros`);
                
                if (typeof applyTrainingFilters === 'function') applyTrainingFilters();
            } catch (e) {
                console.error("Erro no processamento em tempo real dos Treinamentos:", e);
                console.warn("[TREINAMENTOS] Falha na reconciliação. Mantendo cache local atual.");
            }
        }, (error) => {
            console.error("Falha ao escutar Treinamentos na nuvem:", error);
            console.warn("[TREINAMENTOS] Falha de conexão. Mantendo cache local atual.");
        });
    }
}


function stopNcListener() {
    if (ncUnsubscribe) {
        ncUnsubscribe();
        ncUnsubscribe = null;
    }
}


// --- MÓDULO OPR NC ---
let oprNcRequestSequence = 0;
let oprNcMensalChart = null;
let oprDqMensalChart = null;
let oprNcStatusChart = null;
let oprDqStatusChart = null;

const oprNcColors = {
    'Aberta': '#A30D00',
    'Em Tratamento': '#EAB308',
    'Fechada': '#0B1D32',
    'Cancelada': '#64748b',
    'Unmapped': '#cbd5e1'
};

function initOrDestroyOprNcChart(chartVar, ctxId) {
    if (chartVar) {
        chartVar.destroy();
    }
    const ctx = document.getElementById(ctxId);
    if (!ctx) return null;
    return ctx.getContext('2d');
}

function renderEmptyOrErrorChart(chartVarRef, ctxId, message) {
    const ctx = initOrDestroyOprNcChart(chartVarRef, ctxId);
    if (!ctx) return null;
    
    // Using Chart.js Plugin to draw text in the middle
    return new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: message, padding: { top: 80 }, color: '#64748b', font: { size: 14, style: 'italic' } }
            },
            scales: { x: { display: false }, y: { display: false } }
        }
    });
}

function renderOprNcErrorState() {
    oprNcMensalChart = renderEmptyOrErrorChart(oprNcMensalChart, 'chart-opr-nc-mensal', 'Dados de N\u00e3o Conformidades temporariamente indispon\u00edveis.');
    oprDqMensalChart = renderEmptyOrErrorChart(oprDqMensalChart, 'chart-opr-dq-mensal', 'Dados de N\u00e3o Conformidades temporariamente indispon\u00edveis.');
    oprNcStatusChart = renderEmptyOrErrorChart(oprNcStatusChart, 'chart-opr-nc-status', 'Dados indispon\u00edveis.');
    oprDqStatusChart = renderEmptyOrErrorChart(oprDqStatusChart, 'chart-opr-dq-status', 'Dados indispon\u00edveis.');
}

function renderOprNcLoadingState() {
    oprNcMensalChart = renderEmptyOrErrorChart(oprNcMensalChart, 'chart-opr-nc-mensal', 'Atualizando N\u00e3o Conformidades...');
    oprDqMensalChart = renderEmptyOrErrorChart(oprDqMensalChart, 'chart-opr-dq-mensal', 'Atualizando N\u00e3o Conformidades...');
    oprNcStatusChart = renderEmptyOrErrorChart(oprNcStatusChart, 'chart-opr-nc-status', 'Atualizando...');
    oprDqStatusChart = renderEmptyOrErrorChart(oprDqStatusChart, 'chart-opr-dq-status', 'Atualizando...');
}

function renderOprNcCharts(ncM, dqM, ncS, dqS, ncU, dqU) {
    const empty = ncM.every(v => v === 0) && dqM.every(v => v === 0) &&
                  Object.values(ncS).every(v => v === 0) && Object.values(dqS).every(v => v === 0) && ncU === 0 && dqU === 0;
                  
    if (empty) {
        oprNcMensalChart = renderEmptyOrErrorChart(oprNcMensalChart, 'chart-opr-nc-mensal', 'Nenhuma ocorr\u00eancia encontrada para a filial/ano.');
        oprDqMensalChart = renderEmptyOrErrorChart(oprDqMensalChart, 'chart-opr-dq-mensal', 'Nenhuma ocorr\u00eancia encontrada para a filial/ano.');
        oprNcStatusChart = renderEmptyOrErrorChart(oprNcStatusChart, 'chart-opr-nc-status', 'Sem dados');
        oprDqStatusChart = renderEmptyOrErrorChart(oprDqStatusChart, 'chart-opr-dq-status', 'Sem dados');
        return;
    }
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // NC Mensal
    const ctxNcM = initOrDestroyOprNcChart(oprNcMensalChart, 'chart-opr-nc-mensal');
    if (ctxNcM) {
        oprNcMensalChart = new Chart(ctxNcM, {
            type: 'bar',
            data: {
                labels: meses,
                datasets: [{
                    label: 'N\u00e3o Conformidades',
                    data: ncM,
                    backgroundColor: ncM.map((_, i) => ['#0B1D32', '#A30D00', '#4F000B', '#020122', '#AB2317'][i % 5]),
                    borderRadius: 4
                }]
            },
            plugins: (window.ChartDataLabels ? [window.ChartDataLabels] : []),
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: '#333',
                        font: { size: 10, weight: 'bold' },
                        formatter: (val) => val > 0 ? val : ''
                    }
                },
                scales: { x: { grid: { display: false } }, y: { display: false, beginAtZero: true, ticks: { stepSize: 1 }, grid: { display: false } } }
            }
        });
    }

    // DQ Mensal
    const ctxDqM = initOrDestroyOprNcChart(oprDqMensalChart, 'chart-opr-dq-mensal');
    if (ctxDqM) {
        oprDqMensalChart = new Chart(ctxDqM, {
            type: 'bar',
            data: {
                labels: meses,
                datasets: [{
                    label: 'Desvios de Qualidade',
                    data: dqM,
                    backgroundColor: dqM.map((_, i) => ['#0B1D32', '#A30D00', '#4F000B', '#020122', '#AB2317'][i % 5]),
                    borderRadius: 4
                }]
            },
            plugins: (window.ChartDataLabels ? [window.ChartDataLabels] : []),
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: '#333',
                        font: { size: 10, weight: 'bold' },
                        formatter: (val) => val > 0 ? val : ''
                    }
                },
                scales: { x: { grid: { display: false } }, y: { display: false, beginAtZero: true, ticks: { stepSize: 1 }, grid: { display: false } } }
            }
        });
    }

    // Builder for Status Charts
    function buildStatusChart(chartVar, ctxId, statusCounts, unmappedCount) {
        const ctx = initOrDestroyOprNcChart(chartVar, ctxId);
        if (!ctx) return null;
        
        let labels = [];
        let data = [];
        let bg = [];
        
        for (const st of ['Aberta', 'Em Tratamento', 'Fechada', 'Cancelada']) {
            if (statusCounts[st] > 0) {
                labels.push(st);
                data.push(statusCounts[st]);
                bg.push(oprNcColors[st]);
            }
        }
        if (unmappedCount > 0) {
            labels.push('Status n\u00e3o mapeado');
            data.push(unmappedCount);
            bg.push(oprNcColors['Unmapped']);
        }
        
        if (data.length === 0) {
             return new Chart(ctx, {
                type: 'doughnut', data: { labels: ['Sem Registros'], datasets: [{ data: [1], backgroundColor: ['#edf2f7'] }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
            });
        }
        
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: bg, borderWidth: 0 }]
            },
            plugins: (window.ChartDataLabels ? [window.ChartDataLabels] : []),
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } },
                    datalabels: {
                        color: '#fff',
                        font: { size: 11, weight: 'bold' },
                        formatter: (val) => val > 0 ? val : ''
                    }
                },
                cutout: '60%'
            }
        });
    }

    oprNcStatusChart = buildStatusChart(oprNcStatusChart, 'chart-opr-nc-status', ncS, ncU);
    oprDqStatusChart = buildStatusChart(oprDqStatusChart, 'chart-opr-dq-status', dqS, dqU);
}

async function renderizarNcsDashboardOpr() {
    if (!document.getElementById('chart-opr-nc-mensal')) return;
    
    let targetBranch = typeof currentOprBranch !== 'undefined' ? currentOprBranch : '';
    if (!targetBranch) return; 
    
    oprNcRequestSequence++;
    const currentSeq = oprNcRequestSequence;
    
    renderOprNcLoadingState();
    
    try {
        if (typeof ncs === 'undefined') {
            console.warn("Array global 'ncs' não está disponível.");
            return;
        }

        // [CORRECAO CIRURGICA - OPR REFRESH RACE CONDITION]
        // Se o array ncs estiver vazio (indicando possível refresh direto no OPR)
        // e o listener não estiver ativo, inicia o listener explicitamente.
        if (ncs.length === 0 && !ncUnsubscribe && typeof startNcListener === 'function') {
            startNcListener();
        }

        const normalize = (str) => {
            if (!str) return "";
            return String(str).toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, "");
        };
        const normalizedTarget = normalize(targetBranch);
        
        let ncMensalData = [0,0,0,0,0,0,0,0,0,0,0,0];
        let dqMensalData = [0,0,0,0,0,0,0,0,0,0,0,0];
        let ncStatusCount = { 'Aberta': 0, 'Em Tratamento': 0, 'Fechada': 0, 'Cancelada': 0 };
        let dqStatusCount = { 'Aberta': 0, 'Em Tratamento': 0, 'Fechada': 0, 'Cancelada': 0 };
        let ncUnmapped = 0;
        let dqUnmapped = 0;
        
        const branchNcs = ncs.filter(nc => normalize(nc.filial) === normalizedTarget);
        
        branchNcs.forEach(item => {
            // Se o módulo oficial não filtra tipo, tudo entra na contagem.
            // Para mantermos os gráficos DQ separados, verificamos DQ, senão assumimos NC.
            const isDq = item.tipo === "Desvio de Qualidade";
            const isNc = !isDq; // Todos os outros são contabilizados como NC para igualar à Aba NC
            
            if (item.dataOcorrencia) {
                const parts = item.dataOcorrencia.split('-');
                if (parts.length >= 2) {
                    const mes = parts[1];
                    const mIndex = parseInt(mes, 10) - 1;
                    if (mIndex >= 0 && mIndex < 12) {
                        if (isNc) ncMensalData[mIndex]++;
                        if (isDq) dqMensalData[mIndex]++;
                    }
                }
            }
            
            const st = item.status || 'Desconhecido';
            if (isNc) {
                if (ncStatusCount[st] !== undefined) ncStatusCount[st]++;
                else { ncUnmapped++; console.warn(`NC Status não mapeado: ID ${item.id}, Status ${st}`); }
            }
            if (isDq) {
                if (dqStatusCount[st] !== undefined) dqStatusCount[st]++;
                else { dqUnmapped++; console.warn(`DQ Status não mapeado: ID ${item.id}, Status ${st}`); }
            }
        });
        
        renderOprNcCharts(ncMensalData, dqMensalData, ncStatusCount, dqStatusCount, ncUnmapped, dqUnmapped);
        
    } catch (e) {
        console.error("Erro ao buscar NCs pro OPR:", e);
        if (oprNcRequestSequence === currentSeq) {
            renderOprNcErrorState();
        }
    }
}
// --- FIM MÓDULO OPR NC ---

function updateNcDashboard() {
    try {
        const filialEl = document.getElementById("filter-nc-filial");
        const filialVal = filialEl ? filialEl.value : "";
        
        let baseNcs = ncs;
        
        if (filialVal) {
            const normalize = (str) => {
                if (!str) return "";
                return String(str).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
            };
            const normalizedFilialVal = normalize(filialVal);
            baseNcs = ncs.filter(nc => normalize(nc.filial) === normalizedFilialVal);
        }
        
        let total = baseNcs.length;
        let abertas = baseNcs.filter(nc => nc.status === 'Aberta').length;
        let tratamento = baseNcs.filter(nc => nc.status === 'Em Tratamento').length;
        let fechadas = baseNcs.filter(nc => nc.status === 'Fechada').length;
        
        const elTotal = document.getElementById("nc-card-total");
        const elAbertas = document.getElementById("nc-card-abertas");
        const elTratamento = document.getElementById("nc-card-tratamento");
        const elFechadas = document.getElementById("nc-card-fechadas");
        
        if (elTotal) elTotal.innerText = total;
        if (elAbertas) elAbertas.innerText = abertas;
        if (elTratamento) elTratamento.innerText = tratamento;
        if (elFechadas) elFechadas.innerText = fechadas;
    } catch (e) {
        console.error("Erro ao atualizar dashboard NC", e);
    }
}

function applyNcFilters() {
    try {
        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
        const filialVal = getVal("filter-nc-filial");
        const statusVal = getVal("filter-nc-status");
        const clienteVal = getVal("filter-nc-cliente");
        const responsavelVal = getVal("filter-nc-responsavel");
        const searchVal = getVal("nc-search-input") ? getVal("nc-search-input").toLowerCase().trim() : "";
        
        const normalize = (str) => {
            if (!str) return "";
            return String(str).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        };
        const normalizedFilialVal = normalize(filialVal);
        
        filteredNcs = ncs.filter(nc => {
            if (filialVal && normalize(nc.filial) !== normalizedFilialVal) return false;
            if (clienteVal && nc.cliente !== clienteVal) return false;
            if (statusVal && nc.status !== statusVal) return false;
            if (responsavelVal && nc.responsavel !== responsavelVal) return false;
            if (searchVal) {
                const desc = String(nc.descricao || "").toLowerCase();
                const cod = String(nc.codigo || "").toLowerCase();
                if (!desc.includes(searchVal) && !cod.includes(searchVal)) return false;
            }
            return true;
        });
        
        // Sort strictly ascending by codigo
        filteredNcs.sort((a, b) => {
            const codeA = String(a.codigo || "");
            const codeB = String(b.codigo || "");
            return codeA.localeCompare(codeB);
        });
        
        updateNcDashboard();
        renderNcTable();
    } catch (e) {
        console.error("Erro ao aplicar filtros de NCs:", e);
    }
}


let ncCurrentAnexos = [];

function renderNcAnexos() {
    const listDiv = document.getElementById("nc-anexos-list");
    if (!listDiv) return;
    listDiv.innerHTML = "";
    
    ncCurrentAnexos.forEach((anexo, index) => {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.justifyContent = "space-between";
        item.style.background = "#f8fafc";
        item.style.border = "1px solid #cbd5e1";
        item.style.borderRadius = "8px";
        item.style.padding = "8px 12px";
        
        let actions = ``;
        if (anexo.fileId) {
            // Already uploaded
            actions += `<button type="button" style="background:none; border:none; color:#020122; font-size:16px; cursor:pointer;" title="Baixar" onclick="downloadNcAnexo('${anexo.fileId}', '${anexo.name}')"><i class="fa-solid fa-download"></i></button>`;
        }
        if (currentUser && (currentUser.permissions.edit || currentUser.permissions.create)) {
            actions += `<button type="button" style="background:none; border:none; color:#ef4444; font-size:16px; cursor:pointer; margin-left:8px;" title="Remover" onclick="removeNcAnexo(${index})"><i class="fa-solid fa-trash-can"></i></button>`;
        }
        
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
                <i class="fa-solid fa-file" style="color: #475569; font-size: 18px;"></i>
                <div style="display: flex; flex-direction: column; overflow: hidden;">
                    <span style="font-weight: 600; font-size: 13px; color: #0f172a; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;" title="${anexo.name}">${anexo.name}</span>
                    <span style="font-size: 11px; color: #64748b;">${anexo.size}</span>
                </div>
            </div>
            <div style="display: flex; gap: 5px; flex-shrink: 0;">
                ${actions}
            </div>
        `;
        listDiv.appendChild(item);
    });
}

function handleNcFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.size > 15 * 1024 * 1024) {
            showToast(`O arquivo ${f.name} excede o limite de 15MB.`, "error");
            continue;
        }
        ncCurrentAnexos.push({
            file: f,
            name: f.name,
            size: (f.size / (1024 * 1024)).toFixed(2) + " MB"
        });
    }
    
    event.target.value = "";
    renderNcAnexos();
}

function removeNcAnexo(index) {
    if (!currentUser.permissions.edit && !currentUser.permissions.create) return;
    ncCurrentAnexos.splice(index, 1);
    renderNcAnexos();
}

async function downloadNcAnexo(fileId, name) {
    try {
        const fileDoc = await FileRepository.get(fileId);
        if (!fileDoc || !fileDoc.blob) {
            showToast("Anexo não encontrado ou ainda não sincronizado.", "error");
            return;
        }
        const url = URL.createObjectURL(fileDoc.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name || "anexo";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Erro ao baixar anexo:", e);
        showToast("Erro ao baixar anexo.", "error");
    }
}


function handleDownloadNcAnexos(ncId) {
    const nc = ncs.find(n => n.id === ncId);
    if (!nc || !nc.anexos || nc.anexos.length === 0) return;
    
    if (nc.anexos.length === 1) {
        downloadNcAnexo(nc.anexos[0].fileId, nc.anexos[0].name);
    } else {
        showMultiAnexosModal(nc);
    }
}

function showMultiAnexosModal(nc) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.zIndex = "9999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    
    const modal = document.createElement("div");
    modal.style.background = "#fff";
    modal.style.padding = "20px";
    modal.style.borderRadius = "8px";
    modal.style.width = "400px";
    modal.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
    
    const title = document.createElement("h3");
    title.innerText = "Baixar Anexos";
    title.style.marginTop = "0";
    title.style.marginBottom = "15px";
    title.style.color = "#0B1D32";
    title.style.fontSize = "16px";
    modal.appendChild(title);
    
    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "10px";
    list.style.maxHeight = "300px";
    list.style.overflowY = "auto";
    
    nc.anexos.forEach(anexo => {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.justifyContent = "space-between";
        item.style.padding = "10px";
        item.style.background = "#f8fafc";
        item.style.border = "1px solid #cbd5e1";
        item.style.borderRadius = "6px";
        
        const nameDiv = document.createElement("div");
        nameDiv.style.display = "flex";
        nameDiv.style.alignItems = "center";
        nameDiv.style.gap = "8px";
        nameDiv.style.overflow = "hidden";
        
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-file";
        icon.style.color = "#475569";
        
        const nameSpan = document.createElement("span");
        nameSpan.innerText = anexo.name;
        nameSpan.title = anexo.name;
        nameSpan.style.whiteSpace = "nowrap";
        nameSpan.style.overflow = "hidden";
        nameSpan.style.textOverflow = "ellipsis";
        nameSpan.style.fontSize = "13px";
        nameSpan.style.fontWeight = "600";
        nameSpan.style.color = "#0f172a";
        
        nameDiv.appendChild(icon);
        nameDiv.appendChild(nameSpan);
        
        const dlBtn = document.createElement("button");
        dlBtn.innerHTML = '<i class="fa-solid fa-download"></i> Baixar';
        dlBtn.style.background = "#0B1D32";
        dlBtn.style.color = "#fff";
        dlBtn.style.border = "none";
        dlBtn.style.padding = "6px 12px";
        dlBtn.style.borderRadius = "4px";
        dlBtn.style.cursor = "pointer";
        dlBtn.style.fontSize = "12px";
        dlBtn.onclick = () => {
            downloadNcAnexo(anexo.fileId, anexo.name);
        };
        
        item.appendChild(nameDiv);
        item.appendChild(dlBtn);
        list.appendChild(item);
    });
    
    modal.appendChild(list);
    
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Fechar";
    closeBtn.style.marginTop = "20px";
    closeBtn.style.width = "100%";
    closeBtn.style.padding = "8px";
    closeBtn.style.background = "#e2e8f0";
    closeBtn.style.color = "#475569";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "4px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontWeight = "bold";
    closeBtn.onclick = () => {
        document.body.removeChild(overlay);
    };
    
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function openCreateNcModal() {
    if (!currentUser.permissions.create) {
        showToast("Nível de acesso insuficiente para cadastrar NCs.", "error");
        return;
    }
    
    document.getElementById("form-nc-id").value = "";
    document.getElementById("nc-form").reset();
    ncCurrentAnexos = [];
    renderNcAnexos();
    document.getElementById("nc-modal-title").innerText = "Registrar Nova Não Conformidade";
    document.getElementById("form-nc-codigo").value = "";
    
    document.getElementById("nc-modal").classList.add("active");
}

function closeNcModal() {
    document.getElementById("nc-modal").classList.remove("active");
}

async function saveNc(event) {
    event.preventDefault();
    try {
        const id = document.getElementById("form-nc-id").value;
        const filial = document.getElementById("form-nc-filial").value;
        const dataOcorrencia = document.getElementById("form-nc-data").value;
        const origem = document.getElementById("form-nc-origem").value;
        const identificacao = document.getElementById("form-nc-identificacao").value;
        const tipo = document.getElementById("form-nc-tipo").value;
        const setor = document.getElementById("form-nc-setor").value;
        const cliente = document.getElementById("form-nc-cliente").value;
        const responsavel = document.getElementById("form-nc-responsavel").value;
        const status = document.getElementById("form-nc-status").value;
        const descricao = document.getElementById("form-nc-descricao").value.trim();
        
        let codigo = document.getElementById("form-nc-codigo").value;
        
        if (!filial || !dataOcorrencia || !tipo || !setor || !origem || !cliente) {
            showToast("Preencha todos os campos obrigatórios.", "error");
            return;
        }

        let ncData = {
            filial, dataOcorrencia, origem, identificacao, tipo, setor, cliente, responsavel, status, descricao,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.username || "Desconhecido",
            anexos: []
        };
        
        // Upload new anexos
        const finalAnexos = [];
        for (const anexo of ncCurrentAnexos) {
            if (anexo.fileId) {
                // Already uploaded
                finalAnexos.push(anexo);
            } else if (anexo.file) {
                // Needs upload
                try {
                    const savedId = await FileRepository.save(anexo.file, { module: 'nc' });
                    finalAnexos.push({
                        fileId: savedId,
                        name: anexo.name,
                        size: anexo.size
                    });
                } catch(e) {
                    console.error("Erro no upload do anexo " + anexo.name, e);
                }
            }
        }
        ncData.anexos = finalAnexos;

        
        const btnSave = document.getElementById("btn-save-nc");
        btnSave.disabled = true;
        btnSave.innerText = "Salvando...";
        
        if (id) {
            // Edit
            const docRef = db.collection("nonConformities").doc(id);
            await docRef.update(ncData);
            showToast("Não Conformidade atualizada com sucesso!", "success");
        } else {
            // Create
            if(!codigo) {
                codigo = await generateNcId(filial, dataOcorrencia);
            }
            
            // --- CORREÇÃO DE CONCORRÊNCIA (RACE CONDITION) ---
            // Usa transação com Document ID previsível para garantir unicidade sem sobrescrever
            let success = false;
            let currentCodigo = codigo;
            
            let baseMatch = currentCodigo.match(/^([A-Z]+)\s+(\d+)\/(\d{4})$/);
            let pfx = baseMatch ? baseMatch[1] : (filial || "").substring(0,3).toUpperCase();
            let seq = baseMatch ? parseInt(baseMatch[2], 10) : 1;
            let ano = baseMatch ? baseMatch[3] : String(new Date().getFullYear());
            
            while (!success) {
                // Força um ID único para esse código no Firestore
                const safeDocId = `NC_${pfx}_${seq}_${ano}`;
                const docRef = db.collection("nonConformities").doc(safeDocId);
                
                try {
                    await db.runTransaction(async (transaction) => {
                        const docSnap = await transaction.get(docRef);
                        if (docSnap.exists) {
                            throw new Error("ALREADY_EXISTS");
                        }
                        
                        ncData.codigo = currentCodigo;
                        ncData.createdAt = new Date().toISOString();
                        ncData.createdBy = currentUser.username || "Desconhecido";
                        
                        transaction.set(docRef, ncData);
                    });
                    success = true;
                } catch (err) {
                    if (err.message === "ALREADY_EXISTS") {
                        seq++; // Sequência já existe, auto-incrementa e tenta novamente
                        currentCodigo = `${pfx} ${String(seq).padStart(3, '0')}/${ano}`;
                    } else {
                        throw err;
                    }
                }
            }
            showToast("Não Conformidade registrada com sucesso!", "success");
        }
        
        closeNcModal();
    } catch (e) {
        console.error("Erro ao salvar NC:", e);
        showToast("Erro ao salvar. Verifique o console.", "error");
    } finally {
        const btnSave = document.getElementById("btn-save-nc");
        if(btnSave) {
            btnSave.disabled = false;
            btnSave.innerText = "Salvar NC";
        }
    }
}

async function generateNcId(filial, dataOcorrencia) {
    const year = dataOcorrencia ? dataOcorrencia.substring(0,4) : String(new Date().getFullYear());
    
    const normalizeStr = (str) => String(str || "").toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    const fNorm = normalizeStr(filial);
    
    let prefix = (filial || "").substring(0,3).toUpperCase();
    
    const mapSiglas = {
        "matriz": "MTZ",
        "filial sc": "FSC",
        "filial sp": "FSP",
        "sao roque": "SR",
        "sorocaba": "SC",
        "camacari": "CAM",
        "funeas": "PR",
        "sjp prefeitura": "SJP",
        "juatuba": "JUA",
        "contagem": "CON",
        "governador valadares": "GV"
    };
    
    if (mapSiglas[fNorm]) {
        prefix = mapSiglas[fNorm];
    }
    
    const relevantNcs = ncs.filter(n => normalizeStr(n.filial) === fNorm && (n.dataOcorrencia || "").startsWith(year));
    
    let maxSeq = 0;
    for (const nc of relevantNcs) {
        if (nc.codigo) {
            const match = nc.codigo.match(/(\d+)\/\d{4}$/);
            if (match) {
                const seq = parseInt(match[1], 10);
                if (seq > maxSeq) {
                    maxSeq = seq;
                }
            }
        }
    }
    
    const count = maxSeq + 1;
    return `${prefix} ${String(count).padStart(3, '0')}/${year}`;
}

function editNc(id) {
    if (!currentUser.permissions.edit) {
        showToast("Nível de acesso insuficiente.", "error");
        return;
    }
    
    const nc = ncs.find(n => n.id === id);
    if (!nc) return;
    
    document.getElementById("form-nc-id").value = nc.id;
    document.getElementById("form-nc-codigo").value = nc.codigo || "";
    ncCurrentAnexos = nc.anexos ? [...nc.anexos] : [];
    renderNcAnexos();
    document.getElementById("form-nc-data").value = nc.dataOcorrencia || "";
    
    const setSelectValue = (id, val) => {
        const el = document.getElementById(id);
        if(!el) return;
        el.value = val || "";
        if(!el.value) { // match case insensitive if exact failed
            for(let i=0; i<el.options.length; i++) {
                if(el.options[i].value.toLowerCase() === (val||"").toLowerCase()) {
                    el.selectedIndex = i;
                    break;
                }
            }
        }
    };

    setSelectValue("form-nc-filial", nc.filial);
    setSelectValue("form-nc-origem", nc.origem);
    setSelectValue("form-nc-identificacao", nc.identificacao);
    setSelectValue("form-nc-tipo", nc.tipo);
    setSelectValue("form-nc-setor", nc.setor);
    setSelectValue("form-nc-cliente", nc.cliente);
    setSelectValue("form-nc-responsavel", nc.responsavel);
    setSelectValue("form-nc-status", nc.status);
    
    document.getElementById("form-nc-descricao").value = nc.descricao || "";
            
    document.getElementById("nc-modal-title").innerText = `Editar NC: ${nc.codigo || 'Novo'}`;
    document.getElementById("nc-modal").classList.add("active");
}

function downloadNcTemplate() {
    try {
        const wsData = [
            {
                "Código": "SR 25/2026",
                "Filial": "Matriz",
                "Data": "25/12/2026",
                "Tipo de Registro": "Não Conformidade",
                "Setor": "Armazenagem",
                "Origem": "Auditoria Interna",
                "Identificação": "E-mail",
                "Cliente": "TIGRE",
                "Responsável": "IARA",
                "Status": "Aberta",
                "Descrição": "Descreva aqui o detalhamento da não conformidade... (Apague esta linha e preencha com seus dados)"
            }
        ];
        
        const ws = XLSX.utils.json_to_sheet(wsData);
        
        // Ajustar largura das colunas
        const wscols = [
            {wch: 15}, {wch: 15}, {wch: 12}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 50}
        ];
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo NCs");
        
        XLSX.writeFile(wb, "Modelo_Importacao_NCs.xlsx");
        showToast("Modelo baixado com sucesso!", "success");
    } catch (e) {
        console.error("Erro ao gerar modelo:", e);
        showToast("Erro ao gerar a planilha modelo.", "error");
    }
}

function importNcsExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!currentUser.permissions.create) {
        showToast("Nível de acesso insuficiente para importar NCs.", "error");
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (rows.length === 0) {
                showToast("A planilha está vazia.", "warning");
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                
                const filial = row["Filial"] || row["FILIAL"] || row["Unidade"] || "";
                let dataOcorrencia = row["Data"] || row["Data Ocorrência"] || row["Data da Ocorrência"] || row["DATA"] || "";
                const tipo = row["Tipo"] || row["Tipo de Registro"] || row["TIPO"] || "";
                const setor = row["Setor"] || row["Setor de Origem"] || row["SETOR"] || "";
                const origem = row["Origem"] || row["ORIGEM"] || "";
                const identificacao = row["Identificação"] || row["Identificacao"] || row["IDENTIFICAÇÃO"] || "";
                const cliente = row["Cliente"] || row["CLIENTE"] || "";
                const responsavel = row["Responsável"] || row["Responsavel"] || row["RESPONSÁVEL"] || "";
                let status = row["Status"] || row["STATUS"] || "Aberta";
                const descricao = row["Descrição"] || row["Descricao"] || row["DESCRIÇÃO"] || "Importado via sistema";

                if (!filial && !tipo && !setor && !origem && !cliente) continue;

                if (!filial || !dataOcorrencia || !tipo || !setor) {
                    console.warn(`Linha ${i + 2} pulada por falta de dados obrigatórios.`);
                    errorCount++;
                    continue;
                }

                if (typeof dataOcorrencia === 'number') {
                    const parsedDate = new Date(Math.round((dataOcorrencia - 25569) * 86400 * 1000));
                    dataOcorrencia = parsedDate.toISOString().split('T')[0];
                } else if (typeof dataOcorrencia === 'string' && dataOcorrencia.includes('/')) {
                    const parts = dataOcorrencia.split('/');
                    if (parts.length === 3) {
                        dataOcorrencia = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }
                
                status = status.trim();
                if (!['Aberta', 'Em Tratamento', 'Fechada', 'Cancelada'].includes(status)) {
                    status = 'Aberta';
                }
                
                let customCodigo = row["Código"] || row["Codigo"] || row["CÓDIGO"] || row["CODIGO"] || "";
                customCodigo = customCodigo.toString().trim();

                try {
                    const codigo = customCodigo ? customCodigo : await generateNcId(filial, dataOcorrencia);
                    
                    let ncData = {
                        codigo, filial, dataOcorrencia, tipo, setor, origem, identificacao, cliente, responsavel, status, descricao,
                        createdAt: new Date().toISOString(),
                        createdBy: currentUser.username || "Importação Lote",
                        updatedAt: new Date().toISOString(),
                        updatedBy: currentUser.username || "Importação Lote"
                    };

                    await db.collection("nonConformities").add(ncData);
                    successCount++;
                } catch (err) {
                    console.error(`Erro ao salvar NC da linha ${i + 2}:`, err);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                showToast(`${successCount} NCs importadas com sucesso!`, "success");
            }
            if (errorCount > 0) {
                showToast(`${errorCount} linhas falharam. Verifique o console.`, "warning");
            }
        } catch (error) {
            console.error("Erro processando arquivo Excel:", error);
            showToast("Erro ao ler o arquivo Excel.", "error");
        } finally {
            event.target.value = ''; // Reset input
        }
    };
    reader.readAsArrayBuffer(file);
}
// ==================== FIM NCS FASE 3 RESTORE ====================


// ==================== LÓGICA TOP 3 PROBLEMAS CRÍTICOS ====================

let topProblemasDB = [];

async function carregarTopProblemasDB() {
    try {
        const res = await DBStore.getItem('simas_top_problemas');
        if (Array.isArray(res)) {
            topProblemasDB = res;
        } else {
            topProblemasDB = [];
        }
    } catch (e) {
        console.error("Erro ao carregar simas_top_problemas", e);
        topProblemasDB = [];
    }
}

async function renderizarTopProblemas() {
    await carregarTopProblemasDB();

    const grid = document.getElementById('opr-top-problemas-grid');
    const btnAdd = document.getElementById('btn-add-top-problema');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) return;
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;
    
    const isReadOnly = record.status === 'Finalizado' || record.status === 'Concluído';
    if (isReadOnly) {
        if (btnAdd) btnAdd.style.display = 'none';
    } else {
        if (btnAdd) btnAdd.style.display = 'inline-block';
    }
    
    let activeProbs = [];
    
    if (isReadOnly && record.data.topProblemasSnapshot) {
        activeProbs = record.data.topProblemasSnapshot;
    } else {
        const recYear = record.createdAt ? new Date(record.createdAt).getFullYear().toString() : new Date().getFullYear().toString();
        
        let dbProbs = topProblemasDB.filter(p => p.filial === currentOprBranch && p.ano === recYear && p.status !== 'Concluído');
        
        const critRank = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
        dbProbs.sort((a, b) => {
            if (critRank[a.criticidade] !== critRank[b.criticidade]) {
                return critRank[b.criticidade] - critRank[a.criticidade];
            }
            return new Date(a.dataAbertura) - new Date(b.dataAbertura);
        });
        
        activeProbs = dbProbs.slice(0, 3);
        // Botão continua visível mesmo se tiver mais de 3
    }
    
    if (activeProbs.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; font-size: 13px; padding: 20px; font-style: italic;">Nenhum problema crítico ativo no momento.</div>';
    } else {
        activeProbs.forEach(prob => {
            let colorBorder = '#cbd5e1';
            let iconColor = '#64748b';
            if (prob.criticidade === 'Alta') { colorBorder = '#ef4444'; iconColor = '#ef4444'; }
            if (prob.criticidade === 'Média') { colorBorder = '#f59e0b'; iconColor = '#f59e0b'; }
            if (prob.criticidade === 'Baixa') { colorBorder = '#10b981'; iconColor = '#10b981'; }
            
            let html = `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${colorBorder}; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div style="width: 100%;">
                        <h5 style="margin: 0; color: #0B1D32; font-size: 14px; font-weight: 800; line-height: 1.3;">
                            <i class="fa-solid fa-circle-exclamation" style="color: ${iconColor}; margin-right: 4px;"></i> ${prob.desc}
                        </h5>
                        <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 4px;">Data: ${prob.dataAbertura.split('-').reverse().join('/')} | Resp: ${prob.resp}</div>
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <span style="display: inline-block; padding: 2px 8px; background: #f1f5f9; color: #475569; border-radius: 4px; font-size: 10px; font-weight: 700;">Status: ${prob.status}</span>
                </div>
                <div style="flex: 1; display: flex; align-items: flex-end;">
                    <div style="width: 100%;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="font-size: 10px; font-weight: 700; color: #475569;">Evolução</span>
                            <span style="font-size: 10px; font-weight: 700; color: #0B1D32;">${prob.evolucao}%</span>
                        </div>
                        <div style="width: 100%; background: #e2e8f0; height: 6px; border-radius: 3px;">
                            <div style="background: ${colorBorder}; width: ${prob.evolucao}%; height: 100%; border-radius: 3px;"></div>
                        </div>
                    </div>
                </div>
            `;
            if (!isReadOnly) {
                html += `
                <div style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                    <button onclick="excluirTopProblema('${prob.id}')" title="Excluir Registro Incorreto" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px;"><i class="fa-solid fa-trash"></i></button>
                    <button onclick="abrirModalTopProblema('${prob.id}')" title="Editar" style="background: none; border: none; color: #0B1D32; cursor: pointer; font-size: 14px;"><i class="fa-solid fa-pen"></i></button>
                </div>
                `;
            } else if (prob.dataConclusao) {
                html += `<div style="margin-top: 15px; font-size: 11px; color: #10b981; font-weight: 700; text-align: right;">Concluído em: ${prob.dataConclusao.split('-').reverse().join('/')}</div>`;
            }
            html += `</div>`;
            grid.insertAdjacentHTML('beforeend', html);
        });
    }
}

async function abrirModalTopProblema(id) {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) {
        alert('Abra um relatório em edição primeiro.');
        return;
    }
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record || record.status === 'Finalizado' || record.status === 'Concluído') {
        alert('Este relatório está finalizado (somente leitura).');
        return;
    }
    
    await carregarTopProblemasDB();

    let prob = null;
    if (id) {
        prob = topProblemasDB.find(p => p.id === id);
    }
    
    const recYear = record.createdAt ? new Date(record.createdAt).getFullYear().toString() : new Date().getFullYear().toString();
    
    document.getElementById('top-prob-id').value = prob ? prob.id : '';
    document.getElementById('top-prob-ano').value = prob ? prob.ano : recYear;
    document.getElementById('top-prob-desc').value = prob ? prob.desc : '';
    document.getElementById('top-prob-data-abertura').value = prob ? prob.dataAbertura : new Date().toISOString().split('T')[0];
    document.getElementById('top-prob-crit').value = prob ? prob.criticidade : 'Média';
    document.getElementById('top-prob-resp').value = prob ? prob.resp : '';
    document.getElementById('top-prob-status').value = prob ? prob.status : 'Em Análise';
    document.getElementById('top-prob-evol').value = prob ? prob.evolucao : '0';
    document.getElementById('top-prob-evol-val').textContent = (prob ? prob.evolucao : '0') + '%';
    
    document.getElementById('top-prob-data-conclusao').value = prob && prob.dataConclusao ? prob.dataConclusao : '';
    verificarStatusProblema();
    
    document.getElementById('modal-top-problema').style.display = 'flex';
}

function verificarStatusProblema() {
    const status = document.getElementById('top-prob-status').value;
    const divConclusao = document.getElementById('div-data-conclusao');
    const inputConclusao = document.getElementById('top-prob-data-conclusao');
    if (status === 'Concluído') {
        divConclusao.style.display = 'block';
        if (!inputConclusao.value) {
            inputConclusao.value = new Date().toISOString().split('T')[0];
        }
    } else {
        divConclusao.style.display = 'none';
        inputConclusao.value = '';
    }
}

function fecharModalTopProblema() {
    document.getElementById('modal-top-problema').style.display = 'none';
}

async function salvarTopProblema() {
    const id = document.getElementById('top-prob-id').value || 'prob-' + Date.now();
    const ano = document.getElementById('top-prob-ano').value;
    const desc = document.getElementById('top-prob-desc').value.trim();
    const dataAbertura = document.getElementById('top-prob-data-abertura').value;
    const crit = document.getElementById('top-prob-crit').value;
    const resp = document.getElementById('top-prob-resp').value.trim();
    const status = document.getElementById('top-prob-status').value;
    const evolucao = parseInt(document.getElementById('top-prob-evol').value, 10);
    const dataConclusao = document.getElementById('top-prob-data-conclusao').value;
    
    if (!desc || !dataAbertura || !resp) {
        alert('Preencha os campos obrigatórios (Descrição, Data de Abertura, Responsável).');
        return;
    }
    
    if (status === 'Concluído' && !dataConclusao) {
        alert('Por favor, informe a Data de Conclusão.');
        return;
    }
    
    const probObj = {
        id: id,
        filial: currentOprBranch,
        ano: ano,
        desc: desc,
        dataAbertura: dataAbertura,
        criticidade: crit,
        resp: resp,
        status: status,
        evolucao: evolucao,
        dataConclusao: status === 'Concluído' ? dataConclusao : null
    };
    
    const idx = topProblemasDB.findIndex(p => p.id === id);
    if (idx !== -1) {
        topProblemasDB[idx] = probObj;
    } else {
        topProblemasDB.push(probObj);
    }
    
    try {
        await DBStore.setItem('simas_top_problemas', topProblemasDB);
        fecharModalTopProblema();
        renderizarTopProblemas();
        if (typeof showToast === 'function') showToast('Problema salvo com sucesso!', 'success');
    } catch(e) {
        console.error(e);
        alert('Falha ao salvar no IndexedDB.');
    }
}

async function excluirTopProblema(id) {
    if (confirm('Tem certeza que deseja excluir permanentemente este registro incorreto? Os problemas concluídos devem permanecer cadastrados no sistema e não devem ser excluídos.')) {
        topProblemasDB = topProblemasDB.filter(p => p.id !== id);
        try {
            await DBStore.setItem('simas_top_problemas', topProblemasDB);
            
            // --- INICIO ALTERACAO: Exclusao explicita na Nuvem ---
            if (typeof db !== 'undefined' && db) {
                try {
                    await db.collection('top_problemas').doc(id.toString()).delete();
                } catch(cloudErr) {
                    console.warn(`Aviso: Falha ao remover top problema da nuvem:`, cloudErr);
                }
            }
            // --- FIM ALTERACAO ---
            renderizarTopProblemas();
            if (typeof showToast === 'function') showToast('Registro excluído!', 'success');
        } catch(e) {
            console.error(e);
            alert('Falha ao excluir no IndexedDB.');
        }
    }
}

// ==================== LÓGICA DONO DA RUA / 5S ====================

function renderizar5S() {
    const geralNota = document.getElementById('5s-geral-nota');
    const geralBadge = document.getElementById('5s-geral-badge');
    const maiorNota = document.getElementById('5s-maior-nota');
    const maiorResp = document.getElementById('5s-maior-resp');
    const maiorSetor = document.getElementById('5s-maior-setor');
    const menorNota = document.getElementById('5s-menor-nota');
    const menorResp = document.getElementById('5s-menor-resp');
    const menorSetor = document.getElementById('5s-menor-setor');
    const tbody = document.getElementById('5s-tbody');
    const top5Container = document.getElementById('5s-top5-container');
    const btnAdd = document.getElementById('btn-add-5s');

    if (!geralNota || !tbody || !top5Container) return;

    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) return;
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record) return;

    const isReadOnly = record.status === 'Finalizado' || record.status === 'Concluído';
    if (btnAdd) {
        btnAdd.style.display = isReadOnly ? 'none' : 'flex';
    }

    let avaliacoes = [];
    if (record.data && record.data.cincoSData) {
        avaliacoes = record.data.cincoSData;
    }

    if (avaliacoes.length === 0) {
        geralNota.textContent = '0%';
        geralBadge.textContent = 'Aguardando';
        geralBadge.style.background = '#e2e8f0';
        geralBadge.style.color = '#64748b';

        maiorNota.textContent = '0%';
        maiorResp.textContent = '-';
        maiorSetor.textContent = 'sem avaliação';

        menorNota.textContent = '0%';
        menorResp.textContent = '-';
        menorSetor.textContent = 'sem avaliação';

        top5Container.innerHTML = '<div style="text-align: center; padding: 20px; color: #94a3b8; font-style: italic; background: #ffffff; border: 1px solid #edf2f7; border-radius: 8px;">Nenhuma avaliação cadastrada.</div>';
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8; font-style: italic;">Nenhuma avaliação cadastrada.</td></tr>';
        return;
    }

    // Avaliação Geral
    const soma = avaliacoes.reduce((acc, curr) => acc + parseFloat(curr.nota), 0);
    const media = soma / avaliacoes.length;
    geralNota.textContent = media.toFixed(1).replace('.0', '') + '%';

    if (media >= 90) {
        geralBadge.textContent = 'Satisfatório';
        geralBadge.style.background = '#dcfce7';
        geralBadge.style.color = '#166534';
    } else if (media >= 70) {
        geralBadge.textContent = 'Tolerável';
        geralBadge.style.background = '#fef3c7';
        geralBadge.style.color = '#92400e';
    } else {
        geralBadge.textContent = 'Insatisfatório';
        geralBadge.style.background = '#fee2e2';
        geralBadge.style.color = '#991b1b';
    }

    // Sort avaliacoes DESC by nota, then ASC by dataRegistro/createdAt for ties
    const sorted = [...avaliacoes].sort((a, b) => {
        const diff = parseFloat(b.nota) - parseFloat(a.nota);
        if (diff !== 0) return diff;
        const dateA = a.dataRegistro ? new Date(a.dataRegistro).getTime() : 0;
        const dateB = b.dataRegistro ? new Date(b.dataRegistro).getTime() : 0;
        return dateA - dateB;
    });

    const maior = sorted[0];
    const menor = sorted[sorted.length - 1];

    maiorNota.textContent = maior.nota + '%';
    maiorResp.textContent = maior.responsavel;
    maiorSetor.textContent = maior.setor;

    menorNota.textContent = menor.nota + '%';
    menorResp.textContent = menor.responsavel;
    menorSetor.textContent = menor.setor;

    // Top 5
    const top5 = sorted.slice(0, 5);
    let top5Html = '';
    top5.forEach((item, index) => {
        const rank = index + 1;
        const rankColor = rank <= 3 ? '#f59e0b' : '#94a3b8';
        top5Html += `
            <div style="background: #f8fafc; border: 1px solid #edf2f7; border-radius: 8px; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="font-size: 16px; font-weight: 800; color: ${rankColor}; width: 15px; text-align: center;">${rank}</div>
                    <div>
                        <div style="font-size: 12px; font-weight: 800; color: #0B1D32; text-transform: uppercase;">${item.setor}</div>
                        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 2px;">${item.responsavel}</div>
                    </div>
                </div>
                <div style="font-size: 16px; font-weight: 800; color: #0ea5e9;">${item.nota}%</div>
            </div>
        `;
    });
    top5Container.innerHTML = top5Html;

    // Table
    let tableHtml = '';
    avaliacoes.forEach(item => {
        const obsDisplay = item.observacao ? item.observacao : '--';
        tableHtml += `
            <tr style="border-bottom: 1px solid #edf2f7; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                <td style="padding: 12px 15px; font-weight: 800; color: #0B1D32; text-transform: uppercase;">${item.responsavel}</td>
                <td style="padding: 12px 15px; color: #475569; text-transform: uppercase;">${item.setor}</td>
                <td style="padding: 12px 15px; color: #94a3b8;">${obsDisplay}</td>
                <td style="padding: 12px 15px; text-align: center; font-weight: 800; color: #0ea5e9;">${item.nota}%</td>
                <td class="opr-actions-only" style="padding: 12px 15px; text-align: center;">
                    ${isReadOnly ? '-' : `
                        <i class="fa-solid fa-pen" style="color: #64748b; cursor: pointer; margin-right: 12px;" onclick="abrirModal5S('${item.id}')" title="Editar"></i>
                        <i class="fa-solid fa-trash" style="color: #ef4444; cursor: pointer;" onclick="excluirAvaliacao5S('${item.id}')" title="Excluir"></i>
                    `}
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = tableHtml;
}

function abrirModal5S(id = null) {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) {
        alert('Abra um relatório em edição primeiro.');
        return;
    }
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record || record.status === 'Finalizado' || record.status === 'Concluído') {
        alert('Este relatório está finalizado (somente leitura).');
        return;
    }

    let avaliacoes = [];
    if (record.data && record.data.cincoSData) {
        avaliacoes = record.data.cincoSData;
    }

    let ava = null;
    if (id) ava = avaliacoes.find(a => a.id === id);

    let defaultName = '';
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.name) {
        defaultName = currentUser.name;
    } else if (typeof window.currentUser !== 'undefined' && window.currentUser && window.currentUser.name) {
        defaultName = window.currentUser.name;
    }

    document.getElementById('5s-id').value = ava ? ava.id : '';
    document.getElementById('5s-resp').value = ava ? ava.responsavel : (id ? '' : defaultName);
    document.getElementById('5s-nota').value = ava ? ava.nota : '';
    document.getElementById('5s-setor').value = ava ? ava.setor : '';
    document.getElementById('5s-obs').value = ava ? (ava.observacao || '') : '';

    document.getElementById('modal-5s-unico').style.display = 'flex';
}

function fecharModal5S() {
    const modal = document.getElementById('modal-5s-unico');
    if (modal) modal.style.display = 'none';
}

function salvarAvaliacao5S() {
    const id = document.getElementById('5s-id').value;
    const resp = document.getElementById('5s-resp').value.trim();
    const nota = parseFloat(document.getElementById('5s-nota').value);
    const setor = document.getElementById('5s-setor').value.trim();
    const obs = document.getElementById('5s-obs').value.trim();

    if (!resp || isNaN(nota) || !setor) {
        alert('Preencha Responsável, Nota e Setor/Rua.');
        return;
    }

    if (nota < 0 || nota > 100) {
        alert('A nota deve estar entre 0 e 100.');
        return;
    }

    const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
    if (idx === -1) return;

    if (!oprHistoryDB[idx].data) oprHistoryDB[idx].data = {};
    if (!oprHistoryDB[idx].data.cincoSData) oprHistoryDB[idx].data.cincoSData = [];

    let avaliacoes = oprHistoryDB[idx].data.cincoSData;

    if (id) {
        const aIdx = avaliacoes.findIndex(a => a.id === id);
        if (aIdx !== -1) {
            avaliacoes[aIdx].responsavel = resp;
            avaliacoes[aIdx].nota = nota;
            avaliacoes[aIdx].setor = setor;
            avaliacoes[aIdx].observacao = obs;
        }
    } else {
        avaliacoes.push({
            id: '5s-' + Date.now().toString(36) + Math.random().toString(36).substr(2),
            responsavel: resp,
            nota: nota,
            setor: setor,
            observacao: obs,
            dataRegistro: new Date().toISOString()
        });
    }

    // Persist only to memory as requested (atomic preservation), it will be saved later by Salvar Rascunho / persistCurrentOpr
    // BUT wait! The rule "Atualizar imediatamente: Avaliação Geral, Maior, Menor, Top 5, tabela." is fulfilled by renderizar5S().
    // The rule "NÃO gravar diretamente no IndexedDB ao: criar, editar, excluir... Alterar somente oprHistoryDB[idx].data.cincoSData em memória."
    // means DO NOT call persistCurrentOpr() here!
    
    renderizar5S();
    if (typeof markOprDirty === "function") markOprDirty();
fecharModal5S();
}

function excluirAvaliacao5S(id) {
    if (!confirm('Deseja realmente excluir esta avaliação?')) return;
    
    const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
    if (idx === -1) return;

    if (oprHistoryDB[idx].data && oprHistoryDB[idx].data.cincoSData) {
        oprHistoryDB[idx].data.cincoSData = oprHistoryDB[idx].data.cincoSData.filter(a => a.id !== id);
        renderizar5S();
    if (typeof markOprDirty === "function") markOprDirty();
}
}



// ==========================================
// MODAL DE CADASTRO EM LOTE - 5S
// ==========================================

function abrirModal5SLote() {
    if (typeof currentOprRecordId === 'undefined' || !currentOprRecordId) {
        alert('Abra um relatório em edição primeiro.');
        return;
    }
    const record = oprHistoryDB.find(r => r.id === currentOprRecordId);
    if (!record || record.status === 'Finalizado' || record.status === 'Concluído') {
        alert('Este relatório está finalizado (somente leitura).');
        return;
    }

    const tbody = document.getElementById('5s-lote-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        add5SBatchRow();
    }

    document.getElementById('modal-5s-lote').style.display = 'flex';
}

function fecharModal5SLote() {
    const modal = document.getElementById('modal-5s-lote');
    if (modal) modal.style.display = 'none';
}

function add5SBatchRow() {
    const tbody = document.getElementById('5s-lote-tbody');
    if (!tbody) return;

    let defaultName = '';
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.name) {
        defaultName = currentUser.name;
    } else if (typeof window.currentUser !== 'undefined' && window.currentUser && window.currentUser.name) {
        defaultName = window.currentUser.name;
    }

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #edf2f7';
    tr.innerHTML = `
        <td style="padding: 8px;"><input type="text" class="lote-resp" placeholder="Nome" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; box-sizing: border-box;"></td>
        <td style="padding: 8px;"><input type="text" class="lote-setor" placeholder="Setor / Rua" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; box-sizing: border-box;"></td>
        <td style="padding: 8px;"><input type="number" class="lote-nota" min="0" max="100" placeholder="0 - 100" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; text-align: center; box-sizing: border-box;"></td>
        <td style="padding: 8px;"><input type="text" class="lote-obs" placeholder="Opcional" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; box-sizing: border-box;"></td>
        <td style="padding: 8px; text-align: center;"><i class="fa-solid fa-trash" style="color: #ef4444; cursor: pointer; font-size: 16px;" onclick="remove5SBatchRow(this)" title="Excluir Linha"></i></td>
    `;
    tbody.appendChild(tr);
}

function remove5SBatchRow(btn) {
    const tr = btn.closest('tr');
    if (tr) tr.remove();
}

function salvarAvaliacao5SLote() {
    const tbody = document.getElementById('5s-lote-tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let validosParaSalvar = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const lineNumber = i + 1;
        
        const resp = row.querySelector('.lote-resp').value.trim();
        const setor = row.querySelector('.lote-setor').value.trim();
        const notaStr = row.querySelector('.lote-nota').value.trim();
        const obs = row.querySelector('.lote-obs').value.trim();

        // 7. LINHAS TOTALMENTE VAZIAS
        if (!resp && !setor && !notaStr && !obs) {
            continue; // Ignore
        }

        // 8. LINHAS PARCIALMENTE PREENCHIDAS
        if (!resp) {
            alert(`Linha ${lineNumber}: informe o Responsável.`);
            return;
        }
        if (!setor) {
            alert(`Linha ${lineNumber}: informe o Setor / Rua.`);
            return;
        }
        if (!notaStr) {
            alert(`Linha ${lineNumber}: informe a Nota (%).`);
            return;
        }

        // 5. NOTA
        const notaNum = parseFloat(notaStr);
        if (isNaN(notaNum) || notaNum < 0 || notaNum > 100) {
            alert(`Linha ${lineNumber}: a nota deve estar entre 0 e 100.`);
            return;
        }

        // 11. ESTRUTURA DOS OBJETOS
        validosParaSalvar.push({
            responsavel: resp,
            setor: setor,
            nota: notaNum,
            observacao: obs
        });
    }

    // 17. MÍNIMO DE UMA AVALIAÇÃO
    if (validosParaSalvar.length === 0) {
        alert('Preencha pelo menos uma avaliação para salvar.');
        return;
    }

    // 10. ATOMICIDADE DO LOTE / 13. PERSISTÊNCIA
    const idx = oprHistoryDB.findIndex(r => r.id === currentOprRecordId);
    if (idx === -1) return;

    if (!oprHistoryDB[idx].data) oprHistoryDB[idx].data = {};
    if (!oprHistoryDB[idx].data.cincoSData) oprHistoryDB[idx].data.cincoSData = [];

    // Add all valid records
    const timeNow = Date.now();
    validosParaSalvar.forEach((item, index) => {
        // 12. CREATEDAT individualmente
        const uniqueId = '5s-' + (timeNow + index).toString(36) + Math.random().toString(36).substr(2, 5);
        oprHistoryDB[idx].data.cincoSData.push({
            id: uniqueId,
            responsavel: item.responsavel,
            setor: item.setor,
            nota: item.nota,
            observacao: item.observacao,
            createdAt: new Date(timeNow + index).toISOString(),
            dataRegistro: new Date(timeNow + index).toISOString() // for legacy compatibility
        });
    });

    // 18. RENDERIZAÇÃO APÓS SALVAR
    renderizar5S();
    if (typeof markOprDirty === "function") markOprDirty();
fecharModal5SLote();
}

async function deleteOpr(id) {
    if (!currentUser || !currentUser.permissions || !currentUser.permissions.delete) {
        showToast("Você não tem permissão para excluir One Page Reports.", "error");
        console.warn("[OPR] Exclusão bloqueada por permissão. Role:", currentUser ? currentUser.role : "desconhecido");
        return;
    }
    if (!confirm('Tem certeza que deseja excluir permanentemente este One Page Report? Esta acao nao pode ser desfeita.')) return;
    
    try {
        const meta = await OprHistoryRepository.getById(id);
        if (!meta) {
            alert("Metadados locais não encontrados para exclusão.");
            return;
        }
        
        const snapshotId = meta.snapshotId;
        let cloudErrors = [];

        // --- INICIO TOMBSTONE ---
        if (typeof db !== 'undefined' && db) {
            try {
                const deletedByStr = (typeof volatileObj !== 'undefined' && volatileObj.responsible) ? volatileObj.responsible : '';
                
                const tombstonePayload = {
                    id: id,
                    deletedAt: new Date().toISOString()
                };
                
                if (snapshotId) tombstonePayload.snapshotId = snapshotId;
                if (meta.branch) tombstonePayload.branch = meta.branch;
                if (deletedByStr) tombstonePayload.deletedBy = deletedByStr;

                await db.collection('opr_deleted').doc(id.toString()).set(tombstonePayload);
                console.log(`[Tombstone] Lápide criada para OPR ${id}`);
            } catch (err) {
                console.error("[Tombstone] Falha fatal ao criar lápide:", err);
                alert("Falha de rede ao registrar exclusão segura. Exclusão abortada.");
                return; // ABORT THE DELETE COMPLETELY
            }
        }
        // --- FIM TOMBSTONE ---

        
        // A) opr_history/{id} (Cloud)
        if (typeof db !== 'undefined' && db) {
            try {
                await db.collection('opr_history').doc(id.toString()).delete();
                console.log(`[Dual Delete] opr_history cloud apagado: ${id}`);
            } catch (err) {
                console.error("[Dual Delete] Falha ao apagar opr_history na nuvem:", err);
                cloudErrors.push("historico na nuvem");
            }
        }
        
        // B) opr_snapshots/{snapshotId} (Cloud)
        if (typeof db !== 'undefined' && db && snapshotId) {
            try {
                await db.collection('opr_snapshots').doc(snapshotId.toString()).delete();
                console.log(`[Dual Delete] opr_snapshots cloud apagado: ${snapshotId}`);
            } catch (err) {
                console.error("[Dual Delete] Falha ao apagar opr_snapshots na nuvem:", err);
                cloudErrors.push("snapshot na nuvem");
            }
        }
        
        // C) IndexedDB oprHistory (Local)
        await OprHistoryRepository.remove(id);
        
        // D) IndexedDB snapshots (Local)
        if (snapshotId) {
            await SnapshotRepository.remove(snapshotId);
        }
        
        // Remove from volatile memory if it's there
        if (typeof oprHistoryDB !== 'undefined') {
            const idx = oprHistoryDB.findIndex(r => r.id === id);
            if (idx !== -1) oprHistoryDB.splice(idx, 1);
        }
        
        if (currentOprRecordId === id) {
            currentOprRecordId = null;
            // Clear UI or switch view
            const mainContent = document.getElementById('opr-main-content');
            if (mainContent) mainContent.style.display = 'none';
        }
        
        if (cloudErrors.length > 0) {
            alert("Exclusão parcial: O OPR foi apagado localmente, mas houve falha ao apagar " + cloudErrors.join(" e ") + ". Pode ser necessario apagar manualmente depois.");
        } else {
            if (typeof showToast === 'function') showToast('OPR excluido com sucesso (Local + Cloud)!', 'success');
        }
        
        if (typeof currentOprBranch !== 'undefined' && currentOprBranch) {
            if (typeof openOprBranch === 'function') openOprBranch(currentOprBranch);
        } else {
            if (typeof renderOprHistoryList === 'function') renderOprHistoryList();
        }
    } catch (e) {
        console.error('Erro ao excluir OPR:', e);
        alert('Falha fatal ao excluir o OPR: ' + e.message);
    }
}

if (typeof window.aguaChartsCard === 'undefined') window.aguaChartsCard = {};

function renderizarGraficoAguaCard(empIndex, canvasId) {
    if (window.aguaChartsCard[empIndex]) {
        window.aguaChartsCard[empIndex].destroy();
    }

    const sMes = document.getElementById('agua-mes');
    const sAno = document.getElementById('agua-ano');
    let mes = "0", ano = new Date().getFullYear().toString();
    if (sMes && sAno) {
        mes = sMes.value;
        ano = sAno.value;
    }

    const record = typeof currentOprRecordId !== 'undefined' && currentOprRecordId
        ? oprHistoryDB.find(r => r.id === currentOprRecordId)
        : null;

    let wData = [0, 0, 0, 0, 0];

    if (record && record.data && record.data.aguaEmpilhadeiras && record.data.aguaEmpilhadeiras[ano] && record.data.aguaEmpilhadeiras[ano][mes]) {
        wData = record.data.aguaEmpilhadeiras[ano][mes];
    }

    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const config = {
        type: 'bar',
        data: {
            labels: ['S1', 'S2', 'S3', 'S4', 'S5'],
            datasets: [{
                label: 'Litros',
                data: wData,
                backgroundColor: '#3b82f6',
                borderRadius: 4,
                barPercentage: 0.6,
                datalabels: {
                    align: 'center',
                    anchor: 'center',
                    color: '#fff',
                    formatter: function(val) { return val > 0 ? val + ' L' : ''; },
                    font: { weight: '800', size: 11 }
                }
            }]
        },
        plugins: [window.ChartDataLabels],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    display: false,
                    suggestedMax: Math.max(...wData) * 1.2
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11, weight: '700' }, color: '#334155' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    };

    window.aguaChartsCard[empIndex] = new Chart(ctx, config);
}

window.addEventListener('beforeunload', function (e) {
    if (typeof oprDirty !== 'undefined' && (oprDirty || oprAutoSaveInProgress)) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// --- INICIO FASE A: MIGRACAO DE SNAPSHOTS OPR ---
window.migrateSnapshotsToCloud = async function() {
    console.log("Iniciando migracao de snapshots locais para o Firestore...");
    if (typeof db === 'undefined' || !db) {
        console.error("Firestore (db) nao disponivel.");
        return;
    }
    
    let report = {
        totalLocal: 0,
        jaExistiam: 0,
        criados: 0,
        atualizados: 0,
        ignorados: 0,
        falhas: 0,
        semDataConfiavel: 0,
        acimaDoLimite: 0
    };

    try {
        const localDb = await SimasDB.getDB();
        const tx = localDb.transaction('snapshots', 'readonly');
        const store = tx.objectStore('snapshots');
        const request = store.getAll();
        
        const localSnaps = await new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
        
        report.totalLocal = localSnaps.length;
        console.log(`Encontrados ${report.totalLocal} snapshots no IndexedDB.`);
        
        for (const snap of localSnaps) {
            try {
                const payload = JSON.parse(JSON.stringify(snap));
                const payloadStr = JSON.stringify(payload);
                
                if (payloadStr.length > 800000) {
                    console.warn(`Snapshot ${snap.id} ignorado por tamanho excessivo (~${(payloadStr.length/1024).toFixed(2)} KB).`);
                    report.acimaDoLimite++;
                    continue;
                }
                
                const docRef = db.collection('opr_snapshots').doc(snap.id.toString());
                const docSnap = await docRef.get();
                
                if (!docSnap.exists) {
                    await docRef.set(payload);
                    report.criados++;
                    console.log(`Snapshot ${snap.id} copiado para a nuvem (Novo).`);
                } else {
                    report.jaExistiam++;
                    const cloudData = docSnap.data();
                    
                    if (!snap.updatedAt || !cloudData.updatedAt) {
                        console.warn(`Snapshot ${snap.id} ignorado (necessita validacao - datas de update ausentes).`);
                        report.semDataConfiavel++;
                        continue;
                    }
                    
                    const localTime = new Date(snap.updatedAt).getTime();
                    const cloudTime = new Date(cloudData.updatedAt).getTime();
                    
                    if (isNaN(localTime) || isNaN(cloudTime)) {
                        console.warn(`Snapshot ${snap.id} ignorado (necessita validacao - formato de data invalido).`);
                        report.semDataConfiavel++;
                        continue;
                    }
                    
                    if (localTime > cloudTime) {
                        await docRef.set(payload);
                        report.atualizados++;
                        console.log(`Snapshot ${snap.id} atualizado na nuvem (Local era mais novo).`);
                    } else {
                        report.ignorados++;
                        console.log(`Snapshot ${snap.id} ignorado (Nuvem ja possui versao igual ou mais recente).`);
                    }
                }
            } catch (err) {
                console.error(`Falha ao migrar snapshot ${snap.id}:`, err);
                report.falhas++;
            }
        }
        
        console.log("=== RELATORIO DE MIGRACAO DE SNAPSHOTS ===");
        console.table([report]);
        
    } catch (e) {
        console.error("Erro critico na migracao:", e);
    }
};
// --- FIM FASE A ---

// --- INICIO FASE C2: MIGRACAO DE HISTORICO OPR ---
window.migrateOprHistoryToCloud = async function() {
    console.log("Iniciando migracao do Historico (opr_history) local para o Firestore...");
    if (typeof db === 'undefined' || !db) {
        console.error("Firestore (db) nao disponivel.");
        return;
    }
    
    let report = {
        totalLocal: 0,
        criados: 0,
        atualizados: 0,
        jaExistentes: 0,
        ignorados: 0,
        semDataConfiavel: 0,
        falhas: 0,
        idsAfetados: []
    };

    try {
        const localRecords = await OprHistoryRepository.list();
        report.totalLocal = localRecords.length;
        console.log(`Encontrados ${report.totalLocal} registros de historico no IndexedDB.`);
        
        for (const record of localRecords) {
            try {
                const payload = JSON.parse(JSON.stringify(record));
                const docRef = db.collection('opr_history').doc(record.id.toString());
                const docSnap = await docRef.get();
                
                if (!docSnap.exists) {
                    await docRef.set(payload);
                    report.criados++;
                    report.idsAfetados.push(`CRIADO: ${record.id}`);
                    console.log(`Historico ${record.id} copiado para a nuvem (Novo).`);
                } else {
                    report.jaExistentes++;
                    const cloudData = docSnap.data();
                    
                    if (!record.updatedAt || !cloudData.updatedAt) {
                        console.warn(`Historico ${record.id} ignorado (necessita validacao - datas de update ausentes).`);
                        report.semDataConfiavel++;
                        continue;
                    }
                    
                    const localTime = new Date(record.updatedAt).getTime();
                    const cloudTime = new Date(cloudData.updatedAt).getTime();
                    
                    if (isNaN(localTime) || isNaN(cloudTime)) {
                        console.warn(`Historico ${record.id} ignorado (necessita validacao - formato de data invalido).`);
                        report.semDataConfiavel++;
                        continue;
                    }
                    
                    if (localTime > cloudTime) {
                        await docRef.set(payload);
                        report.atualizados++;
                        report.idsAfetados.push(`ATUALIZADO: ${record.id}`);
                        console.log(`Historico ${record.id} atualizado na nuvem (Local era mais novo).`);
                    } else {
                        report.ignorados++;
                        console.log(`Historico ${record.id} ignorado (Nuvem ja possui versao igual ou mais recente).`);
                    }
                }
            } catch (err) {
                console.error(`Falha ao migrar historico ${record.id}:`, err);
                report.falhas++;
            }
        }
        
        console.log("=== RELATORIO DE MIGRACAO DE HISTORICO ===");
        console.table([{
            totalLocal: report.totalLocal,
            criados: report.criados,
            atualizados: report.atualizados,
            jaExistentes: report.jaExistentes,
            ignorados: report.ignorados,
            semDataConfiavel: report.semDataConfiavel,
            falhas: report.falhas
        }]);
        console.log("IDs Afetados:", report.idsAfetados);
        
    } catch (e) {
        console.error("Erro critico na migracao de historico:", e);
    }
};
// --- FIM FASE C2 ---


// ==================== 15. FIREBASE AUTH & GESTAO DE USUARIOS ====================

firebase.auth().onAuthStateChanged(async (user) => {
    if (window.registrationInProgress) {
        console.log("[AUTH REGISTER] onAuthStateChanged ignorado durante registro.");
        return;
    }

    const loginScreen = document.getElementById("login-screen");
    const mainApp = document.getElementById("main-application");

    if (user) {
        console.log("[AUTH] Sessão Firebase detectada.");
        try {
            const doc = await db.collection("simas_users").doc(user.uid).get();
            if (!doc.exists) {
                showToast("Usuário não localizado não banco de dados.", "error");
                await firebase.auth().signOut();
                return;
            }
            
            const userData = doc.data();
            
            if (userData.status === "pendente") {
                showToast("Aguardando liberação do Administrador Master.", "warning");
                await firebase.auth().signOut();
                return;
            }
            
            if (userData.status === "bloqueado") {
                showToast("Acesso bloqueado pelo Administrador.", "error");
                await firebase.auth().signOut();
                return;
            }
            
            if (userData.status === "ativo") {
                console.log(`[AUTH] Perfil carregado: ${userData.role}`);
                
                // Preenche a variável global
                currentUser = {
                    ...CORPORATE_USERS[userData.role], // base visual/perms
                    uid: user.uid,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    roleName: userData.roleName
                };
                
                console.log(`[AUTH] UID atual: ${currentUser.uid}`);
                console.log(`[AUTH] Nome atual: ${currentUser.name}`);
                console.log(`[AUTH] Role atual: ${currentUser.role}`);

                // Atualiza contadores de acesso
                await db.collection("simas_users").doc(user.uid).update({
                    lastLogin: new Date().toISOString(),
                    loginCount: firebase.firestore.FieldValue.increment(1)
                });
                
                // Exibe app
                if (loginScreen) loginScreen.classList.add("hidden");
                if (mainApp) mainApp.style.display = "flex";
                
                // Mostra/Oculta menu admin (MASTER LOGIC)
                const adminMenu = document.getElementById("menu-admin");
                const adminSection = document.getElementById("admin-section-label");
                if (currentUser.role === 'master') {
                    if (adminMenu) adminMenu.style.display = "flex";
                    if (adminSection) adminSection.style.display = "block";
                    renderAdminUsersList();
                } else {
                    if (adminMenu) adminMenu.style.display = "none";
                    if (adminSection) adminSection.style.display = "none";
                }
                
                // ARRANQUE AUTENTICADO ÚNICO
                await initializeAuthenticatedApp();
                
                showToast(`Bem-vindo, ${currentUser.name}!`, "success");
            }
        } catch (error) {
            console.error("Erro ao validar permissões:", error);
            await firebase.auth().signOut();
        }
    } else {
        // Deslogado
        currentUser = null;
        authenticatedAppInitialized = false;
        if (typeof adminUsersUnsubscribe === "function") {
            adminUsersUnsubscribe();
            adminUsersUnsubscribe = null;
        }
        if (mainApp) mainApp.style.display = "none";
        if (loginScreen) loginScreen.classList.remove("hidden");
    }
});

async function handleRegistration() {
    const email = document.getElementById("login-email").value;
    const passwordInput = document.getElementById("login-password");
    const password = passwordInput ? passwordInput.value : "password123";
    
    const regNameInput = document.getElementById("reg-name");
    const fullName = regNameInput && regNameInput.value.trim() !== "" ? regNameInput.value.trim() : email.split("@")[0];
    const regRoleInput = document.getElementById("reg-role");
    const requestedRole = regRoleInput ? regRoleInput.value : "visualizacao";

    if (!email || !password) {
        showToast("Preencha e-mail e senha para registrar.", "warning");
        return;
    }
    
    try {
        window.registrationInProgress = true;
        console.log("[AUTH REGISTER] Iniciando cadastro");
        showToast("Registrando usu\xe1rio...", "info");
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log("[AUTH REGISTER] Credential criada: " + user.uid);

        console.log("[AUTH REGISTER] Criando perfil simas_users");
        await db.collection("simas_users").doc(user.uid).set({
            uid: user.uid,
            name: fullName,
            email: email,
            role: "visualizacao",
            roleName: "Consulta",
            requestedRole: requestedRole,
            status: "pendente",
            createdAt: new Date().toISOString(),
            lastLogin: null,
            loginCount: 0,
            createdBy: "self_registration"
        });
        console.log("[AUTH REGISTER] Perfil Firestore criado");
        window.registrationInProgress = false;
        console.log("[AUTH REGISTER] Cadastro pendente conclu\xeddo");

        showToast("Cadastro realizado. Aguarde libera\xe7\xe3o do Administrador Master.", "success");
        await firebase.auth().signOut(); // Sai imediatamente pois pendente não entra
        
    } catch (e) {
        window.registrationInProgress = false;
        console.error("[AUTH REGISTER] Auth criado, mas perfil Firestore falhou.", e);
        showToast("O cadastro não pôde ser concluído (erro no banco de dados). Contate o TI.", "error");
    }
}

// ==================== PAINEL ADMINISTRATIVO (ADMIN LOGIC) ====================
let adminUsersDB = [];
let adminUsersUnsubscribe = null;

function renderAdminUsersList() {
    if (adminUsersUnsubscribe) return;
    
    adminUsersUnsubscribe = db.collection("simas_users").onSnapshot((snapshot) => {
        adminUsersDB = snapshot.docs.map(doc => doc.data());
        updateAdminStats();
        drawAdminTable(adminUsersDB);
    }, (error) => {
        console.error("Erro ao escutar usuários:", error);
    });
}

function updateAdminStats() {
    document.getElementById("admin-stat-total").innerText = adminUsersDB.length;
    document.getElementById("admin-stat-ativo").innerText = adminUsersDB.filter(u => u.status === 'ativo').length;
    document.getElementById("admin-stat-pendente").innerText = adminUsersDB.filter(u => u.status === 'pendente').length;
    document.getElementById("admin-stat-bloqueado").innerText = adminUsersDB.filter(u => u.status === 'bloqueado').length;
}

function drawAdminTable(users) {
    const tbody = document.getElementById("admin-users-tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#666;padding:20px;">Nenhum usuário encontrado.</td></tr>`;
        return;
    }
    
    users.forEach(user => {
        const tr = document.createElement("tr");
        
        let statusBadge = '';
        if (user.status === 'ativo') statusBadge = '<span style="background:#DCFCE7;color:#166534;padding:4px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;">Ativo</span>';
        else if (user.status === 'pendente') statusBadge = '<span style="background:#FEF9C3;color:#854D0E;padding:4px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;">Pendente</span>';
        else statusBadge = '<span style="background:#FEE2E2;color:#991B1B;padding:4px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;">Bloqueado</span>';
        
        let actions = ``;
        if (user.status === 'pendente') {
            actions += `<button class="btn-sm btn-outline" style="color:#166534;border-color:#166534;" onclick="activateUser('${user.uid}')"><i class="fa-solid fa-check"></i> Ativar</button>`;
        } else if (user.status === 'ativo') {
            actions += `<button class="btn-sm btn-outline" style="color:#991B1B;border-color:#991B1B;" onclick="toggleBlockUser('${user.uid}', 'bloqueado')"><i class="fa-solid fa-ban"></i> Bloquear</button>`;
        } else if (user.status === 'bloqueado') {
            actions += `<button class="btn-sm btn-outline" style="color:#166534;border-color:#166534;" onclick="toggleBlockUser('${user.uid}', 'ativo')"><i class="fa-solid fa-unlock"></i> Desbloq.</button>`;
        }
        actions += ` <button class="btn-sm btn-outline" style="color:#991B1B;border-color:#991B1B;" title="Excluir Perfil Admin" onclick="deleteAuthUser('${user.uid}')"><i class="fa-solid fa-trash"></i></button>`;

        let roleSelect = `<select onchange="changeUserRole('${user.uid}', this.value)" style="padding:4px;font-size:0.8rem;border:1px solid #ccc;border-radius:4px;">
            <option value="visualizacao" ${user.role === 'visualizacao' ? 'selected' : ''}>Visualização</option>
            <option value="operacao" ${user.role === 'operacao' ? 'selected' : ''}>Operação</option>
            <option value="gestao" ${user.role === 'gestao' ? 'selected' : ''}>Gestão</option>
            <option value="qualidade" ${user.role === 'qualidade' ? 'selected' : ''}>Qualidade</option>
            <option value="master" ${user.role === 'master' ? 'selected' : ''}>Master</option>
        </select>`;

        tr.innerHTML = `
            <td>
                <div style="font-weight:600;color:var(--text-main);">${user.name || 'S/N'}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary);">${user.email}</div>
            </td>
            <td>${roleSelect}</td>
            <td>${statusBadge}</td>
            <td style="font-size:0.8rem;">${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca acessou'}</td>
            <td style="text-align:center;font-weight:600;">${user.loginCount || 0}</td>
            <td style="font-size:0.8rem;">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
            <td style="text-align:center;">${actions}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function activateUser(uid) {
    if (!confirm("Deseja ativar este usuário? Ele passaráá a ter acesso ao portal.")) return;
    try {
        await db.collection("simas_users").doc(uid).update({ status: 'ativo' });
        showToast("Usuário ativado com sucesso.", "success");
    } catch (e) {
        console.error(e);
        showToast("Erro ao ativar usuário", "error");
    }
}

async function toggleBlockUser(uid, newStatus) {
    if (!confirm(`Deseja alterar o status para ${newStatus}?`)) return;
    try {
        await db.collection("simas_users").doc(uid).update({ status: newStatus });
        showToast(`Usuário marcado como ${newStatus}.`, "success");
    } catch (e) {
        console.error(e);
        showToast("Erro ao alterar status", "error");
    }
}

async function changeUserRole(uid, newRole) {
    try {
        await db.collection("simas_users").doc(uid).update({ 
            role: newRole,
            roleName: getRoleNameForSelect(newRole)
        });
        showToast("Perfil atualizado.", "success");
    } catch (e) {
        console.error(e);
        showToast("Erro ao alterar perfil", "error");
    }
}

function getRoleNameForSelect(r) {
    const roles = { 'visualizacao': 'Consulta', 'operacao': 'Operação', 'gestao': 'Gestão', 'qualidade': 'Qualidade', 'master': 'Administrador Master' };
    return roles[r] || r;
}

async function deleteAuthUser(uid) {
    if (!confirm("Deseja DELETAR este registro administrativo? Atenção: isso NÃO remove a conta não Firebase Auth (necessita Admin SDK), apenas revoga o acesso ao Portal excluindo o documento simas_users.")) return;
    try {
        await db.collection("simas_users").doc(uid).delete();
        showToast("Registro administrativo excluído. O acesso ao portal foi revogado.", "success");
    } catch (e) {
        console.error(e);
        showToast("Erro ao excluir", "error");
    }
}

function filterAdminUsersByStatus(status) {
    if (!status) {
        drawAdminTable(adminUsersDB);
    } else {
        drawAdminTable(adminUsersDB.filter(u => u.status === status));
    }
}

function adminSearchUsers(term) {
    const q = term.toLowerCase();
    const filtered = adminUsersDB.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q))
    );
    drawAdminTable(filtered);
}


// --- Correção Drag and Drop ---
function setupDragAndDrop(zoneId, inputId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if (!zone || !input) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        zone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        zone.addEventListener(eventName, () => {
            zone.style.borderStyle = 'solid';
            zone.style.borderColor = 'var(--primary, #0B1D32)';
            zone.style.backgroundColor = 'rgba(0, 82, 204, 0.05)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        zone.addEventListener(eventName, () => {
            zone.style.borderStyle = 'dashed';
            zone.style.borderColor = '#cbd5e1';
            zone.style.backgroundColor = '';
        }, false);
    });

    zone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files && files.length > 0) {
            input.files = files;
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        }
    }, false);
}


function initDND() {
    setupDragAndDrop('upload-zone', 'form-pop-file');
    setupDragAndDrop('upload-zone-evidencia', 'form-pop-evidencia');
    setupDragAndDrop('upload-zone-copia-nc', 'form-pop-copia-nc');
    setupDragAndDrop('upload-zone-pop-homologado', 'form-pop-pop-homologado');
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDND);
} else {
    initDND();
}




// --- AUXILIARY STICKY SCROLLBAR FOR POPS TABLE ---
document.addEventListener('DOMContentLoaded', () => {
    const tableContainer = document.getElementById('pops-table-container');
    const tableId = document.getElementById('pops-table-id');
    const stickyScrollbar = document.getElementById('pops-sticky-scrollbar');
    const stickyContent = document.getElementById('pops-sticky-scrollbar-content');

    if (tableContainer && tableId && stickyScrollbar && stickyContent) {
        
        const syncWidths = () => {
            stickyContent.style.width = tableId.offsetWidth + 'px';
        };
        
        if (window.ResizeObserver) {
            new ResizeObserver(syncWidths).observe(tableId);
        } else {
            window.addEventListener('resize', syncWidths);
            setInterval(syncWidths, 1000);
        }
        
        let isSyncingLeft = false;
        let isSyncingRight = false;
        
        tableContainer.addEventListener('scroll', () => {
            if (!isSyncingLeft) {
                isSyncingRight = true;
                stickyScrollbar.scrollLeft = tableContainer.scrollLeft;
            }
            isSyncingLeft = false;
        });
        
        stickyScrollbar.addEventListener('scroll', () => {
            if (!isSyncingRight) {
                isSyncingLeft = true;
                tableContainer.scrollLeft = stickyScrollbar.scrollLeft;
            }
            isSyncingRight = false;
        });
        
        const toggleStickyScrollbar = () => {
            // Only show if the pops module is active/visible
            const popsSection = document.getElementById('view-pops');
            if (popsSection && !popsSection.classList.contains('active')) {
                stickyScrollbar.style.display = 'none';
                return;
            }

            const rect = tableContainer.getBoundingClientRect();
            // Visible condition: Top is above viewport bottom, Bottom is below viewport bottom
            const isPartiallyVisible = rect.top < window.innerHeight && rect.bottom > window.innerHeight;
            
            if (isPartiallyVisible && tableId.offsetWidth > tableContainer.offsetWidth) {
                stickyScrollbar.style.display = 'block';
                stickyScrollbar.style.position = 'fixed';
                stickyScrollbar.style.bottom = '0';
                stickyScrollbar.style.left = rect.left + 'px';
                stickyScrollbar.style.width = rect.width + 'px';
            } else {
                stickyScrollbar.style.display = 'none';
            }
        };
        
        window.addEventListener('scroll', toggleStickyScrollbar);
        window.addEventListener('resize', toggleStickyScrollbar);
        
        // Initial setup
        setTimeout(() => {
            syncWidths();
            toggleStickyScrollbar();
        }, 500);
    }
});
