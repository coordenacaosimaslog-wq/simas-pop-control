import re
import test

with open('auth.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

code_no_strings = re.sub(r'(?s)\/\*.*?\*\/', '', js_code)
code_no_strings = re.sub(r'//.*', '', code_no_strings)
code_no_strings = re.sub(r'"(?:\\.|[^\\"])*"', '', code_no_strings)
code_no_strings = re.sub(r"'(?:\\.|[^\\'])*'", "", code_no_strings)
code_no_strings = re.sub(r'`(?:\\.|[^\\`])*`', '', code_no_strings)
code_no_strings = re.sub(r'/[^/\n]+/[gimuy]*', '', code_no_strings)

if test.check_brackets(code_no_strings):
    print('auth.js: Brackets are balanced.')
else:
    print('auth.js: Syntax error detected!')
