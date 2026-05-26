import sys
import re

def replacer(match):
    m = match.group(0)
    try:
        return m.encode('cp1252').decode('utf-8')
    except:
        return m

def fix_encoding(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            text = f.read()
            
        fixed_text = re.sub(r'Ã.', replacer, text)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(fixed_text)
            
        print(f'{filename} fixed!')
    except Exception as e:
        print(e)

fix_encoding('index.html')
fix_encoding('app.js')
