import './style.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import Projection from 'ol/proj/Projection.js';

const geojson = await fetch('./wards2.geojson')
const geojsonObject = await geojson.json()
console.log(geojsonObject)

const vectorSource = new VectorSource({
  features: new GeoJSON().readFeatures(geojsonObject),
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: new Style({
    stroke: new Stroke({
      color: 'green',
      width: 1,
    }),
  }),
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

map.addLayer(vectorLayer)
