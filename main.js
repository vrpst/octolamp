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

// DEFAULT PARAMETERS
let slider_year = 2025

let all_years = true  // show all years vs just the current year

let fetching_geojson = null  // placeholder when fetching geoJSON
let geoJSON = null  // actual JSON object

let fetching_results = null  // placeholder when fetching results JSON
let simple_results = null  // actual results JSON

let area_code_code = null  // code for area code (e.g WD or LAD)
let area_name = null  // area name

let chart = null
let areaswitch = "cuas"  // switch between areas for JSON

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
  document.getElementById('name').innerText = 'Octolamp'
  document.getElementById('placeholder-o').innerText = 'O'
  document.getElementById('table-chart').style = "display: none;"

  try {
    chart.destroy()
    chart = null
  } catch {console.error("Failed to destroy chart on area switch")}

  if (areaswitch == "wards") {  // if wards now being used
      colors['OTH'] = "#964B00"  // change the color of others
      filterflag = "filter-none"  // reset filter
      highlightflag = "noc"  // set the highlight to control (inc. NOC)
      // set parameters
      document.getElementById("highlight-noc").selected = "selected"
      document.getElementById("filter-none").selected = "selected"  
      document.getElementById('highlight').disabled = true  // disable highlight and filtering
      document.getElementById('filter').disabled = true
      document.getElementById('local-authority').innerText = 'Viewing wards.'
  } else {
      colors['OTH'] = "#F4A8FF"  // otherwise change OTH color
      document.getElementById('highlight').disabled = false  // reenable filters and highlights
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
  await updateMap()  // get new fetching_geojson
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
  if (geoswitch) {  // if the map is being updated on a change in geography
    let geojsonstring = '../geodata/' + areaswitch + '/' + areaswitch + '-' + slider_year.toString() + '.fetching_geojson'
    fetching_geojson = await fetch(geojsonstring)
    geoJSON = await fetching_geojson.json()  // new geoJSON
  }

  let fetching_resultsstring = '../data/' + slider_year.toString() + '/' + areaswitch + "/" + slider_year.toString() + "-" + areaswitch + "-simp.json"
    if (all_years) {
      fetching_resultsstring = '../data/' + slider_year.toString() + '/' + areaswitch + "/" + slider_year.toString() + "-" + areaswitch + "-simp-past.json"

  }
  fetching_results = await fetch(fetching_resultsstring)
  simple_results = await fetching_results.json()  // new data JSON
  
  // create the new area code code
  if (areaswitch == "wards") {
    area_code_code = "WD" + slider_year.toString().slice(2,4) + "CD"
    area_name = "WD" + slider_year.toString().slice(2,4) + "NM"
  } else if (areaswitch == "lads") {
    area_code_code = "LAD" + slider_year.toString().slice(2,4) + "CD"
    area_name = "LAD" + slider_year.toString().slice(2,4) + "NM"
  } else if (areaswitch == "cuas"){
    area_code_code = "CTYUA" + slider_year.toString().slice(2,4) + "CD"
    area_name = "CTYUA" + slider_year.toString().slice(2,4) + "NM"
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
      color: getStrokeToUse(simple_results[code]),
      width: 1,
    }),
    fill: new Fill({
      color: getColorToUse(simple_results[code], colors, filterflag, highlightflag), //styleFunction
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
      document.getElementById('hover-name').style.display = "block"
      document.getElementById('hover-name').innerText = f['values_'][area_name]
  } catch {
      document.getElementById('hover-name').style.display = "none"
  }
})

// MAP CLICK FUNCTIONALITY
map.addInteraction(selectClick)
map.on('click', async function (evt) {
  const name_promise = await vectorLayer.getFeatures(evt.pixel)
  const feature = name_promise[0]["values_"]  // get the feature
  document.getElementById('name').innerText = ''
  document.getElementById('name').insertAdjacentText('beforeend', feature[area_name])  // show the name in the panel
  if (simple_results[feature[area_code_code]] && getColorToUse(simple_results[feature[area_code_code]], colors, filterflag) != "#D1D1D1") {  // if a valid result
    await openPanel(feature[area_code_code], simple_results[feature[area_code_code]]['election'])
  } else {
    showNoData(feature[area_code_code], filterflag, simple_results[feature[area_code_code]], simple_results[feature[area_code_code]])
  }
});

