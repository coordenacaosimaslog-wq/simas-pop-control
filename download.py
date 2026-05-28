import urllib.request

url = 'https://raw.githubusercontent.com/coordenacaosimaslog-wq/simas-pop-control/d25a2adeb35effb94804eb283a4a342a87ccbbcc/index.html'
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    content = response.read().decode('utf-8')

target = '<script src="app.js"></script>'
replacement = '<script src="firebase-config.js"></script>\n    <script src="app.js"></script>'

if target in content:
    content = content.replace(target, replacement)
    print("Injected successfully!")
else:
    print("Target not found!")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Saved index.html")
