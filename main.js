import './map.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON.js'
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Select from 'ol/interaction/Select.js'
import { getElectionResult, createBarChart, createLADChart } from './utils/charts.js';
import { createWardTable, createOtherTable } from './utils/table.js';
import { getStrokeToUse, getColorToUse } from './utils/style.js' 

let yearonlyyear = 2025

let allyearflag = true

let geojson = null
let geojsonObject = null

let resultsjson = null
let simpres = null

let area_code_code = null
let area_name = null

let chart = null
let areaswitch = "cuas"

let vectorSource = null
document.getElementById("daterange").value = 2025 
document.getElementById("radio-cuas").checked = "checked"
document.getElementById("highlight-noc").selected = "selected"
document.getElementById("filter-none").selected = "selected"  

let filterflag = document.getElementById('filter').value
let highlightflag = document.getElementById('highlight').value


// CONSTANTS FOR PARTY COLORS
const colors = {
  LAB: "#E4003B",   //[228, 0, 59],
  CON: "#0087DC",   //[0, 135, 220],
  LD: "#FDBB30",    //[253, 187, 48],
  GREEN: "#02A95B", //[2, 169, 91],
  GRN: "#02A95B",
  REF: "#00BED6",   //[0, 190, 214],
  UKIP: "#9507DB",   //[149, 7, 219],
  SNP: "#FDF38E",
  NOC: "#999999",
  PC: "#005B54",    //[0, 91, 84],
  IND: "#F4A8FF",   //[244, 168, 255],
  OTH: "#F4A8FF",
  INIT: "#D1D1D1",  // used for coloring inc dec when there may not necessarily be data
  DATA: "#D1D1D1",
}

switchArea()

// INITIALISE TEXT ON SLIDER & YEAR ONLY BUTTON
document.getElementById("slider-year").innerText = document.getElementById("daterange").value + " council compositions"
document.getElementById("year-only").innerText = "Show " + document.getElementById("daterange").value + " elections only"

// UPDATE COLORS & INFOBOX ON AREA SWITCH
function switchArea() { //REDO
  clearResult()
  areaswitch = document.querySelector('input[name="area"]:checked').value

  // default setup
  document.getElementById('colorbar').style.backgroundColor = "#D1D1D1"
  document.getElementById('name').innerText = 'Octolamp 0.4.0'
  document.getElementById('placeholder-o').innerText = 'O'
  document.getElementById('table-chart').style = "display: none;"
  if (areaswitch == "wards") {
      colors['OTH'] = "#964B00"
      filterflag = "filter-none"
      highlightflag = "noc"
      document.getElementById("highlight-noc").selected = "selected"
      document.getElementById("filter-none").selected = "selected"  
      document.getElementById('highlight').disabled = true
      document.getElementById('filter').disabled = true
      document.getElementById('local-authority').innerText = 'Viewing wards.'
  } else {
      colors['OTH'] = "#F4A8FF"
      document.getElementById('highlight').disabled = false
      document.getElementById('filter').disabled = false
      if (areaswitch == "lads") {
        document.getElementById('local-authority').innerText = `Viewing local authority districts.`

      } else {
        document.getElementById('local-authority').innerText = `Viewing county councils & unitary authorities.`
      }
  }
}

// UPDATE MAP ON AREA SWITCH
document.getElementById("area-switch").oninput = async function() {
  switchArea()
  await updateMap()  // get new geojson
  vectorSource.clear()
  purgeVectorSource()
  purgeMap()
}

// UPDATE MAP ON HIGHLIGHT CHANGE
document.getElementById("highlight").oninput = async function() {
  highlightflag = document.getElementById('highlight').value
  await updateMap(false)
  purgeMap()
}


// UPDATE MAP ON FILTER CHANGE
document.getElementById("filter").oninput = async function() {
  filterflag = document.getElementById('filter').value
  purgeMap()
}

// UPDATE GEOJSON & JSON DATA BASED ON CHANGE TO INPUT
async function updateMap(geoswitch=true) {
  if (geoswitch) {
    let geojsonstring = '../geodata/' + areaswitch + '/' + areaswitch + '-' + yearonlyyear.toString() + '.geojson'
    geojson = await fetch(geojsonstring)
    geojsonObject = await geojson.json()
  }

  let resultsjsonstring = '../data/' + yearonlyyear.toString() + '/' + areaswitch + "/" + yearonlyyear.toString() + "-" + areaswitch + "-simp.json"
    if (allyearflag) {
      resultsjsonstring = '../data/' + yearonlyyear.toString() + '/' + areaswitch + "/" + yearonlyyear.toString() + "-" + areaswitch + "-simp-past.json"

  }
  resultsjson = await fetch(resultsjsonstring)
  simpres = await resultsjson.json()
  
  if (areaswitch == "wards") {
    area_code_code = "WD" + yearonlyyear.toString().slice(2,4) + "CD"
    area_name = "WD" + yearonlyyear.toString().slice(2,4) + "NM"
  } else if (areaswitch == "lads") {
    area_code_code = "LAD" + yearonlyyear.toString().slice(2,4) + "CD"
    area_name = "LAD" + yearonlyyear.toString().slice(2,4) + "NM"
  } else if (areaswitch == "cuas"){
    area_code_code = "CTYUA" + yearonlyyear.toString().slice(2,4) + "CD"
    area_name = "CTYUA" + yearonlyyear.toString().slice(2,4) + "NM"
  }
}

