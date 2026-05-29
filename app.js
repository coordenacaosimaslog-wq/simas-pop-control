/**
 * SIMAS LOGÃSTICA LTDA - CONTROLE DE REVISÃO DE POPS
 * INTELIGÊNCIA JAVASCRIPT - VERSÃO ULTRA COMPATÃVEL E RESILIENTE
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

// ==================== 1. CONFIGURAÇÃO DE USUÃRIOS E PERMISSÕES (MOCK AD) ====================
const CORPORATE_USERS = {
    qualidade: {
        name: "Carla Souza",
        roleName: "Qualidade",
        role: "qualidade",
        avatar: "CS",
        email: "qualidade@simaslogistica.com.br",
        permissions: { create: true, edit: true, delete: true, validate: true }
    },
    operacao: {
        name: "Julio Cesar",
        roleName: "Operao",
        role: "operacao",
        avatar: "JC",
        email: "operacao@simaslogistica.com.br",
        permissions: { create: true, edit: true, delete: false, validate: false }
    },
    gestação: {
        name: "Dr. Marcos Pontes",
        roleName: "Gestão",
        role: "gestao",
        avatar: "MP",
        email: "gestação@simaslogistica.com.br",
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

// ==================== 4. LEITURA SEGURA DE DADOS DO BANCO LOCAL E NUVEM ====================

let pops = INITIAL_POPS;

// FUNÇÃO DE CARREGAMENTO SEGURO
async function loadSimasData() {
    try {
        if (typeof db !== 'undefined') {
            // FIREBASE MODE
            db.collection("simas_pops").onSnapshot(async (snapshot) => {
                try {
                    if (!snapshot.empty) {
                        pops = snapshot.docs.map(doc => doc.data());
                        pops.sort((a, b) => {
                            const numA = parseInt(a.id.replace("pop-", ""), 10) || 0;
                            const numB = parseInt(b.id.replace("pop-", ""), 10) || 0;
                            return numB - numA;
                        });
                        if (typeof applyFilters === 'function') applyFilters();
                    } else {
                        // Firebase vazio, tenta migrar dados locais se existirem
                        const rawPops = await DBStore.getItem("simas_pops");
                        if (rawPops) {
                            const localPops = typeof rawPops === 'string' ? JSON.parse(rawPops) : rawPops;
                            if (localPops.length > 0) {
                                showToast("Sincronizando dados locais com a nuvem. Aguarde...", "info");
                                for (const p of localPops) {
                                    await db.collection("simas_pops").doc(p.id).set(p);
                                }
                                pops = localPops;
                                showToast("Migração para a nuvem concluída!", "success");
                            } else {
                                pops = [];
                            }
                        } else {
                            pops = [];
                        }
                        if (typeof applyFilters === 'function') applyFilters();
                    }
                } catch (e) {
                    console.error("Erro no processamento em tempo real dos POPs:", e);
                }
            }, (error) => {
                console.error("Falha ao escutar POPs na nuvem:", error);
            });
        } else {
            // OFFLINE MODE (IndexedDB)
            const rawPops = await DBStore.getItem("simas_pops");
            if (rawPops) {
                pops = typeof rawPops === 'string' ? JSON.parse(rawPops) : rawPops;
            } else {
                pops = [];
            }
            if (typeof applyFilters === 'function') applyFilters();
        }
        
        // --- INICIALIZAÇÃO DE TREINAMENTOS ---
        if (typeof db !== 'undefined') {
            db.collection("simas_trainings").onSnapshot((snapshot) => {
                try {
                    if (!snapshot.empty) {
                        trainings = snapshot.docs.map(doc => doc.data());
                        trainings.sort((a, b) => new Date(b.dataAplicacao) - new Date(a.dataAplicacao));
                    } else {
                        trainings = [];
                    }
                    if (typeof applyTrainingFilters === 'function') applyTrainingFilters();
                } catch (e) {
                    console.error("Erro no processamento em tempo real dos Treinamentos:", e);
                }
            }, (error) => {
                console.error("Falha ao escutar Treinamentos na nuvem:", error);
            });
        } else {
            const rawTrainings = await DBStore.getItem("simas_trainings");
            if (rawTrainings) {
                trainings = typeof rawTrainings === 'string' ? JSON.parse(rawTrainings) : rawTrainings;
            } else {
                trainings = [];
            }
            if (typeof applyTrainingFilters === 'function') applyTrainingFilters();
        }
        
    } catch (globalErr) {
        console.error("Erro crítico ao inicializar banco de dados principal:", globalErr);
    }
}

// Chamar a função imediatamente
loadSimasData();

let auditLogs = INITIAL_LOGS;
try {
    const rawLogs = SafeStorage.getItem("simas_audit_logs");
    if (rawLogs) auditLogs = JSON.parse(rawLogs);
} catch (e) {
    console.error("Falha ao ler dados de Logs:", e);
}

// Variáveis Globais Adicionais
let activeView = "dashboard";
let currentPage = 1;
const itemsPerPage = 20;
let filteredPops = [];
let trainings = [];
let filteredTrainings = [];
let chartFilialInstance = null;
let chartAreaInstance = null;
let chartStatusInstance = null;
let activeUploadedFile = null;

// ==================== UTILITÁRIOS DE DATA ====================
window.formatDate = function(dateStr) {
    if (!dateStr) return "-";
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
};

// ==================== 5. INICIALIZAÇÃO DA APLICAÇÃO (DOMContentLoaded) ====================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Verificar se já existe credencial ativa persistida
        const savedUser = SafeStorage.getItem("simas_active_user");
        if (savedUser && CORPORATE_USERS[savedUser]) {
            currentUser = CORPORATE_USERS[savedUser];
        }
        
        // Sincronizar campo de perfil
        const headerSelect = document.getElementById("header-role-select");
        if (headerSelect) headerSelect.value = currentUser.role;
        
        // Atualizar UI com base no usuário ativo
        updateUserProfileUI();
        applyPermissions();
        
        // Inicializar os filtros anuais e renderizar
        if(typeof renderYearFilters === 'function') renderYearFilters();
        if(typeof renderMetricsGrid === 'function') renderMetricsGrid();
        
        // Exibir primeira view
        switchTab('pops');
        renderPopsTable();
        
        // Preencher os credenciais padrão baseadas no usuário 'qualidade'
        fillLoginFields('qualidade');

        // Configurar Drag and Drop no Campo de Upload
        const uploadZone = document.getElementById("upload-zone");
        if (uploadZone) {
            ['dragenter', 'dragover'].forEach(eventName => {
                uploadZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    uploadZone.classList.add("dragover");
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                uploadZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    uploadZone.classList.remove("dragover");
                }, false);
            });

            uploadZone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files && files.length > 0) {
                    const fileInput = document.getElementById("form-pop-file");
                    if (fileInput) {
                        fileInput.files = files;
                    }
                    processSelectedFile(files[0]);
                }
            }, false);
        }
    } catch (e) {
        console.error("Erro na inicializao do sistema:", e);
    }
});

// ==================== 6. CONTROLE DE LOGIN E AUTENTICAÇÃO ====================

// Preenche os campos do formulário para demonstrao rápida
function fillLoginFields(profileKey) {
    const user = CORPORATE_USERS[profileKey];
    if (user) {
        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("login-password");
        if (emailInput) emailInput.value = user.email;
        if (passwordInput) passwordInput.value = "password123";
    }
}

// Seleciona um perfil rápido e faz login imediato
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

function handleFormLogin(event) {
    event.preventDefault();
    try {
        const email = document.getElementById("login-email").value;
        
        // Encontra o usuário correspondente ao e-mail
        let matchedProfileKey = 'visualizacao';
        for (const key in CORPORATE_USERS) {
            if (CORPORATE_USERS[key].email === email) {
                matchedProfileKey = key;
                break;
            }
        }
        
        currentUser = CORPORATE_USERS[matchedProfileKey];
        SafeStorage.setItem("simas_active_user", matchedProfileKey);
        
        performLogin();
    } catch (e) {
        console.error("Erro no envio do formulário de login:", e);
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

function logout() {
    try {
        logAction("Logout", "-", `Usuário ${currentUser.name} encerrou a sessão.`);
        SafeStorage.removeItem("simas_active_user");
        
        // Oculta app e exibe login
        const loginScreen = document.getElementById("login-screen");
        const mainApp = document.getElementById("main-application");
        
        if (mainApp) mainApp.style.display = "none";
        if (loginScreen) loginScreen.classList.remove("hidden");
        
        showToast("Sessão encerrada com segurança.", "info");
    } catch (e) {
        console.error("Erro ao efetuar logout:", e);
    }
}

// Atualiza o widget no rodapé da barra lateral e seletor do header
function updateUserProfileUI() {
    try {
        const avatar = document.getElementById("sidebar-user-avatar");
        const name = document.getElementById("sidebar-user-name");
        const badge = document.getElementById("sidebar-user-role-badge");
        const headerSelect = document.getElementById("header-role-select");
        
        if (avatar) avatar.innerText = currentUser.avatar || 'US';
        if (name) name.innerText = currentUser.name;
        if (badge) {
            badge.innerText = currentUser.roleName;
            // Cores corporativas por perfil
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

        // Atualiza o avatar no painel admin se existir
        const adminTotalPops = document.getElementById('admin-info-total-pops');
        const adminTotalUsers = document.getElementById('admin-info-total-users');
        if (adminTotalPops && typeof pops !== 'undefined') adminTotalPops.innerText = pops.length;
    } catch (e) {
        console.error("Erro ao atualizar perfil do usuário na UI:", e);
    }
}

// ==================== 7. CONTROLE DE PERMISSÕES DINÂMICAS ====================
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
    } catch (e) {
        console.error("Erro ao aplicar restrições de permissões:", e);
    }
}

// ==================== 8. GERENCIADOR DE VISUALIZAÇÕES (SPA ROUTING) ====================
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
        
        if (viewId === "dashboard") {
            if (title) title.innerText = "Dashboard Operacional";
            if (desc) desc.innerText = "Painel consolidado com indicadores de qualidade, gráficos e urgências documentais";
            setTimeout(() => {
                initOrUpdateCharts();
                renderUrgentDashboardList();
            }, 50);
        } else if (viewId === "pops") {
            if (title) title.innerText = "Controle de POPs";
            if (desc) desc.innerText = "Controle e rastreabilidade de Procedimentos Operacionais Padrão por filiais";
            applyFilters();
        } else if (viewId === "trainings") {
            if (title) title.innerText = "Cronograma de Treinamento";
            if (desc) desc.innerText = "Agendamento, acompanhamento e registro de treinamentos da qualidade";
            if (typeof applyTrainingFilters === 'function') applyTrainingFilters();
        } else if (viewId === "audit") {
            if (title) title.innerText = "Histórico de Logs (Trilha de Auditoria)";
            if (desc) desc.innerText = "Log regulatório de conformidade da Simas Logística (Anvisa / ISO)";
            renderLogsTable();
        } else if (viewId === "integrations") {
            if (title) title.innerText = "Integrações Corporativas Microsoft 365";
            if (desc) desc.innerText = "Configurao e conexões nativas com SharePoint, Planner, Power BI e Forms";
            renderIntegrations();
        }
        
        // Fecha painel de notificações
        const panel = document.getElementById("notifications-panel");
        if (panel) panel.style.display = "none";
    } catch (e) {
        console.error("Erro na navegao de tela SPA:", e);
    }
}

// ==================== 9. LÓGICA DE ALERTAS E VENCIMENTOS ====================
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
    if (!panel) return;
    panel.style.display = panel.style.display === "none" ? "block" : "none";
}

function clearAllNotifications() {
    try {
        const panel = document.getElementById("notifications-panel");
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

// ==================== 10. INTEGRAÇÃO COM GRÃFICOS (FALLBACK OFF-LINE GARANTIDO) ====================
function initOrUpdateCharts() {
    try {
        const filiais = ["Matriz", "Camaçari", "Funeas", "SJP Prefeitura", "São Roque", "Sorocaba", "Governador Valadares", "Juatuba", "Contagem"];
        const countsPerFilial = filiais.map(f => pops.filter(pop => pop.filial === f).length);
        
        const countsStatus = {
            Revisado: pops.filter(pop => pop.status === "REVISADO").length,
            Validacao: pops.filter(pop => pop.status === "AGUARDANDO APROVAÇAO").length,
            Aprovado: pops.filter(pop => pop.status === "COPIA NÃO CONTROLADA").length,
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

        // === SE O CHART.JS NÃO ESTIVER CARREGADO (SEM INTERNET) ===
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
                            <span><i class="fa-solid fa-circle" style="color:#3b82f6;"></i> AGUARDANDO APROVAÇAO:</span> <strong>${countsStatus.Validacao} (${((countsStatus.Validacao/total)*100).toFixed(0)}%)</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                            <span><i class="fa-solid fa-circle" style="color:#0d9488;"></i> COPIA NÃO CONTROLADA:</span> <strong>${countsStatus.Aprovado} (${((countsStatus.Aprovado/total)*100).toFixed(0)}%)</strong>
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
                            grid: { color: '#E2E8F0' },
                            ticks: { stepSize: 1, color: '#4A6B82' }
                        },
                        y: {
                            grid: { display: false },
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
                    labels: ['REVISADO', 'AGUARDANDO APROVAÇAO', 'COPIA NÃO CONTROLADA', 'HOMOLOGADO', 'VENCIDO'],
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
            const labelText = isExpired ? `EXPIRADO HÃ ${Math.abs(item.daysDiff)} DIAS` : `VENCE EM ${item.daysDiff} DIAS`;
            
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
            if (filialVal && pop.filial !== filialVal) return false;
            if (tipoVal && pop.tipo !== tipoVal) return false;
            if (areaVal && pop.area !== areaVal) return false;
            if (statusVal && pop.status !== statusVal) return false;
            if (abrangenciaVal && (pop.abrangencia || "Global") !== abrangenciaVal) return false;
            
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

// ==================== 12. RENDERIZAÇÃO DA TABELA E PAGINAÇÃO ====================
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
            } else if (pop.status === "COPIA NÃO CONTROLADA") {
                statusClass += "aprovado";
                statusIcon = "fa-circle-check";
            } else if (pop.status === "HOMOLOGADO") {
                statusClass += "homologado";
                statusIcon = "fa-stamp";
            } else if (pop.status === "AGUARDANDO APROVAÇAO") {
                statusClass += "validacao";
                statusIcon = "fa-clock-rotate-left";
            } else if (pop.status === "VENCIDO") {
                statusClass += "vencido";
                statusIcon = "fa-radiation";
            }
            
            let editBtn = `<button class="btn-icon" onclick="openEditPOPModal('${pop.id}')" title="Editar Informações"><i class="fa-solid fa-pen-to-square"></i></button>`;
            let deleteBtn = `<button class="btn-icon delete" onclick="deletePOP('${pop.id}')" title="Excluir POP"><i class="fa-solid fa-trash"></i></button>`;
            let downloadBtn = `<button class="btn-icon" onclick="downloadPOP('${pop.id}')" style="color: var(--brand);" title="Baixar Arquivo"><i class="fa-solid fa-download"></i></button>`;
            
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

// ==================== 13. CADASTRO E EDIÇÃO (CRUD) ====================
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
    return 'fa-file-lines text-secondary';
}

function processSelectedFile(file) {
    if (file) {
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
            showToast("Erro ao ler o arquivo local.", "danger");
        };
        reader.readAsDataURL(file);
    }
}

function handleFileSelect(event) {
    try {
        const file = event.target.files[0];
        processSelectedFile(file);
    } catch (e) {
        console.error("Erro no upload do arquivo:", e);
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
        }
        
        activeUploadedFile = null;
        document.getElementById("uploaded-file-info").style.display = "none";
        document.getElementById("upload-zone").style.display = "flex";
        
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
        document.getElementById("form-pop-responsavel").value = pop.responsavel;
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
        
        document.getElementById("pop-modal-title").innerHTML = `<i class="fa-solid fa-file-pen"></i> Atualizar POP: ${pop.codigo}`;
        document.getElementById("btn-save-pop-submit").innerText = "Salvar Alterações";
        
        // Regras de validao baseadas no papel
        const statusSelect = document.getElementById("form-pop-status");
        if (statusSelect) {
            if (!currentUser.permissions.validate) {
                // Remove opção "Revisado" para quem não é Qualidade/Gestão
                Array.from(statusSelect.options).forEach(opt => {
                    if (opt.value === 'REVISADO') opt.disabled = true;
                });
            } else {
                Array.from(statusSelect.options).forEach(opt => opt.disabled = false);
            }
        }
        
        document.getElementById("pop-modal").classList.add("active");
    } catch (e) {
        console.error("Erro ao abrir modal de edição:", e);
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
        const status = document.getElementById("form-pop-status").value;
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
        
        if (id) {
            const index = pops.findIndex(p => p.id === id);
            if (index === -1) return;
            
            const oldPop = pops[index];
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
                arquivo: activeUploadedFile ? activeUploadedFile.name : oldPop.arquivo,
                historico: [
                    ...oldPop.historico,
                    { data: todayStr, autor: `${currentUser.name} (${currentUser.roleName})`, acao: `Edição de ciclo documental. Status anterior: ${oldStatus} -> Atual: ${status}.` }
                ]
            };
            
            if (popToSave.fileUrl) delete popToSave.fileUrl; // Limpar url legada se existir
            
            pops[index] = popToSave;
            logAction("Edição", codigo, `Editou o POP ${codigo} (${filial}). Status alterado: ${oldStatus} -> ${status}.`);
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
                historico: [
                    { data: todayStr, autor: `${currentUser.name} (${currentUser.roleName})`, acao: `Criação documental primária. Status: ${status}.` }
                ]
            };
            
            pops.unshift(popToSave);
            logAction("Criação", codigo, `Criou o POP ${codigo} (${filial}) na Área ${area}.`);
        }
        
        // 1. Salvar os metadados principais no Firestore
        showToast("Salvando metadados na nuvem...", "info");
        await db.collection("simas_pops").doc(newIdStr).set(popToSave);
        
        // 2. Fragmentar o arquivo em partes de 800KB para driblar o limite de 1MB do Firestore
        if (activeUploadedFile) {
            showToast("Fazendo upload fragmentado do anexo...", "info");
            const fileData = activeUploadedFile.data;
            // Pedaços de ~800 mil caracteres (cerca de 800KB)
            const chunks = fileData.match(/.{1,800000}/g) || [];
            
            await db.collection("simas_pops").doc(newIdStr).update({ numChunks: chunks.length });
            
            for (let i = 0; i < chunks.length; i++) {
                await db.collection("simas_pops").doc(newIdStr).collection("chunks").doc(`chunk_${i}`).set({
                    data: chunks[i],
                    index: i
                });
            }
        }
        
        showToast(`POP '${codigo}' salvo na nuvem com sucesso!`, "success");
        closePOPModal();
        
        if (!id) {
            currentPage = 1;
            clearFilters(false);
        } else {
            applyFilters();
        }
        checkExpirationsAndAlert();
    } catch (e) {
        console.error("Erro ao salvar POP:", e);
        showToast("Erro crítico ao salvar documento na nuvem.", "error");
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
        
        const check = confirm(`ATENÇÃO DE CONTROLE DE QUALIDADE!\nVocê está excluindo DEFINITIVAMENTE o POP '${pop.codigo}'.\nEsta ao gera um registro compulsório e nao-refutavel na trilha de auditoria.\nDeseja prosseguir?`);
        
        if (check) {
            pops = pops.filter(p => p.id !== id);
            await db.collection("simas_pops").doc(id).delete();
            
            logAction("Exclusão", pop.codigo, `EXCLUIU DEFINITIVAMENTE o POP ${pop.codigo} da filial ${pop.filial}.`);
            showToast(`POP ${pop.codigo} removido. Log de exclusão registrado.`, "success");
            
            applyFilters();
            checkExpirationsAndAlert();
        }
    } catch (e) {
        console.error("Erro ao deletar POP:", e);
    }
}

// ==================== 14. MODAL DETALHADO & HISTÓRICO DE REVISÃO (TIMELINE) ====================
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
        document.getElementById("details-responsavel").innerText = pop.responsavel;
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
            else if (pop.status === 'AGUARDANDO APROVAÇAO') { badgeClass = 'validacao';  badgeIcon = 'fa-clock-rotate-left'; }
            else if (pop.status === 'COPIA NÃO CONTROLADA')    { badgeClass = 'aprovado';   badgeIcon = 'fa-circle-check'; }
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

// ==================== TOAST NOTIFICATIONS ====================
window.showToast = function(message, type = "info") {
    const container = document.getElementById("toast-container-id");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let iconClass = "fa-circle-info";
    if (type === "success") iconClass = "fa-check-circle";
    else if (type === "error") iconClass = "fa-circle-exclamation";
    else if (type === "warning") iconClass = "fa-triangle-exclamation";
    
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 4000);
};

// ==================== 15. AUDIT TRAIL LOGGING ====================
function logAction(action, popCodigo, descricao) {
    try {
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        
        const newLog = {
            timestamp,
            usuario: currentUser.name,
            perfil: currentUser.roleName,
            acao,
            popCodigo,
            descricao
        };
        
        auditLogs.unshift(newLog);
        SafeStorage.setItem("simas_audit_logs", JSON.stringify(auditLogs));
    } catch (e) {
        console.error("Erro ao registrar log de auditoria:", e);
    }
}

function renderLogsTable() {
    try {
        const tbody = document.getElementById("audit-logs-body");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        
        if (auditLogs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Sem registros.</td></tr>`;
            return;
        }
        
        auditLogs.forEach(log => {
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
        console.error("Erro ao renderizar logs:", e);
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

// ==================== 16. EXPORTAÇÕES ====================
function exportToCSV() {
    try {
        logAction("Exportao", "-", "Exportou catálogo de POPs para planilha Excel.");
        let csv = "\uFEFF"; // BOM
        csv += "Código;Título;Filial;Tipo;ÃÁrea;Responsável;Data de Revisão;Próxima Revisão;Status;Observações\r\n";
        
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

function exportMasterList() {
    try {
        logAction("Exportao", "-", "Gerou a Lista Mestre Geral de todos os POPs.");
        let csv = "\uFEFF"; // BOM
        csv += "Código;Título;Filial;Tipo;ÃÁrea;Responsável;Data de Revisão;Próxima Revisão;Status;Observações\r\n";
        
        // Exporta TODOS os documentos (pops), não apenas os filtrados
        pops.forEach(pop => {
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
        link.setAttribute("download", `Lista_Mestre_POPs_Simas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast("Lista Mestre baixada com sucesso.", "success");
    } catch (e) {
        console.error("Erro ao exportar Lista Mestre:", e);
        showToast("Erro ao gerar Lista Mestre. Tente novamente.", "danger");
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
            let assembledData = "";
            for (let i = 0; i < pop.numChunks; i++) {
                const chunkDoc = await db.collection("simas_pops").doc(id).collection("chunks").doc(`chunk_${i}`).get();
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



// ============================================================
// MÓDULO DE TREINAMENTOS (CRONOGRAMA)
// ============================================================

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
    
    if (id) {
        const t = trainings.find(x => x.id === id);
        if (t) {
            document.getElementById("training-modal-title").innerHTML = `<i class="fa-solid fa-pen"></i> Editar Treinamento`;
            document.getElementById("training-id").value = t.id;
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
            if (idx !== -1) trainings[idx] = trainingObj;
            else trainings.push(trainingObj);
        } else {
            trainingObj.id = 'train-' + Date.now();
            trainingObj.createdAt = new Date().toISOString();
            trainings.push(trainingObj);
        }
        
        // Salvar offline
        DBStore.setItem("simas_trainings", trainings);
        
        if (typeof db !== 'undefined') {
            await db.collection("simas_trainings").doc(trainingObj.id).set(trainingObj);
            showToast("Treinamento salvo com sucesso!", "success");
            logAction("Treinamento", trainingObj.tema, `Agendou/Editou o treinamento: ${trainingObj.tema}`);
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


// ==================== DASHBOARD DE TREINAMENTOS ====================
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

// Chamar a atualização do dashboard sempre que os dados mudarem
const originalApplyTrainingFilters = applyTrainingFilters;
applyTrainingFilters = function() {
    originalApplyTrainingFilters();
    updateTrainingDashboard();
};

// ==================== IMPORTAÇÃO DE EXCEL (SheetJS) ====================
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
                
                trainings.push(trainingObj);
                
                if (typeof db !== 'undefined') {
                    await db.collection('simas_trainings').doc(trainingObj.id).set(trainingObj);
                }
                countImported++;
            }
            
            DBStore.setItem('simas_trainings', trainings);
            applyTrainingFilters();
            
            showToast(countImported + ' treinamentos importados com sucesso!', 'success');
            logAction('Treinamento', 'Importação', `Importou ${countImported} treinamentos via planilha.`);
            
        } catch (err) {
            console.error('Erro na importação:', err);
            showToast('Erro ao processar a planilha. Verifique o formato.', 'error');
        } finally {
            event.target.value = ''; // Limpa o input
        }
    };
    reader.readAsArrayBuffer(file);
}


// ==========================================
// EXPORTAÇÃO DE CRONOGRAMA PARA PDF
// ==========================================
const simasLogoBase64 = 'data:image/png;base64,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';

function exportTrainingsToPDF() {
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
        
        // Logo Simas
        try {
            const logoParts = simasLogoBase64.split(',');
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
        
        doc.text("Doc:", 185, 19);
        doc.setFont('helvetica', 'normal');
        doc.text("MT FM RH 003.ANX1", 195, 19);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Revisão:", 185, 24);
        doc.setFont('helvetica', 'normal');
        doc.text("01", 200, 24);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Elaborado em:", 185, 29);
        doc.setFont('helvetica', 'normal');
        doc.text("12/11/2025", 210, 29);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Aprovado em:", 185, 34);
        doc.setFont('helvetica', 'normal');
        doc.text("17/11/2025", 208, 34);
        
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
