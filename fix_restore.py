import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()

target = """        } else {
            showToast("Nível de acesso insuficiente para exclusão definitiva.", "error");
            return;
        }"""
# Wait, the console output earlier had replacing `` which means the text actually has UTF-8 bytes that aren't matching my python literal if I'm not careful. Let me just find `clearFilters(false);` and `const pop = pops.find(p => p.id === id);`

idx1 = text.find("clearFilters(false);")
idx2 = text.find("const pop = pops.find(p => p.id === id);")

if idx1 != -1 and idx2 != -1:
    replacement = """clearFilters(false);
        } else {
            applyFilters();
        }
        checkExpirationsAndAlert();
    } catch (e) {
        console.error("Erro ao salvar POP:", e);
        showToast("Erro crítico: " + e.message, "error");
    }
}

async function deletePOP(id) {
    try {
        if (!currentUser.permissions.delete) {
            showToast("Nível de acesso insuficiente para exclusão definitiva.", "error");
            return;
        }
        
        """
    text = text[:idx1] + replacement + text[idx2:]
    with codecs.open('app.js', 'w', 'utf-8') as f:
        f.write(text)
    print("Restored successfully")
else:
    print("Indices not found")
