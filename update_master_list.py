import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()

new_func = """function exportMasterList() {
    try {
        logAction("Exportação", "-", "Gerou a Lista Mestre Geral de todos os POPs em PDF.");
        
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
        doc.text("LISTA MESTRA DE CONTROLE DE POPs", 145, 28, { align: 'center' });
        
        // 2. Tabela de POPs
        const tableRows = [];
        pops.forEach(pop => {
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
        doc.save(`Lista_Mestre_POPs_Simas_${new Date().toISOString().split('T')[0]}.pdf`);
        
        showToast("Lista Mestre em PDF gerada com sucesso.", "success");
    } catch (e) {
        console.error("Erro ao exportar Lista Mestre:", e);
        showToast("Erro ao gerar Lista Mestre. Tente novamente.", "danger");
    }
}
"""

start_idx = text.find("function exportMasterList() {")
end_idx = text.find("async function downloadPOP(id) {")

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_func + text[end_idx:]
    with codecs.open('app.js', 'w', 'utf-8') as f:
        f.write(text)
    print("Replaced exportMasterList successfully.")
else:
    print("Could not find function bounds.")
