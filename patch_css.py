import codecs

with codecs.open('styles.css', 'r', 'utf-8') as f:
    text = f.read()

# 1. Update .metric-card padding and border/shadows
text = text.replace(
    'padding: 1.4rem 1.5rem;\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    box-shadow: var(--shadow-sm);',
    'padding: 1.8rem 1.8rem;\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    box-shadow: 0 4px 20px rgba(0,0,0,0.04);\n    border: 1px solid rgba(0,0,0,0.03);'
)

# 2. Update .metric-data h3 (reduce visual weight)
text = text.replace(
    'font-size: 0.7rem;\n    font-weight: 700;\n    color: var(--text-secondary);\n    text-transform: uppercase;\n    letter-spacing: 0.8px;',
    'font-size: 0.75rem;\n    font-weight: 500;\n    color: var(--text-secondary);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n    opacity: 0.85;'
)

# 3. Update .metric-data .value (highlight more)
text = text.replace(
    'font-size: 2.1rem;\n    font-weight: 800;\n    color: var(--graphite-900);\n    margin-top: 4px;\n    line-height: 1;\n    letter-spacing: -1px;',
    'font-size: 2.6rem;\n    font-weight: 800;\n    color: var(--graphite-900);\n    margin-top: 6px;\n    line-height: 1;\n    letter-spacing: -1.5px;'
)

# 4. Update .chart-card padding and border/shadows
text = text.replace(
    'padding: 1.4rem;\n    box-shadow: var(--shadow-sm);\n    display: flex;\n    flex-direction: column;',
    'padding: 1.6rem;\n    box-shadow: 0 4px 20px rgba(0,0,0,0.04);\n    border: 1px solid rgba(0,0,0,0.03);\n    display: flex;\n    flex-direction: column;'
)

# 5. Remove border-bottom from .chart-header
text = text.replace(
    'margin-bottom: 1.2rem;\n    border-bottom: 1px solid var(--border-color);\n    padding-bottom: 0.85rem;',
    'margin-bottom: 1.5rem;\n    padding-bottom: 0.5rem;'
)

# 6. Reduce visual emphasis of subtitle
text = text.replace(
    '.header-title-area p {\n    font-size: 0.77rem;\n    color: var(--text-secondary);\n    margin-top: 1px;\n}',
    '.header-title-area p {\n    font-size: 0.75rem;\n    color: var(--text-secondary);\n    margin-top: 2px;\n    opacity: 0.6;\n}'
)

with codecs.open('styles.css', 'w', 'utf-8') as f:
    f.write(text)

print('Patched styles.css')
