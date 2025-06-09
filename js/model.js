let model = null;
let scaler = null;

async function loadModel() {
    try {
        const response = await fetch("lib/best_grid3_fix_grow_fin.json");
        model = await response.json();
        const standard = await fetch("lib/scaler_params3_grow_fin.json");
        scaler = await standard.json();
        console.log("Loaded terms:", model.terms.length);
    } catch (error) {
        console.error("Failed to load model:", error);
    }
}

function getUserInput() {
    // const gender = document.getElementById('gender').value;

    const input = {
        other_carb: +document.getElementById('other_carb').value,
        sugar: +document.getElementById('sugar').value,
        protein: +document.getElementById('protein').value,
        total_fat: +document.getElementById('total_fat').value,
        dietary_fiber: +document.getElementById('dietary_fiber').value,
        HbA1c: +document.getElementById('hba1c').value,
        init_val: +document.getElementById('init_val').value,
    };

    // input["Gender_MALE"] = gender === 'MALE' ? 1 : 0;
    // input["Gender_FEMALE"] = gender === 'FEMALE' ? 1 : 0;
    input["Gender_MALE"] = 0;
    input["Gender_FEMALE"] = 1;
    input["calorie"] = (input['other_carb'] * 4) + (input['sugar'] * 4) + (input['dietary_fiber'] * 4) + (input['protein'] * 4) + (input['total_fat'] * 9);
    input['carb_per_fiber'] = ((input['other_carb']) + (input['sugar']) + (input['dietary_fiber'])) / (input['dietary_fiber'] + 1e-5);
    input['sugar_ratio'] = input['sugar'] / (((input['other_carb']) + (input['sugar']) + (input['dietary_fiber'])) + 1e-5);
    input['protein_fat_ratio'] = input['protein'] / (input['total_fat'] + 1e-5);
    input['fat_protein_ratio'] = input['total_fat'] / (input['protein'] + 1e-5);
    input['log_sugar'] = Math.log1p(input['sugar']);
    input['sugar_2'] = input['sugar'] ** 2;
    input['HbA1c_25'] = input['HbA1c'] * 0.25;
    input['dietary_fiber_25'] = input['dietary_fiber'] * 0.25;
    input['protein_25'] = input['protein'] ** 2;

    return input;
}

function standardizeInput(rawInput) {
    const standardized = { ...rawInput };
    scaler.features.forEach((feature, i) => {
        const mean = scaler.mean[i];
        const scale = scaler.scale[i];
        standardized[feature] = (rawInput[feature] - mean) / scale;
    });
    return standardized;
}

function calculate_pred() {
    const rawInputs = getUserInput();
    const baseInputs = standardizeInput(rawInputs);
    const data = [];

    data.push({ time: 0, glucose: rawInputs.init_val });

    const std_idx_min = scaler.features.indexOf("standardized_minutes");
    const mean_min = scaler.mean[std_idx_min];
    const scale_min = scaler.scale[std_idx_min];

    const std_idx_prev = scaler.features.indexOf("prev_glu");
    const mean_prev = scaler.mean[std_idx_prev];
    const scale_prev = scaler.scale[std_idx_prev];

    let prev = rawInputs.init_val;

    for (let min = 5; min <= 60; min += 5) {
        const input = { ...baseInputs };
        input["standardized_minutes"] = (min - mean_min) / scale_min;
        input['prev_glu'] = (prev - mean_prev) / scale_prev;

        let bin;
        if (min <= 30) bin = 30;
        else if (min <= 60) bin = 60;
        else if (min <= 90) bin = 90;
        else bin = 120;
        [30, 60, 90, 120].forEach(b => {
            input[`time_bin_${b}`] = (b === bin) ? 1 : 0;
        });

        let change = model.intercept;

        for (const term of model.terms) {
            let result = 1;
            for (const f of term.features) {
                let value;
                if (f.includes("^")) {
                    const [base, power] = f.split("^");
                    value = Math.pow(input[base] || 0, +power);
                } else {
                    value = input[f] || 0;
                }
                result *= value;
            }
            change += result * term.coef;
        }

        let pred = change + prev;
        pred = Math.max(0, Math.min(500, pred));

        console.log(`Minute ${min} → Glucose: ${pred}`);
        data.push({ time: min, glucose: pred });
        prev = pred;
    }

    drawPlot(data);
}



function drawPlot(data) {
  const svg = d3.select("#glucose-plot");
  svg.selectAll("*").remove(); // Clear old contents

  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const boundingBox = svg.node().getBoundingClientRect();
  const outerWidth = boundingBox.width;
  const outerHeight = boundingBox.height;
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
    .domain([0, 60])
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
