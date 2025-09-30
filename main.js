import './style.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import Fill from 'ol/style/Fill';
import Select from 'ol/interaction/Select.js';
import { getElectionResult, createBarChart, createLADChart } from './charts';
import { createWardTable, createLADTable } from './table';
import { getStrokeToUse, getColorToUse } from '/style' 

let yearonlyflag = false
let yearonlyyear = 2025

let geojson = null
let geojsonObject = null

let resultsjson = null
let resultsjsonObject = null

let area_code_code = null
let area_name = null

let chart = null
let ladswards = "lads"

let vectorSource = null
document.getElementById("daterange").value = 2025  

const colors = {
  LAB: "#E4003B",   //[228, 0, 59],
  CON: "#0087DC",   //[0, 135, 220],
  LD: "#FDBB30",    //[253, 187, 48],
  GREEN: "#02A95B", //[2, 169, 91],
  GRN: "#02A95B",
  REF: "#00BED6",   //[0, 190, 214],
  UKIP: "#9507DB",   //[149, 7, 219],
  SNP: "#FDF38E",
  MIX: "#777777",
  NOC: "#777777",
  PC: "#005B54",    //[0, 91, 84],
  IND: "#F4A8FF",   //[244, 168, 255],
  OTH: "#F4A8FF",
}


document.getElementById("slider-year").innerText = "Year: " + document.getElementById("daterange").value
document.getElementById("only").innerText = document.getElementById("daterange").value + " only"

function ladWardSwitch() {
  if (ladswards == "lads") {
    ladswards = "wards"
    document.getElementById('lad-ward-button').innerText = ('View LAD data for ' + yearonlyyear.toString())
    colors['OTH'] = "#964B00"

  } else {
    ladswards = "lads"
    document.getElementById('lad-ward-button').innerText = ('View ward data for ' + yearonlyyear.toString())
    colors['OTH'] = "#F4A8FF"
  }
}
async function updateMap() {
  let geojsonstring = './geodata/' + ladswards + '/' + ladswards + '-' + yearonlyyear.toString() + '.geojson'
  geojson = await fetch(geojsonstring)
  geojsonObject = await geojson.json()

  let results_end = null  // get the right results file
  if (ladswards == "lads") {
    if (yearonlyflag) {
      results_end = "-lads.json"
    } else {
      results_end = "-lads-past-elections.json"
    }
  }
  else {
    if (yearonlyflag) {
      results_end = "-simplified.json"
    } else {
      results_end = "-past-elections.json"
    }
  }
  let resultsjsonstring = './data/' + yearonlyyear.toString() + '/' + yearonlyyear.toString() + results_end
  resultsjson = await fetch(resultsjsonstring)
  resultsjsonObject = await resultsjson.json()
  
  if (ladswards == "wards") {
    area_code_code = "WD" + yearonlyyear.toString().slice(2,4) + "CD"
    area_name = "WD" + yearonlyyear.toString().slice(2,4) + "NM"
  } else {
    area_code_code = "LAD" + yearonlyyear.toString().slice(2,4) + "CD"
    area_name = "LAD" + yearonlyyear.toString().slice(2,4) + "NM"

  }
}

await updateMap()  // get the data
purgeVectorSource()  // create the source vector map using new data

const selected = new Style({  // style for selected object
  stroke: new Stroke({
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
      color: getStrokeToUse(resultsjsonObject, code, yearonlyflag, yearonlyyear),
      width: 1,
    }),
    fill: new Fill({
      color: getColorToUse(resultsjsonObject[code], colors), //styleFunction
    })
  })
}

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
  }),
});

// MAP HOVER FUNCTIONALITY
map.on('pointermove', async function (evt) {
  const f = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
  })
  try {
    if ((!yearonlyflag) || (yearonlyflag && Number(resultsjsonObject[f['values_'][area_code_code]]['election']) == yearonlyyear)) {
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
  console.log(ladswards)
  const namePromise = await vectorLayer.getFeatures(evt.pixel)
  const feature = namePromise[0]["values_"]

  try {
    document.getElementById('name').innerText = ''

    document.getElementById('name').insertAdjacentText('beforeend', feature[area_name])
  } catch ({ name, message }) {
    if (name == "TypeError"){
      console.log("clicked")
    }
  }
 // try {
  await openPanel(feature[area_code_code])
});

