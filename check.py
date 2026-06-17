import codecs

def check_braces(file_path):
    with codecs.open(file_path, 'r', 'utf-8') as f:
        content = f.read()
    
    curly, round_b, square = 0, 0, 0
    in_string, in_comment_line, in_comment_block = False, False, False
    string_char = ''
    i = 0
    while i < len(content):
        c = content[i]
        if not in_string and not in_comment_line and not in_comment_block:
            if c == '/' and i+1 < len(content) and content[i+1] == '/':
                in_comment_line = True
                i += 1
            elif c == '/' and i+1 < len(content) and content[i+1] == '*':
                in_comment_block = True
                i += 1
            elif c in ['\"', \"'\", '`']:
                in_string = True
                string_char = c
            elif c == '{': curly += 1
            elif c == '}': curly -= 1
            elif c == '(': round_b += 1
            elif c == ')': round_b -= 1
            elif c == '[': square += 1
            elif c == ']': square -= 1
        elif in_comment_line:
            if c == '\n': in_comment_line = False
        elif in_comment_block:
            if c == '*' and i+1 < len(content) and content[i+1] == '/':
                in_comment_block = False
                i += 1
        elif in_string:
            if c == '\\\\' and i+1 < len(content): i += 1
            elif c == string_char: in_string = False
        i += 1
        if curly < 0:
            print(f'Negative curly at line {content.count(chr(10), 0, i) + 1}')
            curly = 0
    print(f'Curly: {curly}, Round: {round_b}, Square: {square}')

check_braces('app.js')
