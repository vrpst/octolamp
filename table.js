export function createTable(dat) {
    const data = [
        ['X', 'LAB', '23%', '-5%'],
        ['X', 'CON', '20%', '-25%']
    ]
    const table = document.createElement('table')
    for (let i=0; i<data.length; i++){
        let row = table.insertRow(-1)
        let color = row.insertCell(0)
        let party = row.insertCell(1)
        let share = row.insertCell(2)
        let change = row.insertCell(3)

        color.insertAdjacentText("beforeend", 'X')

        let row_data = [color, party, share, change]

        color.insertAdjacentText("beforeend", 'X')
        console.log(data[i])
        console.log("end")
        for (let j=0; j<4; j++) {
            let text_to_insert = document.createTextNode(data[i][j])
            row_data[j].appendChild(text_to_insert)
        }
    } 
    return table
}   