await updateMap()  // get the data
purgeVectorSource()  // create the source vector map using new data

// STYLING
const selected = new Style({  // style for selected object
  stroke: new Stroke({
    color: [70, 70, 70],
    width: 1,
  }),
  fill: new Fill({
    color: "#ECECEC",
  }),
});

const selectClick = new Select({  // selected object
  style: selected,
});

let styleFunction = function(feature, resolution) {  // determines how to render a given area
  let code = feature.get(area_code_code)
  return new Style({
    stroke: new Stroke({
      color: getStrokeToUse(simpres[code]),
      width: 1,
    }),
    fill: new Fill({
      color: getColorToUse(simpres[code], colors, filterflag, highlightflag), //styleFunction
    })
  })
}

// INITIALIZE MAP & VECTORLAYER
let vectorLayer = new VectorLayer({  // layer object for the vector map
  source: vectorSource,
  style: styleFunction,
});

vectorLayer.getSource().on('addfeature', function (event) {  // add the tiles to the layer
  const feature = event.feature;
})

let map = new Map({  // create map object
  target: 'map',
  layers: [vectorLayer],
  view: new View({
    center: [440000, 350000],
    extent: [-500000, -100000, 1500000, 1300000],
    zoom: 8.2,
    maxZoom: 18,
    enableRotation: false,
  }),
});

// MAP HOVER FUNCTIONALITY
map.on('pointermove', async function (evt) {
  const f = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
  })
  try {
    if (highlightflag != "year" || (highlightflag == "year" && Number(simpres[f['values_'][area_code_code]]['election']) == yearonlyyear)) {
      document.getElementById('hover-name').style.display = "block"
      document.getElementById('hover-name').innerText = f['values_'][area_name]
    } else {  // only hover in certain circumstances
        document.getElementById('hover-name').style.display = "none"
  }} catch {
      document.getElementById('hover-name').style.display = "none"
  }
})

// MAP CLICK FUNCTIONALITY
map.addInteraction(selectClick)
map.on('click', async function (evt) {
  const namePromise = await vectorLayer.getFeatures(evt.pixel)
  const feature = namePromise[0]["values_"]
  try {
    chart.destroy()
  } catch {
      //not needed, if there's no chart there's no chart
  }
  document.getElementById('name').innerText = ''
  document.getElementById('name').insertAdjacentText('beforeend', feature[area_name])
  if (simpres[feature[area_code_code]] && getColorToUse(simpres[feature[area_code_code]], colors, filterflag) != "#D1D1D1") {
    await openPanel(feature[area_code_code], simpres[feature[area_code_code]]['election'])
  } else {
    showNoData(feature[area_code_code], filterflag, simpres[feature[area_code_code]], simpres[feature[area_code_code]])
  }
});

// RENDER INFO PANEL
async function openPanel(code, year_to_find) {
    document.getElementById('table-chart').style = ""
    document.getElementById('placeholder-o').innerText = ""
    let dr = await fetch('../data/' + year_to_find.toString() + '/' + areaswitch + "/" + year_to_find.toString() + "-" + areaswitch + ".json")
    const detailed_results = await dr.json()
    const ctu = getColorToUse(detailed_results[code], colors)
    if (areaswitch != "wards" ) {
      const result = document.getElementById('result')
      if (detailed_results[code]['control'] == "PC") {
        result.style.color = "#FFFFFF"
      } else {
        result.style.color = "#000000"
      }
      result.style.backgroundColor = ctu
      getResultText(detailed_results[code])
    }
    document.getElementById('colorbar').style.backgroundColor = ctu
    document.getElementById('name').insertAdjacentText('beforeend', ", " + detailed_results[code]['election'])
    const la = document.getElementById('local-authority')
    la.innerText = ""

    la.insertAdjacentText('beforeend', getAreaType(detailed_results[code]) + '; ')
    const lac = document.createElement('code')
    lac.setAttribute('id', 'local-authority-code')
    lac.insertAdjacentText('beforeend', code)
    la.insertAdjacentElement('beforeend', lac)

    const chart_data = await getElectionResult(code, detailed_results[code]['election'], areaswitch)
    if (areaswitch == "wards") {      
      chart = createBarChart(chart_data, colors)
    } else {         
      chart = createLADChart(chart_data, colors)
    }
    
    document.getElementById('table').innerText = ""
    let table = null
    if (areaswitch == "wards") {
      table = createWardTable(chart_data, colors)
    } else {
      table = await createOtherTable(chart_data, colors, code, areaswitch)
    }
    document.getElementById('table').insertAdjacentElement('beforeend', table)
}

