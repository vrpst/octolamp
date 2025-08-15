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
import { createStyleFunction } from 'ol/Feature';

const geojson = await fetch('./wards2.geojson')
const geojsonObject = await geojson.json()


const resultsjson = await fetch('./2022-simplified.json')
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
      return [137,81,41]
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
  try {
    const namePromise = await vectorLayer.getFeatures(evt.pixel)
    document.getElementById('name').innerText = ''
    console.log(namePromise[0]["values_"])
    document.getElementById('name').insertAdjacentText('beforeend', namePromise[0]["values_"]["WD23NM"])
    console.log(colors[resultsjsonObject[namePromise[0]["values_"]["WD23CD"]]["control"]])
    document.getElementById('colorbar').style.backgroundColor = colors[resultsjsonObject[namePromise[0]["values_"]["WD23CD"]]["control"]]
  } catch ({ name, message }) {
    if (name == "TypeError"){
      console.log("clicked")
    }
  }

  //local area = LAD23NM
});

const colors = {
  LAB: "#e4003b",
  CON: "#0087dc",
  LD: "#fdbb30",
  GREEN: "#02a95b",
  REF: "aqua",
  MIX: "purple",
  PC: "#005b54",
  IND: "#FF5FD"
}