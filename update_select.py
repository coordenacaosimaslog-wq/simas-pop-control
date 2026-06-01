import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

old_select = '''                    <select id="pdf-filial-select" class="form-control">
                        <option value="MATRIZ">MATRIZ</option>
                        <option value="SOROCABA">SOROCABA</option>
                        <option value="SÃO ROQUE">SÃO ROQUE</option>
                        <option value="CAMAÇARI">CAMAÇARI</option>
                        <option value="FUNEAS">FUNEAS</option>
                        <option value="SJP PREFEITURA">SJP PREFEITURA</option>
                    </select>'''

new_select = '''                    <select id="pdf-filial-select" class="form-control">
                        <option value="MATRIZ">MATRIZ (MT)</option>
                        <option value="SOROCABA">SOROCABA (SC)</option>
                        <option value="SÃO ROQUE">SÃO ROQUE (SR)</option>
                        <option value="CAMAÇARI">CAMAÇARI (CAM)</option>
                        <option value="FUNEAS">FUNEAS (PR)</option>
                        <option value="SJP PREFEITURA">SJP PREFEITURA (SJP)</option>
                        <option value="TIGRE">TIGRE (TG)</option>
                        <option value="JUATUBA">JUATUBA (JB)</option>
                        <option value="GOVERNADOR VALADARES">GOVERNADOR VALADARES (GV)</option>
                    </select>'''

text = text.replace(old_select, new_select)

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(text)

print('Updated select options in index.html')
