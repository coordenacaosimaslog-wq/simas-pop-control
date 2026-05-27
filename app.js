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

// Inscrever-se para atualizações em tempo real do Firestore
db.collection("simas_pops").onSnapshot(async (snapshot) => {
    try {
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

        if (typeof applyFilters === 'function') {
            applyFilters();
        }
    } catch (e) {
        console.error("Erro no processamento em tempo real dos POPs:", e);
    }
}, (error) => {
    console.error("Falha ao escutar POPs na nuvem:", error);
});

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
const itemsPerPage = 5;
let filteredPops = [...pops];

// Instâncias do Chart.js
let chartFilialInstance = null;
let chartStatusInstance = null;
let activeUploadedFile = null;

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
                        backgroundColor: ['#15803D', '#1D4ED8', '#0F766E', '#4338CA', '#A30D00'], /* Aprovado/Revisado semantic, Homologado/Vencido brand colors */
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
        
        const filialVal = document.getElementById("filter-filial").value;
        const tipoVal = document.getElementById("filter-tipo").value;
        const areaVal = document.getElementById("filter-area").value;
        const statusVal = document.getElementById("filter-status").value;
        const abrangenciaVal = document.getElementById("filter-abrangencia") ? document.getElementById("filter-abrangencia").value : "";
        const responsavelVal = document.getElementById("filter-responsavel").value.toLowerCase().trim();
        const anoRevVal = document.getElementById("filter-ano-revisao") ? document.getElementById("filter-ano-revisao").value : "";
        const anoProxVal = document.getElementById("filter-ano-proxima") ? document.getElementById("filter-ano-proxima").value : "";
        const searchVal = document.getElementById("pop-search-input") ? document.getElementById("pop-search-input").value.toLowerCase().trim() : "";
        
        filteredPops = pops.filter(pop => {
            if (filialVal && pop.filial !== filialVal) return false;
            if (tipoVal && pop.tipo !== tipoVal) return false;
            if (areaVal && pop.area !== areaVal) return false;
            if (statusVal && pop.status !== statusVal) return false;
            if (abrangenciaVal && (pop.abrangencia || "Global") !== abrangenciaVal) return false;
            
            if (anoRevVal && pop.dataRevisao) {
                if (!pop.dataRevisao.startsWith(anoRevVal)) return false;
            }
            if (anoProxVal && pop.proximaRevisao) {
                if (!pop.proximaRevisao.startsWith(anoProxVal)) return false;
            }
            
            if (responsavelVal && !pop.responsavel.toLowerCase().includes(responsavelVal)) return false;
            
            if (searchVal) {
                const matches = 
                    pop.codigo.toLowerCase().includes(searchVal) ||
                    pop.titulo.toLowerCase().includes(searchVal) ||
                    (pop.tipo || "").toLowerCase().includes(searchVal) ||
                    pop.responsavel.toLowerCase().includes(searchVal) ||
                    pop.area.toLowerCase().includes(searchVal);
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
            const tipoLower = (pop.tipo || "POP").toLowerCase();
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


