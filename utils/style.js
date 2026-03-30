
export function getStrokeToUse(result) {
  if (result){
    return [70, 70, 70]
  } else {
    return [150, 150, 150]
  }
}

export function getColorToUse(results, colors, ff="noflag", hl="nohl") {
  if (results){
    if (results != "NONE") {  // return gray if no reaults
      if (colors[results["control"]]) {
        if (ff == "filter-none") {  // if no filter get control color
          return getColorFromHighlight(results, colors, hl)
        } else if (ff == "filter-gain") {  // if gain filter, only return party color if gain
          if (results["change"] == "gain" || results["change"] == "flip")
            return getColorFromHighlight(results, colors, hl)
          else {
            return "#D1D1D1"
          }
        } else if (ff == "filter-flip") {
          if (results["change"] == "flip") {
            return getColorFromHighlight(results, colors, hl)
          } else {
            return "#D1D1D1"
          }
        } else {
            return colors[results["control"]]
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
  const highlights = {  // mapping of highlight to JSON election result
    "noc": "control",
    "plural": "plurality",
    "increase": "inc",
    "decrease": "dec"
  }
  return col[res[highlights[hl]]]
}