// RENDER INFO PANEL
async function openPanel(code, year_to_find) {
    document.getElementById('table-chart').style = ""
    document.getElementById('placeholder-o').innerText = ""
    let dr = await fetch('../data/' + year_to_find.toString() + '/' + areaswitch + "/" + year_to_find.toString() + "-" + areaswitch + ".json")
    const detailed_results = await dr.json()
    const ctu = getColorToUse(detailed_results[code], colors)
    if (areaswitch != "wards" ) {  // if pie chart, make sure Plaid are on white
      const result = document.getElementById('result')
      if (detailed_results[code]['control'] == "PC") {
        result.style.color = "#FFFFFF"
      } else {
        result.style.color = "#000000"
      }
      result.style.backgroundColor = ctu
      getResultText(detailed_results[code])
    }
    document.getElementById('colorbar').style.backgroundColor = ctu  // set top color bar
    document.getElementById('name').insertAdjacentText('beforeend', ", " + detailed_results[code]['election'])  // insert name and code
    const la = document.getElementById('local-authority')
    la.innerText = ""

    la.insertAdjacentText('beforeend', getAreaType(detailed_results[code]) + '; ')  //  insert area type
    const lac = document.createElement('code')
    lac.setAttribute('id', 'local-authority-code')
    lac.insertAdjacentText('beforeend', code)  // insert area code
    la.insertAdjacentElement('beforeend', lac)

    const chart_data = await getElectionResult(code, detailed_results[code]['election'], areaswitch)
    if (areaswitch == "wards") {  // bar chart if wards, pie chard if not
      console.log(chart)
      chart = createBarChart(chart_data, colors, chart)
    } else {         
      chart = createLADChart(chart_data, colors, chart)
    }
    
    let table = null
    if (areaswitch == "wards") {  // create table
      table = createWardTable(chart_data, colors)
    } else {
      table = await createOtherTable(chart_data, colors, code, areaswitch)
    }
    document.getElementById('table').innerText = ""
    document.getElementById('table').insertAdjacentElement('beforeend', table)
}

// PANEL DISPLAY IF NO DATA
function showNoData(code, filter, indata) {
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

// UPDATE MAP FOR YEAR ONLY BUTTON
document.getElementById("year-only").addEventListener('click', async function() {
  if (all_years) {
    document.getElementById("slider-year").innerText = slider_year + " elections only";
    document.getElementById("year-only").innerText = "Show past years"
  }
  else {
      document.getElementById("slider-year").innerText = slider_year + " council compositions"
      document.getElementById("year-only").innerText = "Show " + slider_year + " elections only"
  }
  all_years = !all_years
  await updateMap(false)
  purgeMap()
})


// UPDATE MAP FOR SLIDER CHANGE IN DATE
document.getElementById("daterange").oninput = async function() {
  slider_year = this.value
  const ward_years = ["2021", "2022", "2023", "2024"]
  if (slider_year == "2020") { // no elections in 2020
      document.getElementById('daterange').value = "2021"
      slider_year = "2021"
    }
  if (ward_years.includes(slider_year)) {
    document.getElementById('radio-wards').disabled = false
    if (areaswitch != "wards") {
      document.getElementById('wards-label').innerText = 'Wards'
      document.getElementById('wards-label').classList.remove('ward-disable')

    }
  } else {  // if no ward data, move to LADs and update ward button
    document.getElementById('radio-wards').disabled = true
    document.getElementById('wards-label').innerText = "Ward data unavailable for " + slider_year.toString()
    document.getElementById('wards-label').classList.add('ward-disable')
    if (areaswitch == "wards") {
      document.getElementById("radio-lads").checked = "checked"  
      switchArea()  // switch if it's moved while in wards to a year without them
    }

  }
  // update everything
  await updateMap()
  vectorSource.clear()
  purgeVectorSource()
  purgeMap()

  // year-only bar updates
  if (all_years) {
    document.getElementById("year-only").innerText = "Show " + slider_year + " elections only"
    document.getElementById("slider-year").innerText = this.value + " council compositions"
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
    features: new GeoJSON().readFeatures(geoJSON),
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