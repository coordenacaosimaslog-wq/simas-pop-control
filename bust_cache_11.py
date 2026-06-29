import sys
import time
import re

with open('C:/Users/Iara Silva Moreira/.gemini/antigravity/scratch/simas-pop-control/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Bust cache again
timestamp = str(int(time.time()))
text = re.sub(r'app_v3\.js\?v=\d+', f'app_v3.js?v={timestamp}', text)

with open('C:/Users/Iara Silva Moreira/.gemini/antigravity/scratch/simas-pop-control/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Cache busted for dashboard rename fix.")
