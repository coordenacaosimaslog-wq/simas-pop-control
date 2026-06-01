import json
import codecs

log_file = r'C:\Users\Iara Silva Moreira\.gemini\antigravity\brain\25b309e9-127e-4f4a-8d7e-dae4e1412b31\.system_generated\logs\transcript.jsonl'

lines_dict = {}

with codecs.open(log_file, 'r', 'utf-8', errors='ignore') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'view_file' in str(data) and 'app.js' in str(data):
                if 'content' in data:
                    text = data['content']
                    for tl in text.split('\n'):
                        if ':' in tl:
                            parts = tl.split(':', 1)
                            if parts[0].isdigit():
                                line_num = int(parts[0])
                                content_line = parts[1][1:] if parts[1].startswith(' ') else parts[1]
                                lines_dict[line_num] = content_line
        except:
            pass

print(f"Recovered {len(lines_dict)} unique lines from view_file logs.")
missing = []
for i in range(1, 2424):
    if i not in lines_dict:
        missing.append(i)

print(f"Missing lines: {len(missing)}")
if missing:
    ranges = []
    start = missing[0]
    prev = missing[0]
    for i in missing[1:]:
        if i == prev + 1:
            prev = i
        else:
            ranges.append((start, prev))
            start = i
            prev = i
    ranges.append((start, prev))
    print("Missing ranges:", ranges)

# Try to merge with current app.js
with codecs.open('app.js', 'r', 'utf-8') as f:
    current_lines = f.read().split('\n')

final_lines = []
for i in range(1, 2424):
    if i in lines_dict:
        final_lines.append(lines_dict[i])
    elif i <= len(current_lines):
        final_lines.append(current_lines[i-1])
    else:
        final_lines.append("")

with codecs.open('app_merged.js', 'w', 'utf-8') as f:
    f.write('\n'.join(final_lines))
print("Created app_merged.js")
