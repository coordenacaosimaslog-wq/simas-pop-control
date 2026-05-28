import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

ids = set(re.findall(r'id=[\'"]([^\'"]+)[\'"]', html))
gets = set(re.findall(r'getElementById\([\'"]([^\'"]+)[\'"]\)', js))

missing = gets - ids
print('IDs in app.js not found in HTML:', missing)
