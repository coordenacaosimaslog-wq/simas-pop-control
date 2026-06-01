import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    lines = f.readlines()

with codecs.open('missing_lines.txt', 'r', 'utf-8') as f:
    missing = f.readlines()

for i, line in enumerate(lines):
    if '<div class="action-buttons" style="display: flex; gap: 6px; justify-content: center;">' in line:
        insert_idx = i + 1
        break

lines = lines[:insert_idx] + missing + lines[insert_idx:]

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.writelines(lines)

print('Restored missing lines! Total lines now:', len(lines))
