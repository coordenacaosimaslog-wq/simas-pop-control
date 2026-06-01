import codecs

with codecs.open('app.js', 'r', 'utf-8', errors='replace') as f:
    text = f.read()

print("Double quotes:", text.count('"'))
print("Single quotes:", text.count("'"))
print("Backticks:", text.count("`"))
