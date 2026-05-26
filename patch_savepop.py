import sys
import re

def patch_savepop():
    with open('app.js', 'r', encoding='utf-8') as f:
        text = f.read()
        
    old_save_pop = text[text.find('async function savePOP(event)'):text.find('async function deletePOP(id)')]
    
    # We will just rewrite the whole savePOP
    new_save_pop = """async function savePOP(event) {
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
        
        let fileUrl = null;
        let fileName = null;
        
        if (activeUploadedFile) {
            fileName = activeUploadedFile.name;
            try {
                showToast("Fazendo upload do arquivo para a nuvem...", "info");
                const storageRef = storage.ref().child(`pops/${codigo}_${Date.now()}_${fileName}`);
                await storageRef.putString(activeUploadedFile.data, 'data_url');
                fileUrl = await storageRef.getDownloadURL();
            } catch (err) {
                console.error("Erro no upload:", err);
                showToast("Falha no upload do anexo para a nuvem.", "error");
                return;
            }
        }
        
        const todayStr = new Date().toISOString().split('T')[0];
        let popToSave = null;
        
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
                arquivo: fileName ? fileName : oldPop.arquivo,
                fileUrl: fileUrl ? fileUrl : oldPop.fileUrl,
                historico: [
                    ...oldPop.historico,
                    { data: todayStr, autor: `${currentUser.name} (${currentUser.roleName})`, acao: `Edição de ciclo documental. Status anterior: ${oldStatus} -> Atual: ${status}.` }
                ]
            };
            
            // Delete fileData from object so it doesn't upload a massive string to Firestore
            if (popToSave.fileData) delete popToSave.fileData;
            
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
            const newId = "pop-" + String(maxNum + 1).padStart(3, '0');
            popToSave = {
                id: newId,
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
                arquivo: fileName,
                fileUrl: fileUrl,
                historico: [
                    { data: todayStr, autor: `${currentUser.name} (${currentUser.roleName})`, acao: `Criação documental primária. Status: ${status}.` }
                ]
            };
            
            pops.unshift(popToSave);
            logAction("Criação", codigo, `Criou o POP ${codigo} (${filial}) na Área ${area}.`);
        }
        
        // Save to Firestore
        await db.collection("simas_pops").doc(popToSave.id).set(popToSave);
        
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
    }
}

"""
    text = text.replace(old_save_pop, new_save_pop)

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(text)

patch_savepop()
print("Patched savePOP!")
