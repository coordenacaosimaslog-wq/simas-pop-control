import codecs

# Read base64 logo
with open('logo_b64.txt', 'r') as f:
    logo_b64_js = f.read()

# PDF Export Function JS Code
pdf_func = f"""

// ==========================================
// EXPORTAÇÃO DE CRONOGRAMA PARA PDF
// ==========================================
{logo_b64_js}

function exportTrainingsToPDF() {{
    try {{
        if (!window.jspdf || !window.jspdf.jsPDF) {{
            showToast('Erro: Biblioteca jsPDF não carregada.', 'error');
            return;
        }}
        
        const {{ jsPDF }} = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4'); // Paisagem para caber a tabela melhor
        
        // 1. Cabeçalho
        // Desenha borda do cabeçalho
        doc.setDrawColor(11, 29, 50); // #0B1D32
        doc.setLineWidth(0.5);
        doc.rect(14, 14, 269, 25); // x, y, w, h
        
        // Linha divisória vertical
        doc.line(180, 14, 180, 39);
        
        // Logo Simas
        try {{
            const logoParts = simasLogoBase64.split(',');
            const base64Data = logoParts.length > 1 ? logoParts[1] : logoParts[0];
            // imageType, x, y, width, height
            doc.addImage(base64Data, 'PNG', 20, 17, 50, 18);
        }} catch(e) {{
            console.error("Erro ao adicionar logo no PDF", e);
        }}
        
        // Título Central
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(11, 29, 50);
        doc.text("CRONOGRAMA DE TREINAMENTOS", 125, 27, {{ align: 'center' }});
        
        // Caixa de Informações (Direita)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        doc.text("Doc:", 185, 19);
        doc.setFont('helvetica', 'normal');
        doc.text("MT FM RH 003.ANX1", 195, 19);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Revisão:", 185, 24);
        doc.setFont('helvetica', 'normal');
        doc.text("01", 200, 24);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Elaborado em:", 185, 29);
        doc.setFont('helvetica', 'normal');
        doc.text("12/11/2025", 210, 29);
        
        doc.setFont('helvetica', 'bold');
        doc.text("Aprovado em:", 185, 34);
        doc.setFont('helvetica', 'normal');
        doc.text("17/11/2025", 208, 34);
        
        // 2. Tabela de Treinamentos
        // Preparando os dados
        const tableData = window.filteredTrainings && window.filteredTrainings.length > 0 
                          ? window.filteredTrainings 
                          : trainingsDB;
                          
        const tableRows = [];
        tableData.forEach(t => {{
            let statusName = "Previsto";
            if (t.status === 'realizado') statusName = "Realizado";
            if (t.status === 'atrasado') statusName = "Atrasado";
            if (t.status === 'cancelado') statusName = "Cancelado";
            
            tableRows.push([
                t.tema || '-',
                t.trilha || '-',
                t.tipo || '-',
                t.modalidade || '-',
                t.mes || '-',
                t.data_prevista ? formatDate(t.data_prevista) : '-',
                statusName
            ]);
        }});
        
        // AutoTable
        doc.autoTable({{
            startY: 45,
            head: [['Tema do Treinamento', 'Trilha', 'Tipo', 'Modalidade', 'Mês', 'Data Prevista', 'Status']],
            body: tableRows,
            theme: 'grid',
            headStyles: {{ fillColor: [11, 29, 50], textColor: [255, 255, 255], fontStyle: 'bold' }},
            styles: {{ fontSize: 9, cellPadding: 3 }},
            alternateRowStyles: {{ fillColor: [248, 250, 252] }}
        }});
        
        // Salvar Arquivo
        doc.save('Cronograma_Treinamentos_Simas.pdf');
        
        showToast('Cronograma em PDF gerado com sucesso!', 'success');
        
    }} catch (error) {{
        console.error("Erro ao gerar PDF:", error);
        showToast('Erro ao gerar o PDF. Verifique o console.', 'error');
    }}
}}
"""

with codecs.open('app.js', 'a', 'utf-8') as f:
    f.write(pdf_func)
    
print("app.js updated successfully")
