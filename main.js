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

const geojson = await fetch('./wards2.geojson')
const geojsonObject = await geojson.json()
console.log(geojsonObject)

const vectorSource = new VectorSource({
  features: new GeoJSON().readFeatures(geojsonObject),
});

const selected = new Style({
  stroke: new Stroke({
    color: [70,70,70],
    width: 1,
  }),
  fill: new Fill({
    color: [220,220,220],
  }),
});

const selectClick = new Select({
  style: selected,
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: new Style({
    stroke: new Stroke({
      color: [70,70,70],
      width: 1,
    }),
    fill: new Fill({
      color: [240,240,240],
    })
  }),
});

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
    document.getElementById('name').insertAdjacentText('beforeend', namePromise[0]["values_"]["WD23NM"])
  } catch ({ name, message }) {
    if (name == "TypeError"){
      console.log("clicked")
    }
  }

  //local area = LAD23NM
});