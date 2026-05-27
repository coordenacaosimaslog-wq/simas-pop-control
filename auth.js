/**
 * SIMAS LOGÍSTICA LTDA — MÓDULO DE AUTENTICAÇÃO E GESTÃO DE USUÁRIOS
 * auth.js — Sistema completo de login, registro, sessões e painel administrativo
 * Administrador Master: Iara Moreira <rt@simaslog.com.br>
 */

// ============================================================
// CONSTANTES DO SISTEMA DE AUTH
// ============================================================
const AUTH_SALT = 'SIMAS_LOG_SECURE_2026_ANVISA_COMPLIANCE_RT';
const USERS_DB_KEY = 'simas_auth_users_v1';
const SESSION_KEY = 'simas_active_session_v1';
const AUTH_LOGS_KEY = 'simas_auth_logs_v1';
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

let inactivityTimer = null;
let authUsersDB = [];
let activeSessionData = null;

// ============================================================
// HASH DE SENHA (SHA-256 via Web Crypto API)
// ============================================================
async function hashPassword(password) {
    try {
        const msg = password + AUTH_SALT;
        const msgBuffer = new TextEncoder().encode(msg);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        // Fallback simples se crypto não disponível (file://)
        let hash = 0;
        const str = password + AUTH_SALT;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'fb_' + Math.abs(hash).toString(16).padStart(8, '0');
    }
}

// ============================================================
// BANCO DE DADOS DE USUÁRIOS (Firebase)
// ============================================================
let authUsersDB = [];
let authLogsDB = [];
let authUsersLoaded = false;

async function loadAuthUsers() {
    return new Promise((resolve) => {
        try {
            db.collection("simas_users").onSnapshot((snapshot) => {
                authUsersDB = snapshot.docs.map(doc => doc.data());
                authUsersLoaded = true;
                
                const adminPanel = document.getElementById("admin-panel");
                if (adminPanel && adminPanel.classList.contains("active")) {
                    renderAdminUsersList();
                }
                resolve();
            }, (error) => {
                console.error("Erro no onSnapshot do Firebase:", error);
                showToast("Erro ao conectar no servidor. Verifique permissões.", "error");
                resolve();
            });
        } catch (e) {
            console.error("Exceção ao ligar onSnapshot:", e);
            resolve();
        }
    });
}

async function saveUserToCloud(userObj) {
    try {
        await db.collection("simas_users").doc(userObj.id).set(userObj);
    } catch(e) {
        console.error("Erro ao salvar usuário:", e);
    }
}

async function loadAuthLogs() {
    db.collection("simas_auth_logs").orderBy("timestamp", "desc").limit(50).onSnapshot((snapshot) => {
        authLogsDB = snapshot.docs.map(doc => doc.data());
        
        const adminPanel = document.getElementById("admin-panel");
        if (adminPanel && adminPanel.classList.contains("active")) {
            renderAdminAuthLogs();
        }
    });
}

async function addAuthLog(userId, userName, action, detail, ip = 'local') {
    const logEntry = {
        id: 'log-' + Date.now() + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        userId,
        userName,
        action,
        detail,
        ip,
        userAgent: navigator.userAgent.substring(0, 80)
    };
    try {
        await db.collection("simas_auth_logs").doc(logEntry.id).set(logEntry);
    } catch(e) {
        console.error("Erro log:", e);
    }
}

function saveAuthUsers() {
    // Deprecated for global use
}

function saveAuthLog(entry) {
    // Deprecated
}

// INICIALIZAÇÃO DO ADMINISTRADOR MASTER
// ============================================================
async function ensureAdminMaster() {
    const adminEmail = 'rt@simaslog.com.br';
    const existing = authUsersDB.find(u => u.email === adminEmail);
    if (!existing) {
        const passwordHash = await hashPassword('Simaslog@311');
        const adminUser = {
            id: 'usr-admin-master-001',
            name: 'Iara Moreira',
            email: adminEmail,
            passwordHash,
            role: 'admin',
            roleName: 'Administrador Master',
            status: 'ativo',
            filiais: ['all'],
            createdAt: new Date().toISOString(),
            lastLogin: null,
            loginCount: 0,
            loginHistory: [],
            createdBy: 'system',
            permissions: {
                create: true, edit: true, delete: true,
                validate: true, admin: true, viewLogs: true,
                manageUsers: true, viewAllFiliais: true,
                approveRevisions: true, resetPasswords: true,
                exportData: true, uploadDocs: true
            }
        };
        await saveUserToCloud(adminUser);
    }
}

