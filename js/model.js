// predictor.js (fixed for accurate polynomial term computation)

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let model = null;
let scaler = null;

async function loadModel() {
  try {
    const response = await fetch("lib/best_grid2.json");
    model = await response.json();
    const standard = await fetch("lib/scaler_params.json");
    scaler = await standard.json();
  } catch (error) {
    console.error("Failed to load model:", error);
  }
}


function getUserInput() {
  const gender = document.getElementById('gender').value;
  // const hour = +document.getElementById('hour_of_day').value;

  const input = {};

  input["calorie"] = +document.getElementById('calorie').value;
  input["total_carb"] = +document.getElementById('total_carb').value;
  input["sugar"] = +document.getElementById('sugar').value;
  input["protein"] = +document.getElementById('protein').value;
  input["total_fat"] = +document.getElementById('total_fat').value;
  input["dietary_fiber"] = +document.getElementById('dietary_fiber').value;
  input["HbA1c"] = +document.getElementById('hba1c').value;
  input["init_val"] = +document.getElementById('init_val').value;

  input["Gender_MALE"] = gender === 'MALE' ? 1 : 0;
  input["Gender_FEMALE"] = gender === 'FEMALE' ? 1 : 0;

  input["sugar_carb"] = input["sugar"] + input["total_carb"];
  // input["hour_of_day"] = hour;

  // for (let i = 0; i <= 23; i++) {
  //   input[`hour_of_day_${i}`] = (hour === i ? 1 : 0);
  //   // input[`hour_of_day_${i}^2`] = input[`hour_of_day_${i}`];
  // }

  return input;
}

function standardizeInput(rawInput) {
  const standardized = { ...rawInput }; // keep categorical untouched
  scaler.features.forEach((feature, i) => {
    const mean = scaler.mean[i];
    const scale = scaler.scale[i];
    standardized[feature] = (rawInput[feature] - mean) / scale;
  });
  return standardized;
}


function parseFeatureName(feature, input) {
  if (feature.includes("^")) {
    const [base, power] = feature.split("^");
    return Math.pow(input[base] || 0, +power);
  } else {
    return input[feature] || 0;
  }
}

function calculate_pred() {
  const rawInputs = getUserInput();
  const inputs = standardizeInput(rawInputs);
  const data = [];

  for (let min = 0; min <= 120; min += 5) {
    const weighted_time10 = (min * 11 - scaler.mean[scaler.features.indexOf("weighted_time10")]) /
      scaler.scale[scaler.features.indexOf("weighted_time10")];

    let sum = model.intercept;

    for (const term of model.terms) {
      let result = 1;
      for (const feat of term.features) {
        if (feat.includes("^")) {
          const [base, power] = feat.split("^");
          const val = base === "weighted_time10" ? weighted_time10 : inputs[base];
          result *= Math.pow(val || 0, +power);
        } else {
          const val = feat === "weighted_time10" ? weighted_time10 : inputs[feat];
          result *= val || 0;
        }
      }
      sum += result * term.coef;
    }

    console.log(sum);
    data.push({ time: min, glucose: sum });
  }

  drawPlot(data);
}



function drawPlot(data) {
  const svg = d3.select("#glucose-plot");
  svg.selectAll("*").remove(); // Clear old contents

  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const outerWidth = +svg.attr("width");
  const outerHeight = +svg.attr("height");
  const width = outerWidth - margin.left - margin.right;
  const height = outerHeight - margin.top - margin.bottom;

  // Create clipping path to restrict drawing inside plot area
  svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, 120])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, 300])
    .range([height, 0]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x))


  g.append("g")
    .call(d3.axisLeft(y));

  g.selectAll("g.tick text")
    .style("fill", "#2E7D32");

  g.selectAll("g.tick line, path.domain")
    .style("stroke", "#2E7D32");

  // Line generator
  const line = d3.line()
    .x(d => x(d.time))
    .y(d => y(d.glucose));

  // Apply clipping to keep path inside axes
  g.append("path")
    .datum(data)
    .attr("class", "prediction-line")
    .attr("clip-path", "url(#clip)")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);
}

window.addEventListener("DOMContentLoaded", () => {
  loadModel();

  d3.select("#glucose-plot")
    .style("background-color", "#f5fff8")
    .attr("width", 960)
    .attr("height", 540);

  // Optional: Draw empty plot initially
  drawPlot([]);

  document.getElementById("predict-button").addEventListener("click", calculate_pred);
});
