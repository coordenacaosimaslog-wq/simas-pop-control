import re

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

count = 0
for i, line in enumerate(lines):
    # naive string removal
    l = re.sub(r'//.*', '', line)
    l = re.sub(r'".*?"', '', l)
    l = re.sub(r"'.*?'", '', l)
    l = re.sub(r'`.*?`', '', l)
    
    open_c = l.count('{')
    close_c = l.count('}')
    count += open_c - close_c
    if count < 0:
        print(f'Negative balance at line {i+1}: {line.strip()}')
        break
        
print("Final count:", count)
