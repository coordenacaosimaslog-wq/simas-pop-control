import json
import codecs

log_file = r'C:\Users\Iara Silva Moreira\.gemini\antigravity\brain\25b309e9-127e-4f4a-8d7e-dae4e1412b31\.system_generated\logs\transcript.jsonl'

lines_dict = {}

with codecs.open(log_file, 'r', 'utf-8', errors='ignore') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Find all responses
            if data.get('source') == 'SYSTEM' and 'output' in str(data):
                content = str(data)
                if 'app.js' in content and 'Total Lines:' in content:
                    # We might have to parse the string to find the lines.
                    # Or better yet, just extract all text matching the pattern "<num>: "
                    pass
        except:
            pass

# Let's do it using raw string finding which is much simpler and more robust
with codecs.open(log_file, 'r', 'utf-8', errors='ignore') as f:
    text = f.read()

import re
# The lines are typically outputted as: "123:     const a = 1;"
# We will match any number followed by a colon and a space, and capture the rest of the line.
# But we only want to do this within view_file outputs of app.js.
matches = re.finditer(r'(\\d+): (.*?)(?=\\n|\\\\n)', text)
for m in matches:
    line_num = int(m.group(1))
    content_line = m.group(2)
    # The JSON string might be escaped, so we unescape it:
    content_line = content_line.replace('\\\\n', '').replace('\\\\"', '"').replace('\\\\\\\\', '\\\\')
    
    if line_num not in lines_dict:
        lines_dict[line_num] = content_line

print(f"Recovered {len(lines_dict)} unique lines.")

with codecs.open('app.js', 'r', 'utf-8') as f:
    current_lines = f.read().split('\\n')

# Check which of the missing lines (1138 to 1395) we actually recovered
recovered_missing = 0
for i in range(1138, 1396):
    if i in lines_dict:
        recovered_missing += 1

print(f"Out of 258 missing lines, we recovered {recovered_missing}.")

# If we have them, we can recreate the file!
if recovered_missing > 0:
    for i in range(1138, 1396):
        if i in lines_dict:
            pass # We have it
        else:
            print(f"Still missing line {i}")
