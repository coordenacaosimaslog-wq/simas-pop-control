import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    content = f.read()

target = 'accept=".pdf,.doc,.docx,.xls,.xlsx"'
replacement = 'accept=".pdf,.doc,.docx,.xls,.xlsx,.xlsm"'

if target in content:
    content = content.replace(target, replacement)
    with codecs.open('index.html', 'w', 'utf-8') as f:
        f.write(content)
    print("Atualizado accept de form-pop-file!")
else:
    print("Erro: Nao achou o accept do form-pop-file")
