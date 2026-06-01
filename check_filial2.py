import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()
    idx = text.find('id="form-pop-filial"')
    if idx != -1:
        print(text[max(0, idx-10):idx+800])
