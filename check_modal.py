import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()
    print('openExportPDFModal in app.js:', 'function openExportPDFModal' in text)
    
with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()
    print('pdf-filial-modal in index.html:', 'id="pdf-filial-modal"' in text)
    print('openExportPDFModal onClick in index.html:', 'openExportPDFModal()' in text)
