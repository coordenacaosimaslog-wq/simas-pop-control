import codecs

# 1. Update app.js (itemsPerPage)
with codecs.open('app.js', 'r', 'utf-8') as f:
    app_js = f.read()

app_js = app_js.replace('const itemsPerPage = 5;', 'const itemsPerPage = 20;')

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(app_js)
print("app.js updated: itemsPerPage = 20")

# 2. Update index.html (add Juatuba filter)
with codecs.open('index.html', 'r', 'utf-8') as f:
    index_html = f.read()

target_html = '<option value="S\xc3\xa3o Roque">S\xc3\xa3o Roque</option>'
target_html_alt = '<option value="São Roque">São Roque</option>'

replacement_html = '<option value="São Roque">São Roque</option>\n                                    <option value="Juatuba">Juatuba</option>'

if target_html in index_html:
    index_html = index_html.replace(target_html, replacement_html)
    print("index.html updated: added Juatuba (target 1)")
elif target_html_alt in index_html:
    index_html = index_html.replace(target_html_alt, replacement_html)
    print("index.html updated: added Juatuba (target 2)")
else:
    # try one more fallback
    target_fallback = '<option value="SJP Prefeitura">SJP Prefeitura</option>'
    if target_fallback in index_html:
        index_html = index_html.replace(target_fallback, target_fallback + '\n                                    <option value="São Roque">São Roque</option>\n                                    <option value="Juatuba">Juatuba</option>')
        print("index.html updated: added Juatuba (fallback)")
    else:
        print("Error: Could not find target in index.html")

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(index_html)
