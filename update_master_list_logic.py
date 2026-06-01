import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()

# 1. Update the Modal functions
old_modal_funcs = """function openExportPDFModal() {
    const modal = document.getElementById("pdf-filial-modal");
    if (modal) modal.classList.add("active");
}

function closeExportPDFModal() {
    const modal = document.getElementById("pdf-filial-modal");
    if (modal) modal.classList.remove("active");
}

function generatePDFForFilial() {
    const select = document.getElementById("pdf-filial-select");
    if (select) {
        const filialKey = select.value;
        exportTrainingsToPDF(filialKey);
        closeExportPDFModal();
    }
}"""

new_modal_funcs = """let currentPDFExportType = 'TRAININGS';

function openExportPDFModal(type = 'TRAININGS') {
    currentPDFExportType = type;
    const modal = document.getElementById("pdf-filial-modal");
    if (modal) modal.classList.add("active");
}

function closeExportPDFModal() {
    const modal = document.getElementById("pdf-filial-modal");
    if (modal) modal.classList.remove("active");
}

function generatePDFForFilial() {
    const select = document.getElementById("pdf-filial-select");
    if (select) {
        const filialKey = select.value;
        if (currentPDFExportType === 'MASTER_LIST') {
            exportMasterList(filialKey);
        } else {
            exportTrainingsToPDF(filialKey);
        }
        closeExportPDFModal();
    }
}"""

text = text.replace(old_modal_funcs, new_modal_funcs)

# 2. Update exportMasterList
new_master_list = """function exportMasterList(filialKey = 'MATRIZ') {
    try {
        logAction("Exportação", "-", "Gerou a Lista Mestre Geral de POPs em PDF para a filial " + filialKey);
        
        if (!window.jspdf || !window.jspdf.jsPDF) {
            showToast('Erro: Biblioteca jsPDF não carregada.', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4'); 
        
        // 1. Cabeçalho
        doc.setDrawColor(11, 29, 50); 
        doc.setLineWidth(0.5);
        doc.rect(14, 14, 269, 25); 
        
        // Linha divisória vertical
        doc.line(180, 14, 180, 39);
        
        // Logo Simas
        try {
            const logoParts = simasLogoBase64.split(',');
            const base64Data = logoParts.length > 1 ? logoParts[1] : logoParts[0];
            doc.addImage(base64Data, 'PNG', 20, 17, 50, 18);
        } catch(e) {
            console.error("Erro ao adicionar logo no PDF", e);
        }
        
        // Título Central
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(11, 29, 50);
        doc.text("LISTA MESTRA DE CONTROLE DE POPs", 125, 27, { align: 'center' });
        
        // Caixa de Informações (Direita) - Reaproveitando a estrutura das filiais
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        const filialPDFData = {
            "MATRIZ": { doc: "MT FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" },
            "SOROCABA": { doc: "SC FM RH 003.ANX3", rev: "01", elaborado: "16/02/2026", aprovado: "17/02/2026" },
            "SÃO ROQUE": { doc: "SR FM RH 003.ANX3", rev: "01", elaborado: "13/11/2024", aprovado: "05/05/2025" },
            "CAMAÇARI": { doc: "CAM FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" },
            "FUNEAS": { doc: "PR FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" },
            "SJP PREFEITURA": { doc: "SJP FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" },
            "TIGRE": { doc: "TG FM RH 003.ANX1", rev: "01", elaborado: "-", aprovado: "-" },
            "JUATUBA": { doc: "JB FM RH 003.ANX1", rev: "01", elaborado: "-", aprovado: "-" },
            "GOVERNADOR VALADARES": { doc: "GV FM RH 003.ANX1", rev: "01", elaborado: "-", aprovado: "-" }
        };
        const dataF = filialPDFData[filialKey] || filialPDFData["MATRIZ"];

        doc.text("Doc:", 185, 19);
        doc.setFont('helvetica', 'normal');
        doc.text(dataF.doc, 195, 19);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Revisão:", 185, 24);
        doc.setFont('helvetica', 'normal');
        doc.text(dataF.rev, 200, 24);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Elaborado em:", 185, 29);
        doc.setFont('helvetica', 'normal');
        doc.text(dataF.elaborado, 210, 29);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Aprovado em:", 185, 34);
        doc.setFont('helvetica', 'normal');
        doc.text(dataF.aprovado, 208, 34);
        
        // 2. Tabela de POPs - Filtrada por filial/prefixo
        const prefixMap = {
            "SOROCABA": "SC",
            "CAMAÇARI": "CAM",
            "SÃO ROQUE": "SR",
            "SJP PREFEITURA": "SJP",
            "TIGRE": "TG",
            "JUATUBA": "JB",
            "GOVERNADOR VALADARES": "GV",
            "FUNEAS": "PR",
            "MATRIZ": "MT"
        };
        const prefix = prefixMap[filialKey];
        
        const filteredPops = pops.filter(pop => {
            if (!pop) return false;
            
            // Verifica pela property filial
            let matchesFilial = false;
            if (pop.filial) {
                matchesFilial = pop.filial.toUpperCase() === filialKey.toUpperCase() || 
                                pop.filial.toUpperCase().includes(filialKey.toUpperCase());
            }
            
            // Verifica pelo prefixo do código do POP (Ex: "SC POP RH...")
            let matchesPrefix = false;
            if (pop.codigo && prefix) {
                // Checa se comeca exatamente com a inicial e depois um espaco ou traco
                matchesPrefix = pop.codigo.toUpperCase().startsWith(prefix);
            }
            
            return matchesFilial || matchesPrefix;
        });

        const tableRows = [];
        filteredPops.forEach(pop => {
            tableRows.push([
                pop.codigo || "-",
                pop.titulo || "-",
                pop.filial || "-",
                pop.tipo || "POP",
                pop.area || "-",
                pop.responsavel || "-",
                formatDate(pop.dataRevisao) || "-",
                formatDate(pop.proximaRevisao) || "-",
                pop.status || "-"
            ]);
        });
        
        if (tableRows.length === 0) {
            tableRows.push(["Nenhum documento encontrado para esta filial", "", "", "", "", "", "", "", ""]);
        }
        
        // AutoTable
        doc.autoTable({
            startY: 45,
            head: [['Código', 'Título', 'Filial', 'Tipo', 'Área', 'Responsável', 'Data Revisão', 'Próx. Revisão', 'Status']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [11, 29, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                1: { cellWidth: 50 }
            }
        });
        
        // Salvar Arquivo
        doc.save(`Lista_Mestre_POPs_${filialKey}_${new Date().toISOString().split('T')[0]}.pdf`);
        
        showToast("Lista Mestre em PDF gerada com sucesso.", "success");
    } catch (e) {
        console.error("Erro ao exportar Lista Mestre:", e);
        showToast("Erro ao gerar Lista Mestre. Tente novamente.", "danger");
    }
}
"""

start_idx = text.find("function exportMasterList()")
if start_idx == -1:
    start_idx = text.find("function exportMasterList(filialKey")

end_idx = text.find("async function downloadPOP(id) {")

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_master_list + text[end_idx:]
    with codecs.open('app.js', 'w', 'utf-8') as f:
        f.write(text)
    print("Replaced exportMasterList successfully.")
else:
    print("Could not find function bounds for exportMasterList.")
