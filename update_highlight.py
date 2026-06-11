import codecs

with codecs.open('styles.css', 'r', 'utf-8') as f:
    text = f.read()

target = '.status-badge.aguardando {\r\n    background-color: #FFF4D6;\r\n    color: #B7791F;\r\n}'
replacement = '''@keyframes pulse-amber {
    0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
    100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}

.status-badge.aguardando {
    background-color: #FEF3C7;
    color: #B45309;
    border: 1px solid #FDE68A;
    animation: pulse-amber 2s infinite;
}

.row-aguardando {
    background-color: #FFFBEB !important;
}
.row-aguardando td:first-child {
    border-left: 4px solid #F59E0B;
}'''

if target in text:
    text = text.replace(target, replacement)
    with codecs.open('styles.css', 'w', 'utf-8') as f:
        f.write(text)
    print('Updated styles.css')
else:
    print('Target not found in styles.css')

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()

target2 = '} else if (pop.status === "AGUARDANDO APROVAÇAO" || pop.status === "AGUARDANDO REVISÃO") {\r\n                statusClass += "validacao";'
replacement2 = '} else if (pop.status === "AGUARDANDO APROVAÇAO" || pop.status === "AGUARDANDO REVISÃO") {\r\n                statusClass += "aguardando";\r\n                tr.className = "row-aguardando";'

if target2 in text:
    text = text.replace(target2, replacement2)
    with codecs.open('app.js', 'w', 'utf-8') as f:
        f.write(text)
    print('Updated app.js')
else:
    # Try with single newline
    target2_alt = '} else if (pop.status === "AGUARDANDO APROVAÇAO" || pop.status === "AGUARDANDO REVISÃO") {\n                statusClass += "validacao";'
    if target2_alt in text:
        text = text.replace(target2_alt, '} else if (pop.status === "AGUARDANDO APROVAÇAO" || pop.status === "AGUARDANDO REVISÃO") {\n                statusClass += "aguardando";\n                tr.className = "row-aguardando";')
        with codecs.open('app.js', 'w', 'utf-8') as f:
            f.write(text)
        print('Updated app.js')
    else:
        print('Target not found in app.js')
