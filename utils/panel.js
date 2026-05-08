 // GET RESULT TEXT FOR INFOBOX
export function getResultText(info) {
  if (info["flip"] == "true") {
    if (info["control"] == "NOC") {
      document.getElementById('result-text').innerText = info['prev_control'] + " LOSS"
    } else {
      document.getElementById('result-text').innerText = info['control'] + " GAIN FROM " +  info['prev_control']
    } 
  } else if (info["flip"] == "INIT") {
      document.getElementById('result-text').innerText = info['control'] + " INIT"
  } else if (info["flip"] == "DATA") {
    document.getElementById('result-text').innerText = info['control']
  } else {
      document.getElementById('result-text').innerText = info['control'] + " HOLD"
  }   
}

// PANEL DISPLAY IF NO DATA
export function showNoData(code, filter, indata) {
  document.getElementById('colorbar').style.backgroundColor = "#D1D1D1"
  document.getElementById('table').innerText = ""
  document.getElementById('result-text').innerText = ""
  const la_error = document.getElementById('local-authority')
  // custom exceptions for NI, COL, Scilly
  if (code.charAt(0) == "N") {
    la_error.innerText = "No data available for Northern Ireland"
  } else if (code == "E09000001") {
    la_error.innerText = "No data available for the City Of London"
  } else if (code == "E06000053") {
    la_error.innerText = "No data available for the Isles of Scilly"
  } else {
    if (indata) {  // if there is a result (either an election in that year or an election in previous years)
      if (indata["prev_control"] == "DATA") {  // if there is insufficient data to know if there was a flip or not
        la_error.innerText = "No pre-" + slider_year + " data to determine a gain/flip"
      } else if (indata["prev_control"] == "INIT") {  // if the council was first elected then
          la_error.innerText = "First election to new council; excluded from flips/gains"
      } else {
        if (filter == "filter-gain") {
          la_error.innerText = "No change in control in most recent election (" + indata["election"] + ")"
        } else if (filter == "filter-flip" && indata["change"] == "gain") {
          la_error.innerText = "Control changed but not flipped in most recent election (" + indata["election"] + ")"
        } else {
          la_error.innerText = "Not flipped in most recent election (" + indata["election"] + ")"
        }
      }
    } else {
      if (!all_years) {
        la_error.innerText = "No election in " + slider_year
      } else {
        la_error.innerText = "No data pre-" + slider_year
      }
    }
  }
}

// GET AREA TYPE TO RENDER AREA
export function getAreaType(area, areaswitch) {
  const types = {
    "U": "Unitary authority",
    "D": "District council",
    "C": "County council",
    "M": "Metropolitan borough",
    "L": "London borough",
    "S": "Scottish council",
    "W": "Welsh unitary"}
  if (areaswitch != "wards") {
    return types[area['type']]
  } else {
    return "Ward"
  }
}

// CLEAR PANEL
export function clearResult() {
    document.getElementById('colorbar').style.backgroundColor = "#D1D1D1"
    document.getElementById('name').innerText = ''
    document.getElementById('local-authority').innerText = ''
    document.getElementById('result-text').innerText = ''
    document.getElementById('result').style = ''
    document.getElementById('chart-container').innerText = ''
    document.getElementById('table').innerText = ''
}