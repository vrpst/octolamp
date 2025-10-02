import Chart from 'chart.js/auto'

export async function getElectionResult(id, year, sw) {
    console.log("GER", id, year, sw)
    let url_end = ""
    if (sw == "wards") {
        url_end = "-results.json"
    } else if (sw == "lads") {
        url_end = "-lads.json"
    } else if (sw == "cuas") {
        url_end = "-cuas.json"
    }
    const url =  './data/' + year.toString() + '/' + year.toString() + url_end
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
    console.log(colors)
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