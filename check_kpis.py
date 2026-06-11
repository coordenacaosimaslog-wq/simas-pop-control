import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

idx = text.find('id="kpi-total-pops"')
print(text[max(0, idx-200):idx+500])