// INICIALIZAÇÃO DO SISTEMA DE AUTH
// ============================================================
async function initAuthSystem() {
    await loadAuthUsers();
    loadAuthLogs();
    await ensureAdminMaster();

    // Verifica sessão ativa no localStorage
    try {
        const storedSession = SafeStorage.getItem(SESSION_KEY);
        if (storedSession) {
            const session = JSON.parse(storedSession);
            if (session.expiresAt > Date.now()) {
                const user = authUsersDB.find(u => u.id === session.userId);
                if (user && user.status === 'ativo') {
                    activeSessionData = session;
                    await completeAuthLogin(user, false);
                    return;
                }
            }
        }
    } catch (e) { /* sem sessão salva */ }

    // Exibe tela de login
    showAuthScreen('login');
}
// ============================================================
// GERENCIADOR DE TELAS DE AUTH
// ============================================================
function showAuthScreen(screen) {
    const screens = ['login-screen', 'register-screen', 'forgot-screen'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(screen === 'login' ? 'login-screen' :
                                           screen === 'register' ? 'register-screen' : 'forgot-screen');
    if (target) target.classList.remove('hidden');

    const mainApp = document.getElementById('main-application');
    if (mainApp) mainApp.style.display = 'none';
}

// ============================================================
// LOGIN AUTENTICADO
// ============================================================
async function handleAuthLogin(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-login-submit-id');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
        showToast('Preencha e-mail e senha para continuar.', 'error');
        return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Autenticando...'; }

    try {
        // Pequeno delay para UX profissional
        await new Promise(r => setTimeout(r, 800));

        const user = authUsersDB.find(u => u.email.toLowerCase() === email);

        if (!user) {
            showToast('Credenciais inválidas. Verifique seu e-mail.', 'error');
            addAuthLog('unknown', email, 'LOGIN_FALHOU', 'E-mail não encontrado no sistema.');
            return;
        }

        if (user.status === 'bloqueado') {
            showToast('Conta bloqueada. Contate o administrador: rt@simaslog.com.br', 'error');
            addAuthLog(user.id, user.name, 'LOGIN_BLOQUEADO', 'Tentativa de acesso em conta bloqueada.');
            return;
        }

        if (user.status === 'pendente') {
            showToast('Conta pendente de ativação pelo administrador.', 'warning');
            return;
        }

        const inputHash = await hashPassword(password);
        if (inputHash !== user.passwordHash) {
            showToast('Senha incorreta. Tente novamente.', 'error');
            addAuthLog(user.id, user.name, 'SENHA_INCORRETA', 'Tentativa com senha inválida.');
            return;
        }

        // Login bem-sucedido
        await completeAuthLogin(user, true);

    } catch (e) {
        showToast('Erro no processo de autenticação.', 'error');
        console.error('Auth error:', e);
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Acessar Sistema'; }
    }
}

async function completeAuthLogin(user, createSession = true) {
    // Atualiza dados do usuário
    const idx = authUsersDB.findIndex(u => u.id === user.id);
    if (idx >= 0) {
        const now = new Date().toISOString();
        authUsersDB[idx].lastLogin = now;
        authUsersDB[idx].loginCount = (authUsersDB[idx].loginCount || 0) + 1;
        if (!authUsersDB[idx].loginHistory) authUsersDB[idx].loginHistory = [];
        authUsersDB[idx].loginHistory.unshift({ timestamp: now, ip: 'local', userAgent: navigator.userAgent.substring(0, 60) });
        authUsersDB[idx].loginHistory = authUsersDB[idx].loginHistory.slice(0, 20);
        saveUserToCloud(authUsersDB[idx]);
    }

    // Cria sessão
    if (createSession) {
        activeSessionData = {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role,
            loginTime: Date.now(),
            expiresAt: Date.now() + INACTIVITY_TIMEOUT_MS,
            token: btoa(user.id + Date.now())
        };
        SafeStorage.setItem(SESSION_KEY, JSON.stringify(activeSessionData));
    }

    // Mapeia para o formato currentUser do sistema existente
    currentUser = {
        name: user.name,
        roleName: user.roleName || getRoleDisplayName(user.role),
        role: user.role === 'admin' ? 'qualidade' : user.role,
        avatar: getAvatarInitials(user.name),
        email: user.email,
        permissions: user.role === 'admin' ? {
            create: true, edit: true, delete: true, validate: true, admin: true
        } : (user.permissions || getDefaultPermissions(user.role)),
        isAdmin: user.role === 'admin',
        userId: user.id
    };

    // Registra log
    addAuthLog(user.id, user.name, 'LOGIN_SUCESSO', `Acesso autenticado — Perfil: ${user.roleName || user.role}`);
    logAction('Login', '-', `Acesso autenticado: ${user.name} (${user.roleName || user.role})`);

    // Inicia timer de inatividade
    resetInactivityTimer();

    // Atualiza UI e mostra o sistema
    updateUserProfileUI();
    applyPermissions();
    updateAdminMenuVisibility();

    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const forgotScreen = document.getElementById('forgot-screen');
    const mainApp = document.getElementById('main-application');

    if (loginScreen) loginScreen.classList.add('hidden');
    if (registerScreen) registerScreen.classList.add('hidden');
    if (forgotScreen) forgotScreen.classList.add('hidden');
    if (mainApp) mainApp.style.display = 'flex';

    switchView('dashboard');
    checkExpirationsAndAlert();
    showToast(`Bem-vindo, ${user.name}! Sessão iniciada com segurança.`, 'success');
}

function getRoleDisplayName(role) {
    const names = {
        admin: 'Administrador Master',
        qualidade: 'Qualidade',
        operacao: 'Operação',
        gestao: 'Gestão',
        visualizacao: 'Consulta'
    };
    return names[role] || 'Usuário';
}

function getAvatarInitials(name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function getDefaultPermissions(role) {
    const defaults = {
        qualidade:    { create: true,  edit: true,  delete: false, validate: true,  admin: false },
        operacao:     { create: true,  edit: true,  delete: false, validate: false, admin: false },
        gestao:       { create: false, edit: true,  delete: false, validate: true,  admin: false },
        visualizacao: { create: false, edit: false, delete: false, validate: false, admin: false }
    };
    return defaults[role] || defaults.visualizacao;
}

// ============================================================
// LOGOUT COM LIMPEZA DE SESSÃO
// ============================================================
function authLogout() {
    try {
        if (currentUser && currentUser.userId) {
            addAuthLog(currentUser.userId, currentUser.name, 'LOGOUT', 'Sessão encerrada pelo usuário.');
        }
        logAction('Logout', '-', `Usuário ${currentUser.name} encerrou a sessão.`);

        SafeStorage.removeItem(SESSION_KEY);
        activeSessionData = null;
        clearInactivityTimer();

        const mainApp = document.getElementById('main-application');
        if (mainApp) mainApp.style.display = 'none';

        showAuthScreen('login');
        showToast('Sessão encerrada com segurança.', 'info');
    } catch (e) {
        console.error('Logout error:', e);
    }
}

// ============================================================
// TIMER DE INATIVIDADE
// ============================================================
function resetInactivityTimer() {
    clearInactivityTimer();
    inactivityTimer = setTimeout(() => {
        showToast('Sessão encerrada por inatividade (30 min).', 'warning');
        setTimeout(() => authLogout(), 2000);
    }, INACTIVITY_TIMEOUT_MS);

    // Atualiza expiração da sessão
    if (activeSessionData) {
        activeSessionData.expiresAt = Date.now() + INACTIVITY_TIMEOUT_MS;
        SafeStorage.setItem(SESSION_KEY, JSON.stringify(activeSessionData));
    }
}

function clearInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
}

// Eventos para reset do timer de inatividade
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, () => {
        if (activeSessionData) resetInactivityTimer();
    }, { passive: true });
});

