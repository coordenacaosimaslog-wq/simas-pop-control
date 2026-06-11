import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()
    idx = text.find('id="filter-status"')
    if idx != -1:
        print(text[max(0, idx-50):idx+500])
