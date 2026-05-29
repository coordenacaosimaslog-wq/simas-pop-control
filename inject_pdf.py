import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    content = f.read()

# 2. Inject Button
btn_target = '<button class="btn-outline" onclick="downloadTrainingTemplate()"'
btn_replacement = '<button class="btn-outline" onclick="exportTrainingsToPDF()" title="Exportar para PDF" style="border-color: #0B1D32; color: #0B1D32;">\n                                <i class="fa-solid fa-file-pdf"></i> PDF\n                            </button>\n                            ' + btn_target

if btn_target in content and 'exportTrainingsToPDF' not in content:
    content = content.replace(btn_target, btn_replacement)
    print("Button injected")
else:
    print("Could not find btn-outline or already injected")

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(content)
print("Saved index.html")
