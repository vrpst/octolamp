export function getStrokeToUse(results, yearonlyflag, yearonlyyear) {
  if (yearonlyflag && results["election"] != yearonlyyear) {
    return "#808080"
  } else {
    return [70,70,70]
  }
}

export function getColorToUse(results, yearonlyflag, yearonlyyear, colors) {
  if ((results != "NONE" && !yearonlyflag) || yearonlyflag && results["election"] == yearonlyyear) {
    if (colors[results["control"]]) {
      return colors[results["control"]]
    }
  } else {
    return "#999999"
  }
}