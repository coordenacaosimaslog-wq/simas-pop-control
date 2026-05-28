import os

training_js = """
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
                const tema = (t.tema || "").toLowerCase();
                const trilha = (t.trilha || "").toLowerCase();
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
        } else {
            trainingObj.id = 'train-' + Date.now();
            trainingObj.createdAt = new Date().toISOString();
        }
        
        if (typeof db !== 'undefined') {
            await db.collection("simas_trainings").doc(trainingObj.id).set(trainingObj);
            showToast("Treinamento salvo com sucesso!", "success");
            logAction("Treinamento", trainingObj.tema, `Agendou/Editou o treinamento: ${trainingObj.tema}`);
        } else {
            showToast("Modo Offline: Não é possível salvar na nuvem agora.", "warning");
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
        if (typeof db !== 'undefined') {
            await db.collection("simas_trainings").doc(id).delete();
            showToast("Treinamento excluído com sucesso.", "success");
        }
    } catch (e) {
        console.error("Erro ao excluir treinamento:", e);
        showToast("Erro ao excluir treinamento.", "error");
    }
}
"""

with open('app.js', 'a', encoding='utf-8') as f:
    f.write(training_js)
