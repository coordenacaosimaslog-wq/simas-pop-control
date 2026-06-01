import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace('<div class="modal" id="pdf-filial-modal">', '<div id="pdf-filial-modal" class="modal-overlay">')
text = text.replace('<div class="modal-content" style="max-width: 400px;">', '<div class="modal-container" style="max-width: 400px;">')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(text)

print("Fixed CSS classes for modal in index.html")
