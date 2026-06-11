import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    text = f.read()

target_html = '<h3><i class="fa-solid fa-chart-column"></i> POPs por Filiais Operacionais</h3>'
replacement_html = '<h3><i class="fa-solid fa-chart-column"></i> POPs POR FILIAIS</h3>'

text = text.replace(target_html, replacement_html)
with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(text)

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()

target_js = """                    scales: {
                        x: {
                            grid: { color: '#E2E8F0' },
                            ticks: { stepSize: 1, color: '#4A6B82' }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: '#0B1D32', font: { weight: '600' } }
                        }
                    }"""

replacement_js = """                    scales: {
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
                    }"""

if target_js in text:
    text = text.replace(target_js, replacement_js)
else:
    # Try with \n
    target_js_alt = target_js.replace('\r\n', '\n')
    if target_js_alt in text:
        text = text.replace(target_js_alt, replacement_js)
    else:
        print("target_js not found in app.js")

target_chart_init = """            chartFilialInstance = new Chart(ctxFilial, {
                type: 'bar',
                data: {"""

replacement_chart_init = """            chartFilialInstance = new Chart(ctxFilial, {
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
                data: {"""

if target_chart_init in text:
    text = text.replace(target_chart_init, replacement_chart_init)
else:
    target_chart_init_alt = target_chart_init.replace('\r\n', '\n')
    if target_chart_init_alt in text:
        text = text.replace(target_chart_init_alt, replacement_chart_init)
    else:
        print("target_chart_init not found in app.js")

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(text)

print('Updated index.html and app.js successfully.')
