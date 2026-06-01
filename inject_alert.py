import codecs
with codecs.open('auth.js', 'r', 'utf-8', errors='replace') as f:
    text = f.read()

target = "showToast('Erro no processo de autenticação.', 'error');"
replacement = "showToast('Erro no processo de autenticação.', 'error');\n        alert('ERRO DE LOGIN: ' + (e.message || e));"
new_text = text.replace(target, replacement)

with codecs.open('auth.js', 'w', 'utf-8') as f:
    f.write(new_text)
print("Alert injected in auth.js")
