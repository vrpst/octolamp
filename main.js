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
import Chart from 'chart.js/auto'
import { getElectionResult } from './charts';
import { createBarChart } from './charts';
import { createTable } from './table';
import { getPercentages } from './charts';

let yearonlyflag = false
let yearonlyyear = 2024

let geojson = null
let geojsonObject = null

let resultsjson = null
let resultsjsonObject = null

let ward_code_code = null

let chart = null

async function updateMap() {
  let geojsonstring = './geodata/wards/wards-' + yearonlyyear.toString() + '.geojson'
  geojson = await fetch(geojsonstring)
  geojsonObject = await geojson.json()

  let resultsjsonstring = './data/' + yearonlyyear.toString() + '/' + yearonlyyear.toString() + '-past-elections.json'
  resultsjson = await fetch(resultsjsonstring)
  resultsjsonObject = await resultsjson.json()

  console.log(geojsonstring)
  console.log(resultsjsonstring)
  
  ward_code_code = "WD" + yearonlyyear.toString().slice(2,4) + "CD"
}

await updateMap(2024)

let vectorSource = new VectorSource({
  features: new GeoJSON().readFeatures(geojsonObject),
});

const selected = new Style({
  stroke: new Stroke({
    width: 1,
  }),
  fill: new Fill({
    color: [0,255,255], //[220,220,220],
  }),
});

const selectClick = new Select({
  style: selected,
});

let col = "#07ee22"
let styleFunction = function(feature, resolution) {
  let code = feature.get(ward_code_code)
  return new Style({
    stroke: new Stroke({
      color: [70,70,70],
      width: 1,
    }),
    fill: new Fill({
      color: getColorToUse(resultsjsonObject[code]), //styleFunction
    })
  })
}

function getColorToUse(results) {
  if ((results != "NONE" && !yearonlyflag) || yearonlyflag && results["election"] == yearonlyyear) {
    if (colors[results["control"]]) {
      return colors[results["control"]]
    }
  } else {
    return "#BCBCBC"
  }
}

let vectorLayer = new VectorLayer({
  source: vectorSource,
  style: styleFunction,
});

vectorLayer.getSource().on('addfeature', function (event) {
  const feature = event.feature;
})

let map = new Map({
  target: 'map',
  layers: [vectorLayer],
  view: new View({
    center: [350000, 510000],
    zoom: 7.1,
  }),
});

console.log(map)


map.addInteraction(selectClick)

map.on('click', async function (evt) {
  const namePromise = await vectorLayer.getFeatures(evt.pixel)

  // GET THE WARD NAME
  try {
    document.getElementById('name').innerText = ''
    document.getElementById('name').insertAdjacentText('beforeend', namePromise[0]["values_"][ward_code_code.slice(0,4)+"NM"])
  } catch ({ name, message }) {
    if (name == "TypeError"){
      console.log("clicked")
    }
  }

  // GET THE COLOR OF THE SEAT
 // try {
  await openPanel(namePromise[0]["values_"])
});

async function openPanel(values) {
  document.getElementById('colorbar').style.backgroundColor = getColorToUse(resultsjsonObject[values[ward_code_code]])
  if (resultsjsonObject[values[ward_code_code]] == "NONE") {
    showNoData()
  } 
  else {
    const location = resultsjsonObject[values[ward_code_code]]['election'] + ', ' + values[ward_code_code] //values["WD23NM"] + ',' + ' ' + resultsjsonObject[values[ward_code_code]]['county_name']
    document.getElementById('local-authority').innerText = ''
    document.getElementById('local-authority').insertAdjacentText('beforeend', location)
    
    try {
      chart.destroy()
    } catch {
      //not needed
    }
    const chart_data = await getElectionResult(values[ward_code_code], resultsjsonObject[values[ward_code_code]]['election'])
    chart = createBarChart(chart_data, colors)
    
    document.getElementById('table').innerText = ""
    let table = createTable(chart_data)
    document.getElementById('table').insertAdjacentElement('beforeend', table)
  }
}

function showNoData() {
    try {
      chart.destroy()
    } catch {}
    document.getElementById('table').innerText = ""
    document.getElementById('local-authority').innerText = "No data"
}

const colors = {
  LAB: "#E4003B",
  CON: "#0087DC",
  LD: "#FDBB30",
  GREEN: "#02A95B",
  REF: "aqua",
  MIX: "#9507DB",
  PC: "#005B54",
  IND: "#F4A8FF",
  OTH: "#964B00"
}

document.getElementById("only").addEventListener('click', function() {
  yearonlyflag = !yearonlyflag
  if (yearonlyflag) {
    document.getElementById("only").innerText = "Show all wards"
  }
  else {
      document.getElementById("only").innerText = yearonlyyear + " only"
  }
  map.removeLayer(vectorLayer)

  vectorLayer = new VectorLayer({
    source: vectorSource,
    style: styleFunction,
  });

  map.addLayer(vectorLayer)
  map.render()

})

// DATERANGE
document.getElementById("daterange").oninput = async function() {
  yearonlyyear = this.value
  console.log(yearonlyyear)

  await updateMap(yearonlyyear)

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