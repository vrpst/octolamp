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
import { getElectionResult } from './charts';
import { createBarChart } from './charts';
import { createTable } from './table';

let yearonlyflag = false
let yearonlyyear = 2024

let geojson = null
let geojsonObject = null

let resultsjson = null
let resultsjsonObject = null

let ward_code_code = null

let chart = null
let ladswards = "wards"

let vectorSource = null

document.getElementById("slider-year").innerText = "Year: " + document.getElementById("daterange").value
document.getElementById("only").innerText = document.getElementById("daterange").value + " only"

function ladWardSwitch() {
  if (ladswards == "lads") {
    ladswards = "wards"
  } else {
    ladswards = "lads"
  }
}
async function updateMap() {
  let geojsonstring = './geodata/' + ladswards + '/' + ladswards + '-' + yearonlyyear.toString() + '.geojson'
  geojson = await fetch(geojsonstring)
  geojsonObject = await geojson.json()

  let resultsjsonstring = './data/' + yearonlyyear.toString() + '/' + yearonlyyear.toString() + '-past-elections.json'
  resultsjson = await fetch(resultsjsonstring)
  resultsjsonObject = await resultsjson.json()
  
  ward_code_code = "WD" + yearonlyyear.toString().slice(2,4) + "CD"
}

await updateMap(2024)
purgeVectorSource()

const selected = new Style({
  stroke: new Stroke({
    width: 1,
  }),
  fill: new Fill({
    color: "#DCDCDC",
  }),
});

const selectClick = new Select({
  style: selected,
});

let styleFunction = function(feature, resolution) {
  let code = feature.get(ward_code_code)
  return new Style({
    stroke: new Stroke({
      color: getStrokeToUse(resultsjsonObject[code]),
      width: 1,
    }),
    fill: new Fill({
      color: getColorToUse(resultsjsonObject[code]), //styleFunction
    })
  })
}

function getStrokeToUse(results) {
  if (yearonlyflag && results["election"] != yearonlyyear) {
    return "#808080"
  } else {
    return [70,70,70]
  }
}

function getColorToUse(results) {
  if ((results != "NONE" && !yearonlyflag) || yearonlyflag && results["election"] == yearonlyyear) {
    if (colors[results["control"]]) {
      return colors[results["control"]]
    }
  } else {
    return "#999999"
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

// MAP HOVER FUNCTIONALITY
map.on('pointermove', async function (evt) {
  const f = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
  })
  if (f) {
    if ((!yearonlyflag) || (yearonlyflag && Number(resultsjsonObject[f['values_'][ward_code_code]]['election']) == yearonlyyear)) {
      document.getElementById('hover-name').style.display = "block"
      document.getElementById('hover-name').innerText = f['values_'][ward_code_code.slice(0,4)+"NM"]
    } else {
        document.getElementById('hover-name').style.display = "none"
    }
  } else {
      document.getElementById('hover-name').style.display = "none"
  }
})

// MAP CLICK FUNCTIONALITY
map.addInteraction(selectClick)
map.on('click', async function (evt) {
  const namePromise = await vectorLayer.getFeatures(evt.pixel)

  try {
    document.getElementById('name').innerText = ''
    document.getElementById('name').insertAdjacentText('beforeend', namePromise[0]["values_"][ward_code_code.slice(0,4)+"NM"])
  } catch ({ name, message }) {
    if (name == "TypeError"){
      console.log("clicked")
    }
  }
 // try {
  await openPanel(namePromise[0]["values_"])
});

// RENDER INFO PANEL
async function openPanel(values) {
  if ((!yearonlyflag) || (yearonlyflag && Number(resultsjsonObject[values[ward_code_code]]['election']) == yearonlyyear)) {
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
  } else {
      document.getElementById('local-authority').innerText = "No election in " + yearonlyyear.toString()
  }
}

// DON'T SHOW ANYTHING IF NO DATA
function showNoData() {
    try {
      chart.destroy()
    } catch {}
    document.getElementById('table').innerText = ""
    document.getElementById('local-authority').innerText = "No data"
}

const colors = {
  LAB: "#E4003B",   //[228, 0, 59],
  CON: "#0087DC",   //[0, 135, 220],
  LD: "#FDBB30",    //[253, 187, 48],
  GREEN: "#02A95B", //[2, 169, 91],
  REF: "#00BED6",   //[0, 190, 214],
  MIX: "#9507DB",   //[149, 7, 219],
  PC: "#005B54",    //[0, 91, 84],
  IND: "#F4A8FF",   //[244, 168, 255],
  OTH: "#964B00",   //[150, 75, 0],
}

// UPDATE MAP FOR BUTTON SHOWING ONLY RESULTS FROM THAT YEAR
document.getElementById("only").addEventListener('click', function() {
  yearonlyflag = !yearonlyflag
  if (yearonlyflag) {
    document.getElementById("only").innerText = "Show all wards"
  }
  else {
      document.getElementById("only").innerText = yearonlyyear + " only"
  }
  purgeMap()
})

document.getElementById("lad-ward-button").addEventListener('click', async function() {
  ladWardSwitch()
  await updateMap(yearonlyyear)
  vectorSource.clear()
  vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojsonObject),
  });
  
  purgeMap()

})

// UPDATE MAP FOR CHANGE IN DATE
document.getElementById("daterange").oninput = async function() {
  yearonlyyear = this.value

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