// ============================================================
// REGISTRO DE NOVO USUÁRIO
// ============================================================
async function handleRegister(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-register-submit');
    const name = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim().toLowerCase();
    const password = document.getElementById('reg-password')?.value;
    const confirm = document.getElementById('reg-confirm')?.value;
    const role = document.getElementById('reg-role')?.value || 'visualizacao';

    if (!name || name.length < 3) { showToast('Nome completo obrigatório (mín. 3 caracteres).', 'error'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('E-mail inválido.', 'error'); return; }
    if (!password || password.length < 8) { showToast('Senha deve ter pelo menos 8 caracteres.', 'error'); return; }
    if (password !== confirm) { showToast('As senhas não conferem.', 'error'); return; }
    if (!validatePasswordStrength(password)) {
        showToast('Senha fraca. Use letras maiúsculas, minúsculas, números e símbolos.', 'warning');
        return;
    }

    loadAuthUsers();
    if (authUsersDB.find(u => u.email.toLowerCase() === email)) {
        showToast('E-mail já cadastrado no sistema.', 'error');
        return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cadastrando...'; }

    try {
        await new Promise(r => setTimeout(r, 700));
        const passwordHash = await hashPassword(password);
        const newUser = {
            id: 'usr-' + Date.now(),
            name,
            email,
            passwordHash,
            role,
            roleName: getRoleDisplayName(role),
            status: 'pendente', // Aguarda aprovação do admin
            filiais: [],
            createdAt: new Date().toISOString(),
            lastLogin: null,
            loginCount: 0,
            loginHistory: [],
            createdBy: 'self-register',
            permissions: getDefaultPermissions(role)
        };

        authUsersDB.push(newUser);
        await saveUserToCloud(newUser);
        addAuthLog(newUser.id, newUser.name, 'CADASTRO', `Novo usuário registrado — Perfil solicitado: ${newUser.roleName}`);

        showToast(`Cadastro realizado! Aguarde ativação pelo administrador.`, 'success');
        setTimeout(() => showAuthScreen('login'), 2000);
    } catch (e) {
        showToast('Erro ao cadastrar. Tente novamente.', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Criar Conta'; }
    }
}

function validatePasswordStrength(password) {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
}

// ============================================================
// RECUPERAÇÃO DE SENHA
// ============================================================
async function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('forgot-email')?.value.trim().toLowerCase();
    const btn = document.getElementById('btn-forgot-submit');

    if (!email) { showToast('Informe o e-mail cadastrado.', 'error'); return; }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...'; }

    await new Promise(r => setTimeout(r, 1000));

    loadAuthUsers();
    const user = authUsersDB.find(u => u.email.toLowerCase() === email);

    if (user) {
        // Gera token de recuperação (simulado)
        const resetToken = btoa(user.id + Date.now()).substring(0, 16);
        addAuthLog(user.id, user.name, 'RESET_SENHA', `Solicitação de recuperação de senha enviada para ${email}`);

        const resetDiv = document.getElementById('forgot-result');
        if (resetDiv) {
            resetDiv.style.display = 'block';
            resetDiv.innerHTML = `
                <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px;margin-top:16px;">
                    <p style="font-weight:700;color:#15803D;font-size:0.9rem;"><i class="fa-solid fa-circle-check"></i> Solicitação recebida!</p>
                    <p style="color:#166534;font-size:0.82rem;margin-top:6px;">Em um sistema com e-mail configurado, um link de redefinição seria enviado para <strong>${email}</strong>.</p>
                    <p style="color:#166534;font-size:0.82rem;margin-top:4px;">Para este sistema local, contate o administrador master: <strong>rt@simaslog.com.br</strong></p>
                </div>`;
        }
    } else {
        // Não revelamos se e-mail existe ou não (segurança)
        const resetDiv = document.getElementById('forgot-result');
        if (resetDiv) {
            resetDiv.style.display = 'block';
            resetDiv.innerHTML = `<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px;margin-top:16px;">
                <p style="font-weight:700;color:#15803D;font-size:0.9rem;"><i class="fa-solid fa-circle-check"></i> Se o e-mail estiver cadastrado, você receberá as instruções em breve.</p>
            </div>`;
        }
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Link'; }
}

// ============================================================
// VISIBILIDADE DO MENU ADMIN NA SIDEBAR
// ============================================================
function updateAdminMenuVisibility() {
    const adminMenuItem = document.getElementById('menu-admin');
    if (adminMenuItem) {
        adminMenuItem.style.display = (currentUser && currentUser.isAdmin) ? 'block' : 'none';
    }
    const headerRoleSwitcher = document.querySelector('.header-role-switcher');
    if (headerRoleSwitcher) {
        headerRoleSwitcher.style.display = (currentUser && currentUser.isAdmin) ? 'flex' : 'none';
    }
}

// ============================================================
// PAINEL ADMINISTRATIVO
// ============================================================
function renderAdminPanel() {
    if (!currentUser || !currentUser.isAdmin) {
        showToast('Acesso restrito ao Administrador Master.', 'error');
        return;
    }

    loadAuthUsers();
    renderAdminUsersList();
    renderAdminStats();
    renderAdminAuthLogs();
}

function renderAdminStats() {
    const totalEl = document.getElementById('admin-stat-total');
    const ativoEl = document.getElementById('admin-stat-ativo');
    const pendenteEl = document.getElementById('admin-stat-pendente');
    const bloqueadoEl = document.getElementById('admin-stat-bloqueado');

    const total = authUsersDB.length;
    const ativos = authUsersDB.filter(u => u.status === 'ativo').length;
    const pendentes = authUsersDB.filter(u => u.status === 'pendente').length;
    const bloqueados = authUsersDB.filter(u => u.status === 'bloqueado').length;

    if (totalEl) totalEl.innerText = total;
    if (ativoEl) ativoEl.innerText = ativos;
    if (pendenteEl) pendenteEl.innerText = pendentes;
    if (bloqueadoEl) bloqueadoEl.innerText = bloqueados;
}

function renderAdminUsersList() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    if (authUsersDB.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary);">Nenhum usuário cadastrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = authUsersDB.map(user => {
        const statusBadge = user.status === 'ativo'
            ? `<span class="status-badge revisado"><i class="fa-solid fa-circle-dot"></i> Ativo</span>`
            : user.status === 'bloqueado'
            ? `<span class="status-badge vencido"><i class="fa-solid fa-ban"></i> Bloqueado</span>`
            : `<span class="status-badge validacao"><i class="fa-solid fa-clock"></i> Pendente</span>`;

        const roleBadge = user.role === 'admin'
            ? `<span style="background:#FCE8E9;color:#9B1520;padding:3px 10px;border-radius:4px;font-size:0.68rem;font-weight:700;font-family:'Montserrat',sans-serif;">ADMIN MASTER</span>`
            : `<span style="background:var(--graphite-50);color:var(--graphite-700);padding:3px 10px;border-radius:4px;font-size:0.68rem;font-weight:700;">${getRoleDisplayName(user.role)}</span>`;

        const lastLogin = user.lastLogin
            ? new Date(user.lastLogin).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
            : 'Nunca';

        const isCurrentAdmin = user.email === 'rt@simaslog.com.br';

        return `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;background:${user.role==='admin'?'var(--brand)':'var(--graphite-200)'};border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.72rem;color:${user.role==='admin'?'white':'var(--graphite-700)'};font-family:'Montserrat',sans-serif;flex-shrink:0;">
                        ${getAvatarInitials(user.name)}
                    </div>
                    <div>
                        <div style="font-weight:700;font-size:0.85rem;color:var(--graphite-900);">${user.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary);">${user.email}</div>
                    </div>
                </div>
            </td>
            <td>${roleBadge}</td>
            <td>${statusBadge}</td>
            <td style="font-size:0.78rem;color:var(--text-secondary);">${lastLogin}</td>
            <td style="font-size:0.78rem;color:var(--text-secondary);text-align:center;">${user.loginCount || 0}</td>
            <td style="font-size:0.78rem;color:var(--text-secondary);">${new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
            <td style="text-align:center;">
                <div class="action-buttons" style="justify-content:center;">
                    ${!isCurrentAdmin ? `<button class="btn-icon" onclick="openEditUserModal('${user.id}')" title="Editar Permissões"><i class="fa-solid fa-user-pen"></i></button>` : ''}
                    ${user.status === 'pendente' ? `<button class="btn-icon" onclick="activateUser('${user.id}')" title="Ativar Usuário" style="color:var(--success);border-color:#BBF7D0;"><i class="fa-solid fa-user-check"></i></button>` : ''}
                    ${user.status === 'ativo' && !isCurrentAdmin ? `<button class="btn-icon delete" onclick="toggleBlockUser('${user.id}', 'bloqueado')" title="Bloquear"><i class="fa-solid fa-user-slash"></i></button>` : ''}
                    ${user.status === 'bloqueado' ? `<button class="btn-icon" onclick="toggleBlockUser('${user.id}', 'ativo')" title="Desbloquear" style="color:var(--success);"><i class="fa-solid fa-lock-open"></i></button>` : ''}
                    ${!isCurrentAdmin ? `<button class="btn-icon delete" onclick="adminResetPassword('${user.id}')" title="Redefinir Senha"><i class="fa-solid fa-key"></i></button>` : ''}
                    ${!isCurrentAdmin ? `<button class="btn-icon delete" onclick="deleteAuthUser('${user.id}')" title="Excluir Usuário"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderAdminAuthLogs() {
    const tbody = document.getElementById('admin-auth-logs-tbody');
    if (!tbody) return;

    const logs = loadAuthLogs().slice(0, 30);

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:var(--text-secondary);">Nenhum log de autenticação registrado.</td></tr>`;
        return;
    }

    const actionColors = {
        'LOGIN_SUCESSO':   { bg: '#DCFCE7', color: '#15803D' },
        'LOGOUT':          { bg: '#F1F5F9', color: '#475569' },
        'LOGIN_FALHOU':    { bg: '#FEE2E2', color: '#991B1B' },
        'SENHA_INCORRETA': { bg: '#FEF3C7', color: '#92400E' },
        'LOGIN_BLOQUEADO': { bg: '#FEE2E2', color: '#991B1B' },
        'CADASTRO':        { bg: '#DBEAFE', color: '#1D4ED8' },
        'RESET_SENHA':     { bg: '#FEF3C7', color: '#92400E' },
        'ATIVAR_USER':     { bg: '#DCFCE7', color: '#15803D' },
        'BLOQUEAR_USER':   { bg: '#FEE2E2', color: '#991B1B' },
        'EDITAR_USER':     { bg: '#DBEAFE', color: '#1D4ED8' },
        'EXCLUIR_USER':    { bg: '#FEE2E2', color: '#991B1B' },
    };

    tbody.innerHTML = logs.map(log => {
        const c = actionColors[log.action] || { bg: '#F1F5F9', color: '#475569' };
        const ts = new Date(log.timestamp).toLocaleString('pt-BR', {
            day:'2-digit', month:'2-digit', year:'numeric',
            hour:'2-digit', minute:'2-digit', second:'2-digit'
        });
        return `
        <tr>
            <td style="font-size:0.77rem;color:var(--text-secondary);white-space:nowrap;">${ts}</td>
            <td style="font-weight:600;font-size:0.82rem;">${log.userName || '-'}</td>
            <td><span style="background:${c.bg};color:${c.color};padding:3px 8px;border-radius:4px;font-size:0.67rem;font-weight:700;font-family:'Montserrat',sans-serif;white-space:nowrap;">${log.action}</span></td>
            <td style="font-size:0.78rem;color:var(--text-secondary);">${log.detail}</td>
            <td style="font-size:0.75rem;color:var(--text-muted);">${log.ip || 'local'}</td>
        </tr>`;
    }).join('');
}

// ============================================================
// AÇÕES DO PAINEL ADMIN
// ============================================================
function activateUser(userId) {
    loadAuthUsers();
    const idx = authUsersDB.findIndex(u => u.id === userId);
    if (idx < 0) return;

    authUsersDB[idx].status = 'ativo';
    saveUserToCloud(authUsersDB[idx]);
    addAuthLog(currentUser.userId, currentUser.name, 'ATIVAR_USER', `Usuário ${authUsersDB[idx].name} ativado.`);
    showToast(`Usuário ${authUsersDB[idx].name} ativado com sucesso!`, 'success');
    renderAdminPanel();
}

function toggleBlockUser(userId, newStatus) {
    loadAuthUsers();
    const idx = authUsersDB.findIndex(u => u.id === userId);
    if (idx < 0) return;

    authUsersDB[idx].status = newStatus;
    saveUserToCloud(authUsersDB[idx]);
    const action = newStatus === 'bloqueado' ? 'BLOQUEAR_USER' : 'DESBLOQUEAR_USER';
    addAuthLog(currentUser.userId, currentUser.name, action, `Status de ${authUsersDB[idx].name} alterado para ${newStatus}.`);
    showToast(`Usuário ${newStatus === 'bloqueado' ? 'bloqueado' : 'desbloqueado'} com sucesso.`, newStatus === 'bloqueado' ? 'warning' : 'success');
    renderAdminPanel();
}

function deleteAuthUser(userId) {
    loadAuthUsers();
    const user = authUsersDB.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`ATENÇÃO: Excluir permanentemente o usuário "${user.name}"?\nEsta ação não pode ser desfeita.`)) return;

    authUsersDB = authUsersDB.filter(u => u.id !== userId);
    db.collection("simas_users").doc(userId).delete().catch(console.error);
    addAuthLog(currentUser.userId, currentUser.name, 'EXCLUIR_USER', `Usuário ${user.name} (${user.email}) excluído definitivamente.`);
    showToast(`Usuário ${user.name} removido do sistema.`, 'success');
    renderAdminPanel();
}

