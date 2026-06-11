import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    text = f.read()

# 1. Update Title in app.js
text = text.replace('title.innerText = "Dashboard Operacional";', 'title.innerText = "Controle Corporativo de POPs";')

# 2. Update Chart 1 (Filiais)
chart1_target = """                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: '#0B1D32' }
                    },
                    scales: {
                        x: {
                            grid: { color: '#E2E8F0' },
                            ticks: { stepSize: 1, color: '#4A6B82' }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: '#0B1D32', font: { weight: '600' } }
                        }
                    }
                }"""

chart1_replacement = """                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { right: 30 } }, // Space for numbers
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: '#0B1D32' }
                    },
                    scales: {
                        x: {
                            display: false // Hides grid and axis labels completely
                        },
                        y: {
                            grid: { display: false, drawBorder: false },
                            ticks: { color: '#0B1D32', font: { weight: '600', size: 12 } }
                        }
                    }
                },
                plugins: [{
                    id: 'drawValues',
                    afterDatasetsDraw(chart) {
                        const { ctx, data } = chart;
                        ctx.save();
                        chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
                            const value = data.datasets[0].data[index];
                            if (value > 0) {
                                ctx.font = 'bold 12px "Montserrat", sans-serif';
                                ctx.fillStyle = '#0B1D32';
                                ctx.textAlign = 'left';
                                ctx.textBaseline = 'middle';
                                ctx.fillText(value, datapoint.x + 8, datapoint.y);
                            }
                        });
                        ctx.restore();
                    }
                }]"""

text = text.replace(chart1_target, chart1_replacement)

# 3. Update Chart 2 (Status)
chart2_target = """            chartStatusInstance = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['REVISADO', 'AGUARDANDO APROVAÇAO', 'COPIA NÃO CONTROLADA', 'HOMOLOGADO', 'VENCIDO'],
                    datasets: [{
                        data: [countsStatus.Revisado, countsStatus.Validacao, countsStatus.Aprovado, countsStatus.Homologado, countsStatus.Vencido],
                        backgroundColor: ['#0B1D32', '#F57C00', '#6A1B9A', '#2E7D32', '#A30D00'], /* Novas cores solicitadas */
                        borderColor: '#ffffff',
                        borderWidth: 3,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#0B1D32',
                                font: { size: 11, weight: '500' },
                                padding: 10,
                                boxWidth: 12
                            }
                        }
                    },
                    cutout: '65%'
                }
            });"""

chart2_replacement = """            chartStatusInstance = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: [
                        `Revisado (${countsStatus.Revisado})`, 
                        `Aguardando Aprovação (${countsStatus.Validacao})`, 
                        `Cópia Não Controlada (${countsStatus.Aprovado})`, 
                        `Homologado (${countsStatus.Homologado})`, 
                        `Vencido (${countsStatus.Vencido})`
                    ],
                    datasets: [{
                        data: [countsStatus.Revisado, countsStatus.Validacao, countsStatus.Aprovado, countsStatus.Homologado, countsStatus.Vencido],
                        backgroundColor: ['#0B1D32', '#F57C00', '#6A1B9A', '#2E7D32', '#A30D00'], /* Novas cores solicitadas */
                        borderColor: '#ffffff',
                        borderWidth: 3,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { top: 10, bottom: 10 } },
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#0B1D32',
                                font: { size: 10, weight: '500' },
                                padding: 8,
                                boxWidth: 10
                            }
                        }
                    },
                    cutout: '70%'
                }
            });"""

text = text.replace(chart2_target, chart2_replacement)

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(text)

print('Patched app.js')
