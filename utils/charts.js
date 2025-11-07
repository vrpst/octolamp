import Chart from 'chart.js/auto'

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
    if (!chart) {
        chart = new Chart(
            document.getElementById('chart'),
            {
                type: 'doughnut',
                data: { 
                    labels: info['parties'],
                    datasets: [
                        {
                            label: null,
                            data: info["seats"],
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
                }
        })   
    } else {
        chart.data.labels = info['parties'];
        chart.data.datasets[0].data = info['seats'];
        chart.data.datasets[0].backgroundColor = findColors(info['parties'], colors);
        chart.update();
    }
    return chart
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