import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    content = f.read()

# 1. Modify openCreatePOPModal
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
content = content.replace(t1, r1)

# 2. Modify openEditPOPModal
t2 = '        document.getElementById("form-pop-status").value = pop.status;'
r2 = '''        const statusSelect = document.getElementById("form-pop-status");
        statusSelect.value = pop.status;
        if (!currentUser.isAdmin) {
            statusSelect.disabled = true;
        } else {
            statusSelect.disabled = false;
        }'''
content = content.replace(t2, r2)

# 3. Modify savePOP status grabbing
t3 = '        const status = document.getElementById("form-pop-status").value;'
r3 = '''        let status = document.getElementById("form-pop-status").value;
        if (!currentUser.isAdmin) {
            status = "AGUARDANDO APROVAÇAO";
        }'''
content = content.replace(t3, r3)

# 4. Modify toast in savePOP
t4 = '        showToast(`POP \'${codigo}\' salvo na nuvem com sucesso!`, "success");'
r4 = '''        if (!currentUser.isAdmin) {
            showToast(`POP '${codigo}' enviado! Aguardando aprovação do administrador.`, "success");
        } else {
            showToast(`POP '${codigo}' salvo na nuvem com sucesso!`, "success");
        }'''
content = content.replace(t4, r4)

# 5. Add approveBtn
t5 = '''            let deleteBtn = `<button class="btn-icon delete" onclick="deletePOP('${pop.id}')" title="Excluir POP"><i class="fa-solid fa-trash"></i></button>`;
            let downloadBtn = `<button class="btn-icon" onclick="downloadPOP('${pop.id}')" style="color: var(--brand);" title="Baixar Arquivo"><i class="fa-solid fa-download"></i></button>`;'''

r5 = '''            let deleteBtn = `<button class="btn-icon delete" onclick="deletePOP('${pop.id}')" title="Excluir POP"><i class="fa-solid fa-trash"></i></button>`;
            let downloadBtn = `<button class="btn-icon" onclick="downloadPOP('${pop.id}')" style="color: var(--brand);" title="Baixar Arquivo"><i class="fa-solid fa-download"></i></button>`;
            
            let approveBtn = "";
            if (currentUser.isAdmin && pop.status === "AGUARDANDO APROVAÇAO") {
                approveBtn = `<button class="btn-icon" onclick="approvePOP('${pop.id}')" style="color: #2E7D32; border-color: #BBF7D0;" title="Aprovar/Revisar POP"><i class="fa-solid fa-check-circle"></i></button>`;
            }'''
content = content.replace(t5, r5)

# 6. Add approveBtn to DOM
t6 = '''                        <button class="btn-icon" onclick="openViewerModal('${pop.id}')" title="Visualizar POP"><i class="fa-solid fa-eye"></i></button>
                        ${editBtn}
                        ${deleteBtn}
                    </div>'''
r6 = '''                        <button class="btn-icon" onclick="openViewerModal('${pop.id}')" title="Visualizar POP"><i class="fa-solid fa-eye"></i></button>
                        ${approveBtn}
                        ${editBtn}
                        ${deleteBtn}
                    </div>'''
content = content.replace(t6, r6)

# 7. Define approvePOP at the end of the file
new_func = '''
// ============================================================
// SISTEMA DE APROVACAO DE POPs
// ============================================================
async function approvePOP(id) {
    if (!currentUser.isAdmin) {
        showToast("Acesso negado: Apenas administradores podem aprovar.", "error");
        return;
    }
    
    const index = pops.findIndex(p => p.id === id);
    if (index === -1) return;
    
    if (!confirm(`Confirmar a aprovação/revisão do POP ${pops[index].codigo}? O status será alterado para REVISADO.`)) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    pops[index].status = "REVISADO";
    pops[index].historico.push({
        data: todayStr,
        autor: `${currentUser.name} (${currentUser.roleName})`,
        acao: `Documento aprovado e marcado como REVISADO pelo administrador.`
    });
    
    try {
        if (typeof db !== 'undefined') {
            await db.collection("simas_pops").doc(id).set(pops[index]);
            logAction("Aprovou POP", pops[index].codigo, "Documento alterado para status REVISADO.");
            showToast("Documento aprovado e revisado com sucesso!", "success");
            renderPopsTable();
            renderDashboardStats();
            updateDashboardCharts();
        }
    } catch (e) {
        console.error("Erro ao aprovar:", e);
        showToast("Erro ao aprovar documento na nuvem.", "error");
    }
}
'''
if 'async function approvePOP' not in content:
    content += new_func

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(content)

print("Modificacoes aplicadas com sucesso.")