function adminResetPassword(userId) {
    loadAuthUsers();
    const user = authUsersDB.find(u => u.id === userId);
    if (!user) return;

    const newPass = prompt(`Definir nova senha para "${user.name}":\n(Mín. 8 caracteres, letras maiúsculas, minúsculas e números)`, '');
    if (!newPass) return;
    if (newPass.length < 8) { showToast('Senha muito curta (mín. 8 caracteres).', 'error'); return; }

    hashPassword(newPass).then(hash => {
        const idx = authUsersDB.findIndex(u => u.id === userId);
        if (idx >= 0) {
            authUsersDB[idx].passwordHash = hash;
            saveUserToCloud(authUsersDB[idx]);
            addAuthLog(currentUser.userId, currentUser.name, 'RESET_SENHA', `Senha de ${user.name} redefinida pelo administrador.`);
            showToast(`Senha de ${user.name} atualizada com sucesso.`, 'success');
        }
    });
}

function openEditUserModal(userId) {
    loadAuthUsers();
    const user = authUsersDB.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-name-disp').innerText = user.name;
    document.getElementById('edit-user-email-disp').innerText = user.email;
    document.getElementById('edit-user-role').value = user.role;
    document.getElementById('edit-user-status').value = user.status;
    document.getElementById('edit-user-filiais').value = (user.filiais || []).join(', ');

    // Permissões
    const perms = user.permissions || getDefaultPermissions(user.role);
    ['create','edit','delete','validate','viewLogs','manageUsers'].forEach(p => {
        const el = document.getElementById(`perm-${p}`);
        if (el) el.checked = !!perms[p];
    });

    document.getElementById('edit-user-modal').classList.add('active');
}

