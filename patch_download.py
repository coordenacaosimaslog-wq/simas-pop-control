import sys

def patch_download():
    with open('app.js', 'r', encoding='utf-8') as f:
        text = f.read()

    start_idx = text.find('function downloadPOP(id)')
    end_idx = text.find('// ==================== 15. AUDIT TRAIL LOGGING ====================', start_idx)

    old_func = text[start_idx:end_idx]

    new_func = """function downloadPOP(id) {
    try {
        const pop = pops.find(p => p.id === id);
        if (!pop) return;
        
        showToast(`Iniciando download seguro: ${pop.arquivo || 'documento_simas'}...`, "info");
        
        setTimeout(() => {
            if (pop.fileUrl) {
                window.open(pop.fileUrl, '_blank');
            } else if (pop.fileData) {
                const link = document.createElement("a");
                link.setAttribute("href", pop.fileData);
                link.setAttribute("download", pop.arquivo || `${pop.codigo}_documento`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                showToast("Erro: Este POP não possui um arquivo anexado.", "error");
            }
            
            logAction("Download", pop.codigo, `Realizou o download do documento corporativo ${pop.codigo}.`);
        }, 1500);
    } catch (e) {
        console.error("Erro ao baixar POP:", e);
    }
}

"""

    text = text.replace(old_func, new_func)

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(text)

patch_download()
print("Patched downloadPOP!")
