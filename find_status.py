import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if 'id="filter-status"' in line or 'id="form-pop-status"' in line:
            print('Line', i+1, line.strip())
            print('Line', i+2, lines[i+1].strip())
            print('Line', i+3, lines[i+2].strip())
            print('-')
