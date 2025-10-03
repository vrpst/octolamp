import { getPercentages } from "./charts"

export function createWardTable(chart_data, colors) {
  const data = createWardTableData(chart_data)
  const table = document.createElement('table')
  table.setAttribute('class', 'text')
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

function createWardTableData(data) {
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

export async function createOtherTable(chart_data, colors, code, areaswitch) {
  const data = await createOtherTableData(chart_data, code, areaswitch)
  const table = document.createElement('table')
  table.setAttribute('class', 'text')
  for (let i=0; i<data.length; i++){
      let table_width = 4
      let row = table.insertRow(-1)
      let color = row.insertCell(0)
      let party = row.insertCell(1)
      let share = row.insertCell(2)
      let change = null
      color.setAttribute('class', 'cell-color')
      party.setAttribute('class', 'cell-standard')
      share.setAttribute('class', 'cell-standard')

      let row_data = [color, party, share]
      if (chart_data['prev_up'] == "DATA") {
        table_width = 3
        row_data = [color, party, share]
      } else {
        change = row.insertCell(3)
        change.setAttribute('class', 'cell-change')
        row_data.push(change)
      }

      for (let j=0; j<table_width; j++) {
          let text_to_insert = document.createTextNode(data[i][j])
          color.style.backgroundColor = colors[chart_data["parties"][i]]
          row_data[j].appendChild(text_to_insert)
      
      }
      if (chart_data['prev_up'] != "DATA") {
        if (row_data[3].innerText.slice(0,1) == "+") {
          row_data[3].setAttribute('class', 'cell-change cell-change-positive')
        } else if (row_data[3].innerText.slice(0,1) == "-") {
          row_data[3].setAttribute('class', 'cell-change cell-change-negative')
        }
      }
  } 
  return table
}   

async function createOtherTableData(data, code, areaswitch) {
  let table_data = []
  for (let i=0; i<data['parties'].length; i++) {
    let row_data = []
    row_data.push('')
    row_data.push(data['parties'][i])
    row_data.push(data['seats'][i])
    if (data['prev_up'] == "INIT") {
      row_data.push('new')
    } else if (data['prev_up'] == "DATA") {
      row_data.push('')
    } else {
      let prev_data = await getChange(data, code, areaswitch)
      if (!(data['parties'][i] in prev_data)) {
        prev_data[data['parties'][i]] = 0
      }
      let party_seat_change = data['seats'][i] - prev_data[data['parties'][i]]
      if (party_seat_change < 0) {
        row_data.push(party_seat_change.toString())        
      } else if (party_seat_change > 0) {
        row_data.push("+" + party_seat_change.toString())
      } else {
        row_data.push(party_seat_change.toString())
      }
    }
    table_data.push(row_data)
  }
  return table_data
}

async function getChange(data, code, areaswitch) {
  const prev = await fetch('./data/' + data['prev_up'] + '/' + areaswitch + '/' + data['prev_up'] + "-" + areaswitch + ".json")
  const prev_object = await prev.json()
  const prev_result = {}
  for (let i=0; i<prev_object[code]['parties'].length; i++) {
    prev_result[prev_object[code]['parties'][i]] = prev_object[code]['seats'][i]
  }
  return prev_result
}