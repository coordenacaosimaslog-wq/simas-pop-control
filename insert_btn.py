import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'let downloadBtn =' in line and 'Baixar Arquivo' in line:
        lines.insert(i + 1, '            let approveBtn = "";\n            if (currentUser.isAdmin && pop.status === "AGUARDANDO APROVAÇAO") {\n                approveBtn = `<button class="btn-icon" onclick="approvePOP(\\'${pop.id}\\')" style="color: #2E7D32; border-color: #BBF7D0;" title="Aprovar/Revisar POP"><i class="fa-solid fa-check-circle"></i></button>`;\n            }\n')
        break

for i, line in enumerate(lines):
    if 'downloadPOP' in line and 'Baixar documento' in line:
        lines.insert(i, '                        ${approveBtn}\n')
        break

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.writelines(lines)

print('Inserted approveBtn successfully!')