// PANEL DISPLAY IF NO DATA
function showNoData(code, filter, indata) {
  document.getElementById('colorbar').style.backgroundColor = "#D1D1D1"
  document.getElementById('table').innerText = ""
  document.getElementById('result-text').innerText = ""
  const la_error = document.getElementById('local-authority')
  if (code.charAt(0) == "N") {
    la_error.innerText = "No data available for Northern Ireland"
  } else if (code == "E09000001") {
    la_error.innerText = "No data available for the City Of London"
  } else if (code == "E06000053") {
    la_error.innerText = "No data available for the Isles of Scilly"
  } else {
    if (indata) {  // if there is a result (either an election in that year or an election in previous years)
      if (indata["prev_control"] == "DATA") {  // if there is insufficient data to know if there was a flip or not
        la_error.innerText = "No pre-" + yearonlyyear + " data to determine a gain/flip"
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
      if (!allyearflag) {
        la_error.innerText = "No election in " + yearonlyyear
      } else {
        la_error.innerText = "No data pre-" + yearonlyyear
      }
    }
  }
}

// UPDATE MAP FOR YEAR ONLY BUTTON
document.getElementById("year-only").addEventListener('click', async function() {
  if (allyearflag) {
    document.getElementById("slider-year").innerText = yearonlyyear + " elections only";
    document.getElementById("year-only").innerText = "Show past years"
  }
  else {
      document.getElementById("year-only").innerText = "Show " + yearonlyyear + " elections only"
      document.getElementById("slider-year").innerText = yearonlyyear + " council compositions"
  }
  allyearflag = !allyearflag
  await updateMap(false)
  purgeMap()
})


// UPDATE MAP FOR SLIDER CHANGE IN DATE
document.getElementById("daterange").oninput = async function() {
  yearonlyyear = this.value
  const ward_years = ["2021", "2022", "2023", "2024"]
  if (yearonlyyear == "2020") {
      document.getElementById('daterange').value = "2021"
      yearonlyyear = "2021"
    }
  if (ward_years.includes(yearonlyyear)) {
    document.getElementById('radio-wards').disabled = false
    if (areaswitch != "wards") {
      document.getElementById('wards-label').innerText = 'Wards'
      document.getElementById('wards-label').classList.remove('ward-disable')

    }
  } else {
    document.getElementById('radio-wards').disabled = true
    document.getElementById('wards-label').innerText = "Ward data unavailable for " + yearonlyyear.toString()
    document.getElementById('wards-label').classList.add('ward-disable')
    if (areaswitch == "wards") {
      document.getElementById("radio-lads").checked = "checked"  
      switchArea()  // switch if it's moved while in wards to a year without them
    }

  }
  await updateMap()
  vectorSource.clear()
  purgeVectorSource()
  purgeMap()

  if (allyearflag) {
    document.getElementById("year-only").innerText = "Show " + yearonlyyear + " elections only"
    document.getElementById("slider-year").innerText = this.value + " elections only"
  } else {
    document.getElementById("year-only").innerText = "Show past years"
    document.getElementById("slider-year").innerText = this.value + " elections only"
  }
} 

// PURGE MAP LAYER ON UPDATE
function purgeMap() {
  map.removeLayer(vectorLayer)

  vectorLayer = new VectorLayer({
    source: vectorSource,
    style: styleFunction,
  });

  map.addLayer(vectorLayer)
  map.render()

}

// PURGE VECTORSOURCE FOR TILES
function purgeVectorSource() {
  vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojsonObject),
  });
}

// GET AREA TYPE TO RENDER AREA
function getAreaType(area) {
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
function clearResult() {
    document.getElementById('colorbar').style.backgroundColor = "#D1D1D1"
    document.getElementById('name').innerText = ''
    document.getElementById('local-authority').innerText = ''
    document.getElementById('result-text').innerText = ''
    document.getElementById('result').style = ''
    document.getElementById('table').innerText = ''
    try {
      chart.destroy()
    } catch {
        //not needed, if there's no chart there's no chart
    }
}

// GET RESULT TEXT FOR INFOBOX
function getResultText(info) {
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