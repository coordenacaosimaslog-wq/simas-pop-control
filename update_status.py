import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

target1 = '                                    <option value="AGUARDANDO APROVAÇAO">AGUARDANDO APROVAÇÃO</option>'
replacement1 = '                                    <option value="AGUARDANDO APROVAÇAO">AGUARDANDO APROVAÇÃO</option>\n                                    <option value="AGUARDANDO REVISÃO">AGUARDANDO REVISÃO</option>'

if target1 in text:
    text = text.replace(target1, replacement1)
else:
    # Try with weird encoding
    target1_alt = '                                    <option value="AGUARDANDO APROVAAO">AGUARDANDO APROVAO</option>'
    if target1_alt in text:
        text = text.replace(target1_alt, '                                    <option value="AGUARDANDO APROVAÇAO">AGUARDANDO APROVAÇÃO</option>\n                                    <option value="AGUARDANDO REVISÃO">AGUARDANDO REVISÃO</option>')
    else:
        print('target1 not found')

target2 = '                            <option value="AGUARDANDO APROVAÇAO">AGUARDANDO APROVAÇÃO</option>'
replacement2 = '                            <option value="AGUARDANDO APROVAÇAO">AGUARDANDO APROVAÇÃO</option>\n                            <option value="AGUARDANDO REVISÃO">AGUARDANDO REVISÃO</option>'

if target2 in text:
    text = text.replace(target2, replacement2)
else:
    target2_alt = '                            <option value="AGUARDANDO APROVAAO">AGUARDANDO APROVAO</option>'
    if target2_alt in text:
        text = text.replace(target2_alt, '                            <option value="AGUARDANDO APROVAÇAO">AGUARDANDO APROVAÇÃO</option>\n                            <option value="AGUARDANDO REVISÃO">AGUARDANDO REVISÃO</option>')
    else:
        print('target2 not found')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(text)

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()

target3 = '} else if (pop.status === "AGUARDANDO APROVAÇAO") {'
replacement3 = '} else if (pop.status === "AGUARDANDO APROVAÇAO" || pop.status === "AGUARDANDO REVISÃO") {'
if target3 in text:
    text = text.replace(target3, replacement3)
else:
    target3_alt = '} else if (pop.status === "AGUARDANDO APROVAAO") {'
    if target3_alt in text:
        text = text.replace(target3_alt, replacement3)

target4 = 'if (currentUser.isAdmin && pop.status === "AGUARDANDO APROVAÇAO") {'
replacement4 = 'if (currentUser.isAdmin && (pop.status === "AGUARDANDO APROVAÇAO" || pop.status === "AGUARDANDO REVISÃO")) {'
if target4 in text:
    text = text.replace(target4, replacement4)
else:
    target4_alt = 'if (currentUser.isAdmin && pop.status === "AGUARDANDO APROVAAO") {'
    if target4_alt in text:
        text = text.replace(target4_alt, replacement4)

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(text)

print('Updated index.html and app.js')
