import Chart from 'chart.js/auto'

export async function getElectionResult(id, year) {
    console.log(id)
    console.log(year)
    const url =  './data/' + year.toString() + '/' + year.toString() + '-results.json'
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

export function getPercentages(info) {
    let seat_count = 0
    for (let i=0; i<info['parties'].length; i++) {
        if (info['elected'][info['parties'][i]]) {
            seat_count += Number(info['elected'][info['parties'][i]])
        }
    }
    let tvn = Number(info['total_votes'].replace(/,/g,''))
    let pcts = []
    for (let i=0; i<info['votes'].length; i++) {
        let num = Number(info['votes'][i])*10000/seat_count
        pcts.push(Math.round(num/tvn)/100)
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