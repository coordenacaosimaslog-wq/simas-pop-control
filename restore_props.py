import sys

def restore_js_props(filename):
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()

    replacements = {
        'descri\u00e7\u00e3o': 'descricao',
        'dataRevis\u00e3o': 'dataRevisao',
        'proximaRevis\u00e3o': 'proximaRevisao',
        'gest\u00e3o@simas': 'gestao@simas',
        'opera\u00e7\u00e3o_sao_roque': 'operacao_sao_roque',
        'opera\u00e7\u00e3o@simas': 'operacao@simas',
        'expedi\u00e7\u00e3o_noturna': 'expedicao_noturna',
        'n\u00e3o painel': 'no painel',
        'n\u00e3o console': 'no console',
        'n\u00e3o sistema': 'no sistema',
        'n\u00e3o login': 'no login',
        'n\u00e3o navegador': 'no navegador',
        'n\u00e3o momento': 'no momento',
        'n\u00e3o dashboard': 'no dashboard',
        'n\u00e3o rodap': 'no rodap',
        'n\u00e3o upload': 'no upload',
        'n\u00e3o modal': 'no modal',
        'n\u00e3o usu\u00e1rio': 'no usu\u00e1rio',
        'n\u00e3o usu\u00e1': 'no usu\u00e1',
        'n\u00e3o pape': 'no pape',
        'n\u00e3o Campo': 'no Campo',
        'n\u00e3o prot': 'no prot',
        'n\u00e3o proc': 'no proc',
        'n\u00e3o envi': 'no envi',
        'n\u00e3o Tran': 'no Tran',
        'aplica\u00e7\u00e3o': 'aplicacao',
        'cria\u00e7\u00e3o:': 'criacao:',  
        'valida\u00e7\u00e3o:': 'validacao:',
        'opera\u00e7\u00e3o': 'operacao', 
        'gest\u00e3o': 'gestao',         
        'n\u00e3o-conf': 'nao-conf',     
        'n\u00e3o-refut\u00e1vel': 'nao-refutavel'
    }

    for k, v in replacements.items():
        text = text.replace(k, v)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(text)

restore_js_props('app.js')
restore_js_props('index.html')
print('Restored JS props!')
