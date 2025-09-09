import { getPercentages } from "./charts"

export function createTable(chart_data) {
    const data = createTableData(chart_data)
    const table = document.createElement('table')
    for (let i=0; i<data.length; i++){
        let row = table.insertRow(-1)
        if (data[i][1].includes("*")) {
            row.setAttribute('class', 'row-winner')
        }
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
            color.style.backgroundColor = colors[chart_data["parties"][i]]
            row_data[j].appendChild(text_to_insert)
        }
    } 
    return table
}   

function createTableData(data) {
  let table_data = []
  const percentages = getPercentages(data)
  for (let i=0; i<data['parties'].length; i++) {
    let row_data = []
    row_data.push('')
    if (data['elected'][data['parties'][i]]){
      row_data.push(data['parties'][i] + "*".repeat(Number(data['elected'][data['parties'][i]])))
    } else {
        row_data.push(data['parties'][i])

    }
    row_data.push(percentages[i].toString() + "%")
    row_data.push("change")
    table_data.push(row_data)
  }
  return table_data
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
  OTH: "#964B00"
}