export function getStrokeToUse(results, code) {
  if (results[code]){
    results = results[code]
    return [70, 70, 70]
  } else {
    return "#808080"
  }

}

export function getColorToUse(results, colors, ff="noflag", hl="nohl") {
  console.log("hf is", hl)
  if (results){
    if (results != "NONE") {
      if (colors[results["control"]]) {
        if (ff == "filter-none") {
          return getColorFromHighlight(results, colors, hl)
        } else if (ff == "filter-gain") {
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
  const highlights = {
    "noc": "control",
    "plural": "plurality",
    "increase": "inc",
    "decrease": "dec"
  }
  console.log("ababa", hl, highlights[hl])
  return col[res[highlights[hl]]]
}