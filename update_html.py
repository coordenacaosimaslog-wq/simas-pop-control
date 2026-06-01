import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace('title="Baixar Lista Mestre Geral"', 'title="Baixar Lista Mestre em PDF"')
text = text.replace('<i class="fa-solid fa-list-check"></i> Lista Mestre', '<i class="fa-solid fa-file-pdf"></i> Lista Mestre')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(text)
    
print('Updated index.html')
