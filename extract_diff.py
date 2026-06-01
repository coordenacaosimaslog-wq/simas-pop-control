import codecs

log_file = r'C:\Users\Iara Silva Moreira\.gemini\antigravity\brain\25b309e9-127e-4f4a-8d7e-dae4e1412b31\.system_generated\logs\transcript.jsonl'

with codecs.open(log_file, 'r', 'utf-8', errors='ignore') as f:
    text = f.read()

start = text.rfind('[diff_block_start]')
end = text.find('[diff_block_end]', start)

if start != -1 and end != -1:
    diff = text[start:end]
    lines = diff.split('\\n')
    
    recovered = []
    for line in lines:
        if line.startswith('-'):
            recovered.append(line[1:])
        elif line.startswith(' '):
            recovered.append(line[1:])
            
    with codecs.open('diff_recovered.txt', 'w', 'utf-8') as f:
        f.write('\\n'.join(recovered))
    print(f"Extracted {len(recovered)} lines!")
else:
    print("Not found")
