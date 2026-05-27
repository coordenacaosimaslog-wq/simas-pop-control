import sys

def patch_auth_js():
    with open('auth.js', 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Replace loadAuthUsers and saveAuthUsers and DB arrays
    start_db = text.find('// BANCO DE DADOS DE USUÁRIOS')
    end_db = text.find('// INICIALIZAÇÃO DO ADMINISTRADOR MASTER')
    
    old_db_block = text[start_db:end_db]
    
    new_db_block = """// BANCO DE DADOS DE USUÁRIOS (Firebase)
// ============================================================
let authUsersDB = [];
let authLogsDB = [];
let authUsersLoaded = false;

async function loadAuthUsers() {
    return new Promise((resolve) => {
        db.collection("simas_users").onSnapshot((snapshot) => {
            authUsersDB = snapshot.docs.map(doc => doc.data());
            authUsersLoaded = true;
            
            const adminPanel = document.getElementById("admin-panel");
            if (adminPanel && adminPanel.classList.contains("active")) {
                renderAdminUsersList();
            }
            resolve();
        });
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

"""
    text = text.replace(old_db_block, new_db_block)
    
    # 2. Patch ensureAdminMaster
    old_admin = text[text.find('async function ensureAdminMaster()'):text.find('// INICIALIZAÇÃO DO SISTEMA DE AUTH')]
    new_admin = """async function ensureAdminMaster() {
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

"""
    text = text.replace(old_admin, new_admin)

    # 3. Patch initAuthSystem
    old_init = text[text.find('async function initAuthSystem() {'):text.find('// ============================================================', text.find('async function initAuthSystem() {'))]
    new_init = """async function initAuthSystem() {
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
"""
    text = text.replace(old_init, new_init)

    # 4. In completeAuthLogin, replace saveAuthUsers() with await saveUserToCloud(authUsersDB[idx])
    text = text.replace('saveAuthUsers();', 'saveUserToCloud(authUsersDB[idx]);')
    
    # 5. In handleRegister, change saveAuthUsers()
    # Need to be careful because index is not `idx` here
    # `authUsersDB.push(newUser); saveAuthUsers();` -> `await saveUserToCloud(newUser);`
    text = text.replace('authUsersDB.push(newUser);\n        saveAuthUsers();', 'await saveUserToCloud(newUser);')
    text = text.replace('authUsersDB.push(newUser);\r\n        saveAuthUsers();', 'await saveUserToCloud(newUser);')

    # 6. In activateUser, toggleBlockUser, adminResetPassword, saveEditUser, replace saveAuthUsers
    text = text.replace('authUsersDB[idx].status = \'ativo\';\n        saveAuthUsers();', 'authUsersDB[idx].status = \'ativo\';\n        await saveUserToCloud(authUsersDB[idx]);')
    text = text.replace('authUsersDB[idx].status = \'ativo\';\r\n        saveAuthUsers();', 'authUsersDB[idx].status = \'ativo\';\n        await saveUserToCloud(authUsersDB[idx]);')
    
    text = text.replace('authUsersDB[idx].status = newStatus;\n        saveAuthUsers();', 'authUsersDB[idx].status = newStatus;\n        await saveUserToCloud(authUsersDB[idx]);')
    text = text.replace('authUsersDB[idx].status = newStatus;\r\n        saveAuthUsers();', 'authUsersDB[idx].status = newStatus;\n        await saveUserToCloud(authUsersDB[idx]);')
    
    text = text.replace('authUsersDB[idx].passwordHash = await hashPassword(defaultPass);\n            saveAuthUsers();', 'authUsersDB[idx].passwordHash = await hashPassword(defaultPass);\n            await saveUserToCloud(authUsersDB[idx]);')
    text = text.replace('authUsersDB[idx].passwordHash = await hashPassword(defaultPass);\r\n            saveAuthUsers();', 'authUsersDB[idx].passwordHash = await hashPassword(defaultPass);\n            await saveUserToCloud(authUsersDB[idx]);')
    
    # In saveEditUser, we update authUsersDB[idx] properties then saveAuthUsers(). 
    # Just replace saveAuthUsers with await saveUserToCloud(authUsersDB[idx]) since we already did that replacement.
    
    # 7. In deleteAuthUser, authUsersDB.splice(idx, 1); saveAuthUsers();
    # -> await db.collection('simas_users').doc(userId).delete();
    text = text.replace('authUsersDB.splice(idx, 1);\n        saveAuthUsers();', 'await db.collection("simas_users").doc(userId).delete();')
    text = text.replace('authUsersDB.splice(idx, 1);\r\n        saveAuthUsers();', 'await db.collection("simas_users").doc(userId).delete();')
    
    # 8. loadAuthLogs and renderAdminAuthLogs uses local arrays, we changed loadAuthLogs to set authLogsDB via onSnapshot.
    # In renderAdminAuthLogs, `const logs = loadAuthLogs();` -> `const logs = authLogsDB;`
    text = text.replace('const logs = loadAuthLogs();', 'const logs = authLogsDB;')

    with open('auth.js', 'w', encoding='utf-8') as f:
        f.write(text)

patch_auth_js()
print("Patched auth.js for Firebase!")
