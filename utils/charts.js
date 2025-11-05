import Chart from 'chart.js/auto'

export async function getElectionResult(id, year, sw) {
    const url =  '../data/' + year.toString() + '/' + sw +'/' + year.toString() + '-' + sw + '.json'
    console.log(url)
    const chartjson = await fetch(url)
    const chartjsonObject = await chartjson.json()
    return await chartjsonObject[id]
}

export function createBarChart(info, colors) {
    if (info['total_votes'] == "0") {
        return "UNOPPOSED"
    } else {
        const percentages = getPercentages(info)
        const chart = new Chart(
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
        return chart
    }
    
}

export function createLADChart(info, colors) {
    const chart = new Chart(
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