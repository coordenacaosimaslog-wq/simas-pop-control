import codecs
with codecs.open('index.html', 'r', 'utf-8') as f:
    content = f.read()

target = '<div class="search-box">'
replacement = '<div class="search-input-wrapper">'

if target in content:
    content = content.replace(target, replacement)
    with codecs.open('index.html', 'w', 'utf-8') as f:
        f.write(content)
    print('Corrigido com sucesso')
else:
    print('Nao encontrado')
