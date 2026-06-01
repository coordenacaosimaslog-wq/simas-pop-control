import codecs
with codecs.open('app.js', 'r', 'utf-8', errors='replace') as f:
    text = f.read()
    print("approveBtn count:", text.count("${approveBtn}"))
    print("editBtn count:", text.count("${editBtn}"))