// RENDER INFO PANEL
async function openPanel(code) {
  if ((!yearonlyflag) || (yearonlyflag && code in resultsjsonObject)) {  // if any year OR only one year and the location is in the results
    document.getElementById('colorbar').style.backgroundColor = getColorToUse(resultsjsonObject[code], colors, area_code_code)
    if (resultsjsonObject[code] == "NONE") {
      showNoData()
    } 
    else {
      const location = resultsjsonObject[code]['election'] + ', ' + code //values["WD23NM"] + ',' + ' ' + resultsjsonObject[values[area_code_code]]['county_name']
      document.getElementById('local-authority').innerText = ''
      document.getElementById('local-authority').insertAdjacentText('beforeend', location)
      
      try {
        chart.destroy()
      } catch {
        //not needed
      }
      const chart_data = await getElectionResult(code, resultsjsonObject[code]['election'], ladswards)
      if (ladswards == "wards") {
        chart = createBarChart(chart_data, colors)
      } else {
        chart = createLADChart(chart_data, colors)
      }
      
      document.getElementById('table').innerText = ""
      let table = null
      if (ladswards == "wards") {
        table = createWardTable(chart_data, colors)
      } else {
        table = await createLADTable(chart_data, colors, code)
      }
      document.getElementById('table').insertAdjacentElement('beforeend', table)
    }
  } else {
      showNoData()
      document.getElementById('local-authority').innerText = "No election in " + yearonlyyear.toString()
  }
}

// DON'T SHOW ANYTHING IF NO DATA
function showNoData() {
    try {
      chart.destroy()
    } catch {}
    document.getElementById('colorbar').style.backgroundColor = "#D1D1D1"
    document.getElementById('table').innerText = ""
    document.getElementById('local-authority').innerText = "No data"
}

// UPDATE MAP FOR BUTTON SHOWING ONLY RESULTS FROM THAT YEAR
document.getElementById("only").addEventListener('click', async function() {
  yearonlyflag = !yearonlyflag
  if (yearonlyflag) {
    document.getElementById("only").innerText = "Show all years"  }
  else {
      document.getElementById("only").innerText = yearonlyyear + " only"
  }
  await updateMap()
  purgeMap()
})

// UPDATE MAP BY FLIPPING WARDS AND LADS
document.getElementById("lad-ward-button").addEventListener('click', async function() {
  ladWardSwitch()
  await updateMap()  // why??
  vectorSource.clear()
  purgeVectorSource()
  purgeMap()

})

// UPDATE MAP FOR CHANGE IN DATE
document.getElementById("daterange").oninput = async function() {
  yearonlyyear = this.value
  const ward_years = ["2021", "2022", "2023", "2024"]
  if (yearonlyyear == "2020") {
      document.getElementById('daterange').value = "2021"
      yearonlyyear = "2021"
    }
  if (ward_years.includes(yearonlyyear)) {
    document.getElementById('lad-ward-button').disabled = false
    if (ladswards == "wards") {
      document.getElementById('lad-ward-button').innerText = ('View LAD data for ' + yearonlyyear.toString())
    } else {
      document.getElementById('lad-ward-button').innerText = ('View ward data for ' + yearonlyyear.toString())
    }
  } else {
    document.getElementById('lad-ward-button').disabled = true
    if (ladswards == "wards") {
      ladWardSwitch()  // switch if it's moved while in wards to a year without them
    }
    document.getElementById('lad-ward-button').innerText = "Ward data unavailable for " + yearonlyyear.toString()

  }
  await updateMap()

  vectorSource.clear()
  vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojsonObject),
  });

  map.removeLayer(vectorLayer)

  vectorLayer = new VectorLayer({
    source: vectorSource,
    style: styleFunction,
  });

  vectorLayer.getSource().on('addfeature', function (event) {
    const feature = event.feature;
  })

  map.addLayer(vectorLayer)
  map.render()

  if (!yearonlyflag) {
    document.getElementById("only").innerText = yearonlyyear + " only"
  }
  document.getElementById("slider-year").innerText = "Year: " + this.value;
} 

function purgeMap() {
  map.removeLayer(vectorLayer)

  vectorLayer = new VectorLayer({
    source: vectorSource,
    style: styleFunction,
  });

  map.addLayer(vectorLayer)
  map.render()

}

function purgeVectorSource() {
  vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojsonObject),
  });
}