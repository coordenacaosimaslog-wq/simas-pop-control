import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

modal_html = """
    <!-- Modal Exportar PDF por Filial -->
    <div class="modal" id="pdf-filial-modal">
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-file-pdf"></i> Gerar PDF do Cronograma</h3>
                <button class="btn-close" onclick="closeExportPDFModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label style="margin-bottom: 8px; display: block; font-weight: 500;">Selecione a Filial para o cabeçalho:</label>
                    <select id="pdf-filial-select" class="form-control">
                        <option value="MATRIZ">MATRIZ</option>
                        <option value="SOROCABA">SOROCABA</option>
                        <option value="SÃO ROQUE">SÃO ROQUE</option>
                        <option value="CAMAÇARI">CAMAÇARI</option>
                        <option value="FUNEAS">FUNEAS</option>
                        <option value="SJP PREFEITURA">SJP PREFEITURA</option>
                    </select>
                </div>
                <div class="form-actions" style="margin-top: 20px;">
                    <button class="btn-primary" onclick="generatePDFForFilial()" style="width: 100%;"><i class="fa-solid fa-download"></i> Gerar PDF</button>
                </div>
            </div>
        </div>
    </div>
"""

if 'id="pdf-filial-modal"' not in text:
    text = text.replace('<script src="firebase-config.js">', modal_html + '\n    <script src="firebase-config.js">')
    with codecs.open('index.html', 'w', 'utf-8') as f:
        f.write(text)
    print("Modal injected into index.html successfully.")
else:
    print("Modal already in index.html")
