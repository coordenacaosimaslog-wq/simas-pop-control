import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()

# 1. Modify openCreatePOPModal status default
t1 = '''        const statusSelect = document.getElementById("form-pop-status");
        if (statusSelect) {
            Array.from(statusSelect.options).forEach(opt => opt.disabled = false);
        }'''
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

# 2. Modify openEditPOPModal status select
t2 = '''        const statusSelect = document.getElementById("form-pop-status");
        statusSelect.value = pop.status;'''
r2 = '''        const statusSelect = document.getElementById("form-pop-status");
        statusSelect.value = pop.status;
        if (!currentUser.isAdmin) {
            statusSelect.disabled = true;
        } else {
            statusSelect.disabled = false;
        }'''

# 3. Modify savePOP status
t3 = '''        const status = document.getElementById("form-pop-status").value;'''
r3 = '''        let status = document.getElementById("form-pop-status").value;
        if (!currentUser.isAdmin) {
            status = "AGUARDANDO APROVAÇAO";
        }'''

# 4. Modify toast message in savePOP
t4 = '''        showToast(`POP '${codigo}' salvo na nuvem com sucesso!`, "success");'''
r4 = '''        if (!currentUser.isAdmin) {
            showToast(`POP '${codigo}' enviado! Aguardando aprovação do administrador.`, "success");
        } else {
            showToast(`POP '${codigo}' salvo na nuvem com sucesso!`, "success");
        }'''

# 5. Insert approveBtn logic in renderPopsTable
t5 = '''            let deleteBtn = `<button class="btn-icon delete" onclick="deletePOP('${pop.id}')" title="Excluir POP"><i class="fa-solid fa-trash"></i></button>`;
            let downloadBtn = `<button class="btn-icon" onclick="downloadPOP('${pop.id}')" style="color: var(--brand);" title="Baixar Arquivo"><i class="fa-solid fa-download"></i></button>`;'''
r5 = '''            let deleteBtn = `<button class="btn-icon delete" onclick="deletePOP('${pop.id}')" title="Excluir POP"><i class="fa-solid fa-trash"></i></button>`;
            let downloadBtn = `<button class="btn-icon" onclick="downloadPOP('${pop.id}')" style="color: var(--brand);" title="Baixar Arquivo"><i class="fa-solid fa-download"></i></button>`;
            let approveBtn = "";
            if (currentUser.isAdmin && pop.status === "AGUARDANDO APROVAÇAO") {
                approveBtn = `<button class="btn-icon" onclick="approvePOP('${pop.id}')" style="color: #2E7D32; border-color: #BBF7D0;" title="Aprovar/Revisar POP"><i class="fa-solid fa-check-circle"></i></button>`;
            }'''

# 6. Insert approveBtn in the HTML action buttons
t6 = '''                        <button class="btn-icon" onclick="downloadPOP('${pop.id}')" title="Baixar documento"><i class="fa-solid fa-download"></i></button>
                        <button class="btn-icon" onclick="openDetailsModal('${pop.id}')" title="Visualizar informações"><i class="fa-solid fa-circle-info"></i></button>'''
r6 = '''                        ${approveBtn}
                        <button class="btn-icon" onclick="downloadPOP('${pop.id}')" title="Baixar documento"><i class="fa-solid fa-download"></i></button>
                        <button class="btn-icon" onclick="openDetailsModal('${pop.id}')" title="Visualizar informações"><i class="fa-solid fa-circle-info"></i></button>'''

approve_func = '''
// ============================================================
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

# Standardize line endings just in case
text = text.replace('\\r\\n', '\\n')

for (t, r) in [(t1, r1), (t2, r2), (t3, r3), (t4, r4), (t5, r5), (t6, r6)]:
    text = text.replace(t.replace('\\r\\n', '\\n'), r.replace('\\r\\n', '\\n'))

text += approve_func

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(text)

print("Injected approval logic successfully!")
