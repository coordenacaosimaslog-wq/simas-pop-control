import urllib.request
import re

with open('app.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

def check_brackets(code):
    brackets = {'{': '}', '[': ']', '(': ')'}
    stack = []
    for i, char in enumerate(code):
        if char in brackets.keys():
            stack.append((char, i))
        elif char in brackets.values():
            if not stack:
                print(f'Unmatched closing bracket {char} at index {i}')
                return False
            expected_closing = brackets[stack[-1][0]]
            if char != expected_closing:
                print(f'Mismatched bracket at index {i}. Expected {expected_closing}, got {char}')
                return False
            stack.pop()
    if stack:
        print(f'Unmatched opening brackets remaining: {stack}')
        return False
    return True

code_no_strings = re.sub(r'(?s)\/\*.*?\*\/', '', js_code)
code_no_strings = re.sub(r'//.*', '', code_no_strings)
code_no_strings = re.sub(r'"(?:\\.|[^\\"])*"', '', code_no_strings)
code_no_strings = re.sub(r"'(?:\\.|[^\\'])*'", "", code_no_strings)
code_no_strings = re.sub(r'`(?:\\.|[^\\`])*`', '', code_no_strings)

# remove regex literals loosely
code_no_strings = re.sub(r'/[^/\n]+/[gimuy]*', '', code_no_strings)

if check_brackets(code_no_strings):
    print('app.js: Brackets are balanced.')
else:
    print('app.js: Syntax error detected!')
