import codecs
import re

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()

# 1. Add modal control functions and generatePDFForFilial wrapper
modal_funcs = """
function openExportPDFModal() {
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
}
"""

if "function openExportPDFModal" not in text:
    # insert before exportTrainingsToPDF
    text = text.replace("function exportTrainingsToPDF() {", modal_funcs + "\nfunction exportTrainingsToPDF(filialKey = 'MATRIZ') {")


# 2. Modify exportTrainingsToPDF to use the dynamic filial data
# In the original code, the hardcoded values look like:
#         doc.text("Doc:", 185, 19);
#         doc.setFont('helvetica', 'normal');
#         doc.text("MT FM RH 003.ANX1", 195, 19);
#         
#         doc.setFont('helvetica', 'bold');
#         doc.text("Revisão:", 185, 24);
#         doc.setFont('helvetica', 'normal');
#         doc.text("01", 200, 24);
#         
#         doc.setFont('helvetica', 'bold');
#         doc.text("Elaborado em:", 185, 29);
#         doc.setFont('helvetica', 'normal');
#         doc.text("12/11/2025", 210, 29);
#         
#         doc.setFont('helvetica', 'bold');
#         doc.text("Aprovado em:", 185, 34);
#         doc.setFont('helvetica', 'normal');
#         doc.text("17/11/2025", 208, 34);

dynamic_header = """
        const filialPDFData = {
            "MATRIZ": { doc: "MT FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" },
            "SOROCABA": { doc: "SC FM RH 003.ANX3", rev: "01", elaborado: "16/02/2026", aprovado: "17/02/2026" },
            "SÃO ROQUE": { doc: "SR FM RH 003.ANX3", rev: "01", elaborado: "13/11/2024", aprovado: "05/05/2025" },
            "CAMAÇARI": { doc: "CAM FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" },
            "FUNEAS": { doc: "PR FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" },
            "SJP PREFEITURA": { doc: "SJP FM RH 003.ANX1", rev: "01", elaborado: "12/11/2025", aprovado: "17/11/2025" }
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
"""

# Find the block to replace
start_idx = text.find('doc.text("Doc:", 185, 19);')
end_idx = text.find('doc.text("17/11/2025", 208, 34);') + len('doc.text("17/11/2025", 208, 34);')

if start_idx != -1 and end_idx != -1 and "const filialPDFData" not in text:
    text = text[:start_idx] + dynamic_header.strip() + text[end_idx:]

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(text)

print("PDF logic updated in app.js successfully.")
