import codecs
import time

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

ts = str(int(time.time()))

text = text.replace('app.js', f'app.js?v={ts}')
text = text.replace('auth.js', f'auth.js?v={ts}')
text = text.replace('styles.css', f'styles.css?v={ts}')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(text)
print('Cache buster applied!')
