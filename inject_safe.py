import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    lines = f.readlines()

def find_line_index(search_str):
    for i, line in enumerate(lines):
        if search_str in line:
            return i
    return -1

# 1. Insert approveBtn declaration
idx1 = find_line_index('let downloadBtn = `<button class="btn-icon" onclick="downloadPOP')
if idx1 != -1:
    lines.insert(idx1 + 1, '''            let approveBtn = "";\n            if (currentUser.isAdmin && pop.status === "AGUARDANDO APROVAÇAO") {\n                approveBtn = `<button class="btn-icon" onclick="approvePOP('${pop.id}')" style="color: #2E7D32; border-color: #BBF7D0;" title="Aprovar/Revisar POP"><i class="fa-solid fa-check-circle"></i></button>`;\n            }\n''')

# 2. Insert approveBtn in HTML (only for renderPopsTable)
# Find renderPopsTable start
idx_render = find_line_index('function renderPopsTable() {')
if idx_render != -1:
    for i in range(idx_render, len(lines)):
        if 'onclick="downloadPOP(' in lines[i] and 'title="Baixar documento"' in lines[i]:
            lines.insert(i, '                        ${approveBtn}\n')
            break

# 3. Modify openCreatePOPModal status default
idx_create = find_line_index('function openCreatePOPModal() {')
if idx_create != -1:
    for i in range(idx_create, len(lines)):
        if 'Array.from(statusSelect.options).forEach(opt => opt.disabled = false);' in lines[i]:
            lines.insert(i + 1, '            if (!currentUser.isAdmin) {\n                statusSelect.value = "AGUARDANDO APROVAÇAO";\n                statusSelect.disabled = true;\n            } else {\n                statusSelect.disabled = false;\n            }\n')
            break

# 4. Modify openEditPOPModal status select
idx_edit = find_line_index('function openEditPOPModal(id) {')
if idx_edit != -1:
    for i in range(idx_edit, len(lines)):
        if 'statusSelect.value = pop.status;' in lines[i]:
            lines.insert(i + 1, '        if (!currentUser.isAdmin) {\n            statusSelect.disabled = true;\n        } else {\n            statusSelect.disabled = false;\n        }\n')
            break

# 5. Modify savePOP status
idx_save = find_line_index('async function savePOP(event) {')
if idx_save != -1:
    for i in range(idx_save, len(lines)):
        if 'const status = document.getElementById("form-pop-status").value;' in lines[i]:
            lines[i] = lines[i].replace('const status', 'let status')
            lines.insert(i + 1, '        if (!currentUser.isAdmin) {\n            status = "AGUARDANDO APROVAÇAO";\n        }\n')
            break
            
# 6. Modify toast message in savePOP
if idx_save != -1:
    for i in range(idx_save, len(lines)):
        if 'salvo na nuvem com sucesso!' in lines[i] and 'showToast' in lines[i]:
            lines[i] = '''        if (!currentUser.isAdmin) {
            showToast(`POP '${codigo}' enviado! Aguardando aprovação do administrador.`, "success");
        } else {
            showToast(`POP '${codigo}' salvo na nuvem com sucesso!`, "success");
        }\n'''
            break

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

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.writelines(lines)
    f.write(approve_func)

print("Injected safely using exact Python parsing!")
