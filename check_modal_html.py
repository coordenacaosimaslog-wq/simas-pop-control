import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find('id="training-modal"')
print(text[max(0, idx-50):idx+300])

idx2 = text.find('id="pdf-filial-modal"')
print("---")
print(text[max(0, idx2-50):idx2+300])
