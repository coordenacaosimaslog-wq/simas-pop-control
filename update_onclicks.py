import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace('onclick="openExportPDFModal()"', "onclick=\\"openExportPDFModal('TRAININGS')\\"")
text = text.replace('onclick="exportMasterList()"', "onclick=\\"openExportPDFModal('MASTER_LIST')\\"")

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(text)

print('Updated index.html onclicks')