function closeEditUserModal() {
    document.getElementById('edit-user-modal').classList.remove('active');
}

function saveEditUser(event) {
    event.preventDefault();
    loadAuthUsers();
    const userId = document.getElementById('edit-user-id').value;
    const idx = authUsersDB.findIndex(u => u.id === userId);
    if (idx < 0) return;

    const newRole = document.getElementById('edit-user-role').value;
    const newStatus = document.getElementById('edit-user-status').value;
    const filiaisStr = document.getElementById('edit-user-filiais').value;
    const filiais = filiaisStr ? filiaisStr.split(',').map(f => f.trim()).filter(Boolean) : [];

    const permissions = {};
    ['create','edit','delete','validate','viewLogs','manageUsers'].forEach(p => {
        const el = document.getElementById(`perm-${p}`);
        permissions[p] = el ? el.checked : false;
    });

    authUsersDB[idx].role = newRole;
    authUsersDB[idx].roleName = getRoleDisplayName(newRole);
    authUsersDB[idx].status = newStatus;
    authUsersDB[idx].filiais = filiais;
    authUsersDB[idx].permissions = permissions;

    saveUserToCloud(authUsersDB[idx]);
    addAuthLog(currentUser.userId, currentUser.name, 'EDITAR_USER',
        `Permissões de ${authUsersDB[idx].name} editadas. Novo papel: ${getRoleDisplayName(newRole)}`);

    closeEditUserModal();
    showToast(`Usuário ${authUsersDB[idx].name} atualizado com sucesso.`, 'success');
    renderAdminPanel();
}

