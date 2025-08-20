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

const geojson = await fetch('./wards2.geojson')
const geojsonObject = await geojson.json()

let chart = null

const resultsjson = await fetch('./data/2022/2022-simplified.json')
const resultsjsonObject = await resultsjson.json()

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

function getColorToUse(results) {
  if (results) {
    if (colors[results["control"]]) {
      return colors[results["control"]]
    } else {
      return colors["OTHER"]
    }
  } else {
    return [220,220,220]
  }
}

const vectorLayer = new VectorLayer({
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
  const controling_party = resultsjsonObject[namePromise[0]["values_"]["WD23CD"]]["control"]
  await openPanel(namePromise[0]["values_"])
  if (colors[controling_party]) {
    document.getElementById('colorbar').style.backgroundColor = colors[resultsjsonObject[namePromise[0]["values_"]["WD23CD"]]["control"]]
  } else {
    document.getElementById('colorbar').style.backgroundColor = colors["OTHER"]  // TEMP
  }
  /*} catch {
    document.getElementById('colorbar').style.backgroundColor = "#D8D8D8"  // TEMP
    console.log("COLOR NOT FOUND (no election data)")
  }*/


  //local area = LAD23NM
});

async function openPanel(values) {
  const location = values["LAD23NM"] + ',' + ' ' + resultsjsonObject[values["WD23CD"]]['county_name']
  document.getElementById('local-authority').innerText = ''
  document.getElementById('local-authority').insertAdjacentText('beforeend', location)
  try {
    chart.destroy()
  } catch {
    //not needed
  }
  const chart_data = await getElectionResult(values["WD23CD"])
  chart = createBarChart(chart_data, colors)
  
  document.getElementById('table').innerText = ""
  let table = createTable(chart_data)
  document.getElementById('table').insertAdjacentElement('beforeend', table)

}

const colors = {
  LAB: "#E4003B",
  CON: "#0087DC",
  LD: "#FDBB30",
  GREEN: "#02A95B",
  REF: "aqua",
  MIX: "purple",
  PC: "#005B54",
  IND: "#FF5FDD",
  OTHER: "#964B00"
}