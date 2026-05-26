import re

with open('index.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Fix table header
text = re.sub(r'<th>.*?rea.*?</th>', '<th>Área</th>', text)
# Fix labels
text = re.sub(r'<label for="filter-.*?rea">.*?rea</label>', '<label for="filter-area">Área</label>', text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed index.html remaining artifacts!')
