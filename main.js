import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorSource from 'ol/source/Vector.js';
import VectorLayer from 'ol/source/Vector.js';


const geojsonObject = {
  url: './wards2.geojson',
  format: new GeoJSON()
}

const vectorSource = new VectorSource({
  features: new GeoJSON().readGeometry(geojsonObject) // wtf is going on here
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
});


const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    vectorLayer,
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

