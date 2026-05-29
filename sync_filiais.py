import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    content = f.read()

# 1. Add missing filiais to filter-filial
target_filter = '<option value="Juatuba">Juatuba</option>'
# We only want to replace the first occurrence which is in filter-filial, or just do it safely
# Actually, the user wants filter-filial to have the same as form-pop-filial.
# Let's replace the whole block of options in filter-filial

options_block = """                                    <option value="Matriz">Matriz</option>
                                    <option value="Camaçari">Camaçari</option>
                                    <option value="Funeas">Funeas</option>
                                    <option value="SJP Prefeitura">SJP Prefeitura</option>
                                    <option value="São Roque">São Roque</option>
                                    <option value="Juatuba">Juatuba</option>
                                    <option value="Sorocaba">Sorocaba</option>
                                    <option value="Governador Valadares">Governador Valadares</option>
                                    <option value="Contagem">Contagem</option>"""

# Find the start of filter-filial
idx1 = content.find('<select id="filter-filial"')
if idx1 != -1:
    idx2 = content.find('</select>', idx1)
    if idx2 != -1:
        # Rebuild filter-filial block
        new_filter_block = '<select id="filter-filial" onchange="applyFilters()">\n                                    <option value="">Todas</option>\n' + options_block + '\n                                </select>'
        content = content[:idx1] + new_filter_block + content[idx2 + 9:]
        print("Updated filter-filial options.")

# 2. Fix form-pop-filial
# Rebuild the block for form-pop-filial too
idx3 = content.find('<select id="form-pop-filial"')
if idx3 != -1:
    idx4 = content.find('</select>', idx3)
    if idx4 != -1:
        new_form_block = '<select id="form-pop-filial" required>\n                            <option value="" disabled selected>Selecione a Filial...</option>\n' + options_block.replace('                                    ', '                            ') + '\n                        </select>'
        content = content[:idx3] + new_form_block + content[idx4 + 9:]
        print("Updated form-pop-filial options.")

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(content)
