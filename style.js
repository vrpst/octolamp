export function getStrokeToUse(results, code, yearonlyflag, yearonlyyear) {
  if (results[code]){
    results = results[code]
    return [70, 70, 70]
  } else {
    return "#808080"
  }

}

export function getColorToUse(results, colors) {
  if (results){
    if (results != "NONE") {
      if (colors[results["control"]]) {
        return colors[results["control"]]
      }
    } else {
      return "#D1D1D1"
    }
  } else {
    return "#D1D1D1"
  }
}