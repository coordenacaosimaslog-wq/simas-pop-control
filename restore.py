import sys

def restore(filename):
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()

    # Revert 'no' -> 'não' damage
    text = text.replace('nãone', 'none')
    text = text.replace('nãowrap', 'nowrap')
    text = text.replace('nãode', 'node')
    text = text.replace('anão', 'ano')
    text = text.replace('nãome', 'nome')
    text = text.replace('nãovo', 'novo')
    text = text.replace('nãormal', 'normal')
    text = text.replace('nãot', 'not')
    text = text.replace('ignãore', 'ignore')
    text = text.replace('nãomber', 'number')
    text = text.replace('nãow', 'now')
    text = text.replace('Nãone', 'None')
    text = text.replace('Nãow', 'Now')
    text = text.replace('nãothing', 'nothing')
    text = text.replace('menãos', 'menos')
    text = text.replace('menão', 'meno')
    text = text.replace('tecnãologia', 'tecnologia')
    text = text.replace('nãova', 'nova')
    text = text.replace('nãossa', 'nossa')
    text = text.replace('nãovos', 'novos')
    text = text.replace(' nãos ', ' nos ')
    text = text.replace('nãotify', 'notify')
    text = text.replace('nãodeName', 'nodeName')

    # Revert 'ao' -> 'ação' damage
    text = text.replace('tacaost', 'toast')
    text = text.replace('downlacaod', 'download')
    text = text.replace('lacaod', 'load')
    text = text.replace('bacaord', 'board')
    text = text.replace('flacaot', 'float')
    text = text.replace('açãor', 'aor')
    text = text.replace('açãom', 'aom')
    text = text.replace('açãos', 'aos')
    text = text.replace('açãou', 'aou')
    text = text.replace('ação ', 'ao ')
    text = text.replace('ação"', 'ao"')
    text = text.replace("ação'", "ao'")
    
    # Fix the Area case again just in case
    text = text.replace('ÃÁrea', 'Área')
    text = text.replace('Ãrea', 'Área')
    text = text.replace('ÁÁrea', 'Área')

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(text)

restore('app.js')
restore('index.html')
print('Restored most common breaks!')
