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
import { getResultText, showNoData, getAreaType, clearResult } from './utils/panel.js';

// DEFAULT PARAMETERS
let slider_year = 2025

let all_years = true  // show all years vs just the current year

let geoJSON = await (await fetch('../geodata/cuas/cuas-2025.geojson')).json()   // actual results JSON  // actual JSON object
let simple_results = await (await fetch('../data/2025/cuas/2025-cuas-simp-past.json')).json() // actual results JSON

let area_code_code = "CTYUA25CD"  // code for area code (e.g WD or LAD)
let area_name = "CTYUA25NM"  // area name

let chart = null
let areaswitch = "cuas"  // switch between areas for JSON

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
  } catch {console.warn("Failed to destroy chart on area switch")}

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
}

// UPDATE MAP ON HIGHLIGHT CHANGE
document.getElementById("highlight").oninput = async function() {
  highlightflag = document.getElementById('highlight').value
  await updateMap(false)
}

// UPDATE MAP ON FILTER CHANGE
document.getElementById("filter").oninput = async function() {
  filterflag = document.getElementById('filter').value
  await updateMap(false)
}

// UPDATE GEOJSON & JSON DATA BASED ON CHANGE TO INPUT
async function updateMap(geoswitch=true) {
  let results_string = `../data/${slider_year.toString()}/${areaswitch}/"${slider_year.toString()}-${areaswitch}-simp.json`
    if (all_years) {
      results_string = `../data/${slider_year.toString()}/${areaswitch}/${slider_year.toString()}-${areaswitch}-simp-past.json`
  }

  simple_results = await (await fetch(results_string)).json()
  
  // create the new area code code
  const yearSuffix = slider_year.toString().slice(-2);
  const prefix = { wards: "WD", lads: "LAD", cuas: "CTYUA" }[areaswitch];

  area_code_code = `${prefix}${yearSuffix}CD`;
  area_name = `${prefix}${yearSuffix}NM`;

  if (geoswitch) {  // if the map is being updated on a change in geography
    let geojsonstring = `../geodata/${areaswitch}/${areaswitch}-${slider_year.toString()}.geojson`
    geoJSON = await (await fetch(geojsonstring)).json()

    try {
        vectorSource.clear()
    } catch {
      console.warn("No vectorSource to clear.")
    }
    vectorSource.addFeatures(new GeoJSON().readFeatures(geoJSON));

  }
  vectorLayer.changed();
}

// STYLING
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

let selectedStyle = function(feature) {
  let code = feature.get(area_code_code)
  return new Style({  // style for selected object
    stroke: new Stroke({
      color: [70, 70, 70],
      width: 1,
    }),
    fill: new Fill({
      color: getColorToUse(simple_results[code], colors, filterflag, highlightflag) + "20",
    })
  })
}

const selectClick = new Select({  // selected object
  style: selectedStyle,
});


// INITIALIZE MAP & VECTORLAYER

let vectorSource = new VectorSource({
  features: new GeoJSON().readFeatures(geoJSON),
});

let vectorLayer = new VectorLayer({  // layer object for the vector map
  source: vectorSource,
  style: styleFunction,

  updateWhileAnimating: true,
  updateWhileInteracting: true,
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
selectClick.on('select', async function (evt) {
  const feature = evt.selected[0];

  if (!feature) return;

  const geometry = feature.getGeometry();
  const extent = geometry.getExtent();
  map.getView().fit(extent, {
    duration: 500,
    padding: [200, 200, 200, 200],
    maxZoom: 12 // stop it zooming too far in
  });
  const feature_data = feature.getProperties();

  document.getElementById('name').innerText = '';
  document.getElementById('name').insertAdjacentText('beforeend', feature_data[area_name]);

  if (simple_results[feature_data[area_code_code]] && getColorToUse(simple_results[feature_data[area_code_code]], colors, filterflag) != "#D1D1D1") {
    await openPanel(feature_data[area_code_code], simple_results[feature_data[area_code_code]]['election']);
  } else {
    showNoData(feature_data[area_code_code], filterflag, simple_results[feature_data[area_code_code]], simple_results[feature_data[area_code_code]]);
  }
});

// RENDER INFO PANEL
async function openPanel(code, year_to_find) {
    document.getElementById('table-chart').style = ""
    document.getElementById('placeholder-o').innerText = ""
    let dr = await fetch(`../data/${year_to_find.toString()}/${areaswitch}/${year_to_find.toString()}-${areaswitch}.json`)
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

    la.insertAdjacentText('beforeend', getAreaType(detailed_results[code], areaswitch) + '; ')  //  insert area type
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

// UPDATE MAP FOR YEAR ONLY BUTTON
document.getElementById("year-only").addEventListener('click', async function() {
  if (all_years) {
    document.getElementById("slider-year").innerText = `${slider_year} elections only`;
    document.getElementById("year-only").innerText = "Show past years"
  }
  else {
      document.getElementById("slider-year").innerText = `${slider_year} council compositions`
      document.getElementById("year-only").innerText = "Show " + slider_year + " elections only"
  }
  all_years = !all_years
  await updateMap(false)
})


// UPDATE MAP FOR SLIDER CHANGE IN DATE
document.getElementById("daterange").oninput = async function() {
  slider_year = this.value
  const ward_years = ["2021", "2022", "2023", "2024", "2025"]
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
    document.getElementById('wards-label').innerText = `Ward data unavailable for ${slider_year.toString()}`
    document.getElementById('wards-label').classList.add('ward-disable')
    if (areaswitch == "wards") {
      document.getElementById("radio-lads").checked = "checked"  
      switchArea()  // switch if it's moved while in wards to a year without them
    }

  }

  // update everything
  await updateMap()

  // year-only bar updates
  if (all_years) {
    document.getElementById("year-only").innerText = `Show ${slider_year} elections only`
    document.getElementById("slider-year").innerText = `${this.value} council compositions`
  } else {
    document.getElementById("year-only").innerText = "Show past years"
    document.getElementById("slider-year").innerText = `${this.value} elections only`
  }
}