import json
import codecs

log_file = r'C:\Users\Iara Silva Moreira\.gemini\antigravity\brain\25b309e9-127e-4f4a-8d7e-dae4e1412b31\.system_generated\logs\transcript.jsonl'

diff_content = ""

with codecs.open(log_file, 'r', 'utf-8', errors='ignore') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'multi_replace_file_content' in str(data):
                if 'content' in data:
                    text = data['content']
                    if '[diff_block_start]' in text:
                        idx = text.find('[diff_block_start]')
                        end_idx = text.find('[diff_block_end]')
                        diff_content = text[idx:end_idx]
        except:
            pass

if diff_content:
    recovered_lines = []
    for dl in diff_content.split('\n'):
        if dl.startswith('-'):
            recovered_lines.append(dl[1:])
        elif dl.startswith(' '):
            recovered_lines.append(dl[1:])
            
    with codecs.open('recovered.js', 'w', 'utf-8') as out:
        out.write('\n'.join(recovered_lines))
    print(f"Recovered {len(recovered_lines)} lines!")
else:
    print("Diff block not found via JSON.")
