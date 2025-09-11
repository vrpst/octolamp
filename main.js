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

const geojson = await fetch('./geodata/wards/wards-2024.geojson')
const geojsonObject = await geojson.json()

let chart = null

let resultsjson = await fetch('./data/2024/2024-past-elections.json')
let resultsjsonObject = await resultsjson.json()

const vectorSource = new VectorSource({
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

let styleFunction = function(feature, resolution) {
  let code = feature.get("WD23CD")
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

let yearonlyflag = false
let yearonlyyear = 2024

function getColorToUse(results) {
  console.log(resultsjsonObject, "ASDASDAD")
  console.log(results)
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

const map = new Map({
  target: 'map',
  layers: [vectorLayer],
  view: new View({
    center: [350000, 510000],
    zoom: 7.1,
  }),
});


map.addInteraction(selectClick)

map.on('click', async function (evt) {
  const namePromise = await vectorLayer.getFeatures(evt.pixel)

  // GET THE WARD NAME
  try {
    document.getElementById('name').innerText = ''
    document.getElementById('name').insertAdjacentText('beforeend', namePromise[0]["values_"]["WD23NM"])
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
  console.log(getColorToUse(resultsjsonObject[values["WD23CD"]]))
  document.getElementById('colorbar').style.backgroundColor = getColorToUse(resultsjsonObject[values["WD23CD"]])
  if (resultsjsonObject[values["WD23CD"]] == "NONE") {
    showNoData()
  } 
  else {
    const location = resultsjsonObject[values["WD23CD"]]['election'] + ', ' + values["WD23CD"] //values["WD23NM"] + ',' + ' ' + resultsjsonObject[values["WD23CD"]]['county_name']
    document.getElementById('local-authority').innerText = ''
    document.getElementById('local-authority').insertAdjacentText('beforeend', location)
    
    try {
      chart.destroy()
    } catch {
      //not needed
    }
    const chart_data = await getElectionResult(values["WD23CD"], resultsjsonObject[values["WD23CD"]]['election'])
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
})

document.getElementById("daterange").oninput = function() {
  yearonlyyear = this.value
  console.log(yearonlyyear)
  if (!yearonlyflag) {
    document.getElementById("only").innerText = yearonlyyear + " only"
  }
  document.getElementById("slider-year").innerText = "Year: " + this.value;
} 