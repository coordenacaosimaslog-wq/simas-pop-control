import codecs
import re

with codecs.open('app.js', 'r', 'utf-8') as f:
    content = f.read()

# We need to find:
# let downloadBtn = `<button class="btn-icon" onclick="downloadPOP('${pop.id}')" style="color: var(--brand);" title="Baixar Arquivo"><i class="fa-solid fa-download"></i></button>`;
# And insert `let approveBtn = "";\nif (currentUser.isAdmin && pop.status === "AGUARDANDO APROVAÇAO") { approveBtn = ... }` after it.

pattern = re.compile(r'(let downloadBtn = `<button class="btn-icon" onclick="downloadPOP\(\'\$\{pop\.id\}\'\)" style="color: var\(--brand\);" title="Baixar Arquivo"><i class="fa-solid fa-download"></i></button>`;)')

replacement = r'''\1
            let approveBtn = "";
            if (currentUser.isAdmin && pop.status === "AGUARDANDO APROVAÇAO") {
                approveBtn = `<button class="btn-icon" onclick="approvePOP('${pop.id}')" style="color: #2E7D32; border-color: #BBF7D0;" title="Aprovar/Revisar POP"><i class="fa-solid fa-check-circle"></i></button>`;
            }'''

new_content = pattern.sub(replacement, content)

if new_content != content:
    with codecs.open('app.js', 'w', 'utf-8') as f:
        f.write(new_content)
    print("Fixed approveBtn!")
else:
    print("Pattern still not found. Let's try finding just downloadBtn.")