function adminSearchUsers(value) {
    const rows = document.querySelectorAll('#admin-users-tbody tr');
    const term = value.toLowerCase();
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
}

function filterAdminUsersByStatus(status) {
    loadAuthUsers();
    renderAdminUsersList();

    if (!status) return;
    const rows = document.querySelectorAll('#admin-users-tbody tr');
    rows.forEach(row => {
        if (!row.textContent.toLowerCase().includes(status)) {
            row.style.display = 'none';
        }
    });
}

// ============================================================
// SWITCH VIEW — EXTENSÃO PARA ADMIN
// ============================================================
const _originalSwitchView = typeof switchView === 'function' ? switchView : null;

function switchViewExtended(viewId) {
    if (viewId === 'admin') {
        if (!currentUser || !currentUser.isAdmin) {
            showToast('Acesso negado.', 'error');
            return;
        }
        activeView = 'admin';
        const menuItems = document.querySelectorAll('.sidebar-item');
        menuItems.forEach(item => item.classList.remove('active'));
        const adminMenu = document.getElementById('menu-admin');
        if (adminMenu) adminMenu.classList.add('active');

        const views = document.querySelectorAll('.spa-view');
        views.forEach(v => v.classList.remove('active'));
        const adminView = document.getElementById('view-admin');
        if (adminView) adminView.classList.add('active');

        const title = document.getElementById('header-current-view-title');
        const desc = document.getElementById('header-current-view-desc');
        if (title) title.innerText = 'Painel Administrativo';
        if (desc) desc.innerText = 'Gestão de usuários, permissões, acessos e logs de segurança';

        renderAdminPanel();
    } else {
        if (_originalSwitchView) _originalSwitchView(viewId);
    }
}

// Sobrescreve switchView globalmente
window.switchView = switchViewExtended;

// ============================================================
// SUBSTITUIÇÃO DAS FUNÇÕES ORIGINAIS DE LOGIN/LOGOUT
// ============================================================
window.handleFormLogin = handleAuthLogin;
window.logout = authLogout;

// Desabilita o seletor de perfil no header para usuários normais (o admin ainda pode usar para simular)
window.changeActiveRole = function(roleKey) {
    if (!currentUser || !currentUser.isAdmin) return;
    if (CORPORATE_USERS[roleKey]) {
        currentUser = { ...CORPORATE_USERS[roleKey], isAdmin: false };
        updateUserProfileUI();
        applyPermissions();
        updateAdminMenuVisibility();
        logAction('Simulação', '-', `Admin simulou perfil: ${CORPORATE_USERS[roleKey].roleName}`);
        showToast(`Simulando perfil: ${CORPORATE_USERS[roleKey].roleName}`, 'info');
        if (activeView === 'pops') renderPopsTable();
    }
};

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay para o sistema principal inicializar primeiro
    setTimeout(() => {
        initAuthSystem().catch(e => console.error('Auth init error:', e));
    }, 100);
});
