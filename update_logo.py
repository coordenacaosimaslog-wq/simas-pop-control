import codecs
import re

# Read new base64 string
with open('logo_nova_b64.txt', 'r') as f:
    new_b64 = f.read()

# Read app.js
with codecs.open('app.js', 'r', 'utf-8') as f:
    content = f.read()

# Replace the specific definition using regex
# Look for: const simasLogoBase64 = 'data:image/png;base64,...';
pattern = re.compile(r"const simasLogoBase64 = '.*?';")

if pattern.search(content):
    content = pattern.sub(f"const simasLogoBase64 = '{new_b64}';", content)
    with codecs.open('app.js', 'w', 'utf-8') as f:
        f.write(content)
    print("app.js atualizado com a nova logo!")
else:
    print("Nao achou a variavel simasLogoBase64 em app.js")
