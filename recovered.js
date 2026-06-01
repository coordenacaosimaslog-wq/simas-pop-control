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