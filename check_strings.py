import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

print("openExportPDFModal in index.html:", "openExportPDFModal" in text)
print("exportTrainingsToPDF in index.html:", "exportTrainingsToPDF" in text)
print("id='pdf-filial-modal' in index.html:", "pdf-filial-modal" in text)

with codecs.open('app.js', 'r', 'utf-8') as f:
    app_text = f.read()
    
print("openExportPDFModal in app.js:", "function openExportPDFModal" in app_text)
print("exportTrainingsToPDF in app.js:", "function exportTrainingsToPDF" in app_text)
