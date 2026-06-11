import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()

target1 = '''                    scales: {
                        x: {
                            grid: { color: '#E2E8F0' },
                            ticks: { stepSize: 1, color: '#4A6B82' }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: '#0B1D32', font: { weight: '600' } }
                        }
                    }'''

replacement1 = '''                    scales: {
                        x: {
                            grid: { display: false },
                            border: { display: false },
                            ticks: { display: false }
                        },
                        y: {
                            grid: { display: false },
                            border: { display: false },
                            ticks: { color: '#0B1D32', font: { weight: '600' } }
                        }
                    }'''

if target1 in text:
    text = text.replace(target1, replacement1)
else:
    target1_alt = target1.replace('\n', '\r\n')
    if target1_alt in text:
        text = text.replace(target1_alt, replacement1)
    else:
        print('target1 not found')

target2 = '''            chartFilialInstance = new Chart(ctxFilial, {
                type: 'bar',
                data: {'''

replacement2 = '''            chartFilialInstance = new Chart(ctxFilial, {
                type: 'bar',
                plugins: [{
                    id: 'customDataLabels',
                    afterDatasetsDraw(chart) {
                        const { ctx, data } = chart;
                        ctx.save();
                        ctx.font = 'bold 13px Montserrat, sans-serif';
                        ctx.fillStyle = '#0B1D32';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
                            const value = data.datasets[0].data[index];
                            if (value > 0) {
                                ctx.fillText(value, datapoint.x + 8, datapoint.y);
                            }
                        });
                    }
                }],
                data: {'''

if target2 in text:
    text = text.replace(target2, replacement2)
else:
    target2_alt = target2.replace('\n', '\r\n')
    if target2_alt in text:
        text = text.replace(target2_alt, replacement2)
    else:
        print('target2 not found')

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(text)

with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

target_html = '<h3><i class="fa-solid fa-chart-column"></i> POPs por Filiais Operacionais</h3>'
replacement_html = '<h3><i class="fa-solid fa-chart-column"></i> POPs POR FILIAIS</h3>'

if target_html in html:
    html = html.replace(target_html, replacement_html)
    with codecs.open('index.html', 'w', 'utf-8') as f:
        f.write(html)
    print('Updated index.html')
else:
    print('target_html not found')

print('Finished script')
