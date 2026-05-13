
export function getStrokeToUse(result, allyears=false, year=null) {
  if (result && (allyears || result["election"] == year)){
    return [70, 70, 70]
  } else {
    return [150, 150, 150]
  }
}

export function getColorToUse(results, colors, ff="noflag", hl="nohl", allyears=false, year=null) {
  if (results){
    console.log(ff, hl, allyears, year, results["change"])
    if (results != "NONE" && (allyears || results["election"] == year)) {  // return gray if no reaults
      if (colors[results["control"]]) {
        if (ff == "filter-none") {  // if no filter get control color
          return getColorFromHighlight(results, colors, hl)
        } else {  // if gain filter, only return party color if gain
          if (results["change"] == "true")
            return getColorFromHighlight(results, colors, hl)
          else {
            return "#D1D1D1"
          }
        }
      }
    } else {
      return "#D1D1D1"
    }
  } else {
    return "#D1D1D1"
  }
}

function getColorFromHighlight(res, col, hl) {
  if (["noc", "plural", "increase", "decrease", "nohl"].includes(hl)){
    const highlights = {  // mapping of highlight to JSON election result
      "noc": "control",
      "plural": "plurality",
      "increase": "inc",
      "decrease": "dec"
    }
    return col[res[highlights[hl]]]
  } else {
    const party = hl.split('-')[1]
    let base_color = col[party]
    let hex = "00"
    if (res["parties"].includes(party)) {
      let prop = (res["seats"][res["parties"].indexOf(party)]/res["total"])**0.6
      hex = Math.round((prop*255)).toString(16)
      if (hex.length == 1) { hex = '0' + hex }
    }
    return base_color + hex
  }
}