import Chart from 'chart.js/auto'
import Highcharts from 'highcharts';
import ItemSeries from 'highcharts/modules/item-series';

export async function getElectionResult(id, year, sw) {
    const url =  '../data/' + year.toString() + '/' + sw +'/' + year.toString() + '-' + sw + '.json'
    const chartjson = await fetch(url)
    const chartjsonObject = await chartjson.json()
    return await chartjsonObject[id]
}

export function createBarChart(info, colors, chart) {
    const percentages = getPercentages(info)
    if (!chart) {
        if (info['total_votes'] == "0") {
            return null
        } else {
            const chart_canvas = document.createElement('canvas')
            chart_canvas.setAttribute('id', 'chart')
            document.getElementById('chart-container').insertAdjacentElement('beforeend', chart_canvas)

            chart = new Chart(
            document.getElementById('chart'),
            {
                type: 'bar',
                data: { 
                    labels: info['parties'],
                    datasets: [
                        {
                            label: null,
                            data: percentages,
                            backgroundColor: findColors(info['parties'], colors)
                        }
                    ]
                },
                options: {
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            max: Math.min((Math.round(Math.max(...percentages)/10)+1)*10, 100)
                        }
                    }
                }
            })
        }
        
    } else {
        chart.type = "bar"
        chart.data.labels = info['parties'];
        chart.data.datasets[0].data = percentages;
        chart.data.datasets[0].backgroundColor = findColors(info['parties'], colors);
        chart.options.scales.y.max = Math.min((Math.round(Math.max(...percentages)/10)+1)*10, 100)
        chart.update();
    }
    return chart   
}

export function createLADChart(info, colors, chart) {
    const data = info.parties.map((party, i) => [
            party,
            info.seats[i],
            colors[party]
        ]);
    
    if (chart) {
        chart.series[0].setData(data, true); // true for redraw
    } else {

        Highcharts.chart('chart-container', {
            chart: {
                type: 'item',
                backgroundColor: 'transparent',
                margin: [0, 0, 0, 0],
                spacing: [0, 0, 0, 0],
                height: '60%',
            },
            title: { text: null },
            subtitle: { text: null },
            legend: { enabled: false },
            tooltip: { enabled: false },
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: { enabled: false },
                        inactive: { opacity: 1 }
                    }
                }
            },
            series: [{
                name: 'Seats',
                keys: ['name', 'y', 'color'],
                data: data,
                center: ['50%', '100%'],
                size: '200%',
                startAngle: -90,
                endAngle: 90,
                dataLabels: {
                    enabled: false
                }
            }],
            credits: { enabled: false }
        });
    }
}

export function getPercentages(info) {
    let pcts = []
    for (let i=0; i<info['votes'].length; i++) {
        let num = Number(info['votes'][i])/info['contested'][i]
        pcts.push(Math.round(num*100/(info['total_votes']/info["seats_up"])))
    }
    return pcts
}
function findColors(parties, colors) {
    let colors_reduced = []
    for (let i=0; i<parties.length; i++) {
        colors_reduced.push(colors[parties[i]])
    }
    return colors_reduced
}