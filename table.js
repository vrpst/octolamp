export function createTable(data) {
    console.log("DATA")
    console.log(data)
    const table = document.createElement('table')
    for (let i=0; i<data.length; i++){
        let row = table.insertRow(-1)
        let color = row.insertCell(0)
        let party = row.insertCell(1)
        let share = row.insertCell(2)
        let change = row.insertCell(3)
        color.setAttribute('class', 'cell-color')
        party.setAttribute('class', 'cell-standard')
        share.setAttribute('class', 'cell-standard')
        change.setAttribute('class', 'cell-change')

        let row_data = [color, party, share, change]

        for (let j=0; j<4; j++) {
            let text_to_insert = document.createTextNode(data[i][j])
            console.log(colors[data[i][1]])
            color.style.backgroundColor = colors[data[i][1]]
            row_data[j].appendChild(text_to_insert)
        }
    } 
    return table
}   

const colors = {
  LAB: "#E4003B",
  CON: "#0087DC",
  LD: "#FDBB30",
  GREEN: "#02A95B",
  REF: "aqua",
  MIX: "purple",
  PC: "#005B54",
  IND: "#FF5FDD",
  OTH: "#000000"
}