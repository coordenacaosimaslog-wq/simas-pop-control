import codecs

r1 = '''        const statusSelect = document.getElementById("form-pop-status");
        if (statusSelect) {
            Array.from(statusSelect.options).forEach(opt => opt.disabled = false);
            if (!currentUser.isAdmin) {
                statusSelect.value = "AGUARDANDO APROVAÇAO";
                statusSelect.disabled = true;
            } else {
                statusSelect.disabled = false;
            }
        }'''
t1 = '''        const statusSelect = document.getElementById("form-pop-status");
        if (statusSelect) {
            Array.from(statusSelect.options).forEach(opt => opt.disabled = false);
        }'''

r2 = '''        const statusSelect = document.getElementById("form-pop-status");
        statusSelect.value = pop.status;
        if (!currentUser.isAdmin) {
            statusSelect.disabled = true;
        } else {
            statusSelect.disabled = false;
        }'''
t2 = '''        const statusSelect = document.getElementById("form-pop-status");
        statusSelect.value = pop.status;'''

r3 = '''        let status = document.getElementById("form-pop-status").value;
        if (!currentUser.isAdmin) {
            status = "AGUARDANDO APROVAÇAO";
        }'''
t3 = '''        const status = document.getElementById("form-pop-status").value;'''

r4 = '''        if (!currentUser.isAdmin) {
            showToast(`POP '${codigo}' enviado! Aguardando aprovação do administrador.`, "success");
        } else {
            showToast(`POP '${codigo}' salvo na nuvem com sucesso!`, "success");
        }'''
t4 = '''        showToast(`POP '${codigo}' salvo na nuvem com sucesso!`, "success");'''

with codecs.open('app.js', 'r', 'utf-8', errors='replace') as f:
    content = f.read()

content = content.replace(r1, t1)
content = content.replace(r2, t2)
content = content.replace(r3, t3)
content = content.replace(r4, t4)

# Remove approvePOP function
approve_func = '''// ============================================================
// SISTEMA DE APROVACAO DE POPs
// ============================================================
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
'''
content = content.replace(approve_func, '')

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(content)
print("app.js reverted!")
