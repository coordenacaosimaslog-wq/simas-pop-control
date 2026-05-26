import sys

def patch_app_js():
    with open('app.js', 'r', encoding='utf-8') as f:
        text = f.read()

    # We need to change savePOP and downloadPOP to use Firestore chunking instead of Storage

    # 1. In patch_savepop, we used storage.ref(). We need to replace that.
    start_save = text.find('async function savePOP(event) {')
    end_save = text.find('async function deletePOP(id) {')
    old_save = text[start_save:end_save]

    new_save = """async function savePOP(event) {
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
"""
    text = text.replace(old_save, new_save)

    # 2. Patch downloadPOP
    start_down = text.find('function downloadPOP(id) {')
    end_down = text.find('// ==================== 15. AUDIT TRAIL LOGGING ====================', start_down)
    old_down = text[start_down:end_down]

    new_down = """async function downloadPOP(id) {
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

"""
    text = text.replace(old_down, new_down)

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(text)

patch_app_js()
print("Patched chunking system!")
