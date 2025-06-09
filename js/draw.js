const canvas = document.getElementById("user-curve");
const ctx = canvas.getContext("2d");
const realCanvas = document.getElementById("real-curve");
const realCtx = realCanvas.getContext("2d");

let points = [];
const numPoints = 50;
const radius = 6;
let dragging = null;

function initCurve() {
  points = [];
  for (let i = 0; i < numPoints; i++) {
    const x = (i / (numPoints - 1)) * canvas.width;
    const y = canvas.height / 2;
    points.push({ x, y });
  }
  drawCurve();
}

function drawCurve() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw time axis
  ctx.strokeStyle = "#aaa";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 20);
  ctx.lineTo(canvas.width, canvas.height - 20);
  ctx.stroke();
  for (let min = 0; min <= 60; min += 5) {
    const x = (min / 60) * canvas.width;
    ctx.fillStyle = "#666";
    ctx.font = "12px sans-serif";
    ctx.fillText(`${min}min`, x + 2, canvas.height - 5);
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = "#EF6C00";
  ctx.lineWidth = 2;
  ctx.stroke();

  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#81C784";
    ctx.fill();
  }
}

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

function standardizeInput(rawInput) {
  const standardized = { ...rawInput };
  scaler.features.forEach((feature, i) => {
    const mean = scaler.mean[i];
    const scale = scaler.scale[i];
    standardized[feature] = (rawInput[feature] - mean) / scale;
  });
  return standardized;
}

// const input = {
//   other_carb: 0,
//   sugar: 0,
//   protein: 0,
//   total_fat: 0,
//   dietary_fiber: 0,
//   HbA1c: 5.7,
//   init_val: 59
// };



function getUserInput() {
    const data = input;

    return data;
}

function calculate_pred() {
  const rawInputs = getUserInput();
  console.log("pred", rawInputs);
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
    const inputs = { ...baseInputs };
    inputs["standardized_minutes"] = (min - mean_min) / scale_min;
    inputs['prev_glu'] = (prev - mean_prev) / scale_prev;

    let bin;
    if (min <= 30) bin = 30;
    else if (min <= 60) bin = 60;
    else if (min <= 90) bin = 90;
    else bin = 120;
    [30, 60, 90, 120].forEach(b => {
      inputs[`time_bin_${b}`] = (b === bin) ? 1 : 0;
    });

    let change = model.intercept;

    for (const term of model.terms) {
      let result = 1;
      for (const f of term.features) {
        let value;
        if (f.includes("^")) {
          const [base, power] = f.split("^");
          value = Math.pow(inputs[base] || 0, +power);
          console.log(f, inputs[base]);
        } else {
          console.log(f, inputs[f])
          value = inputs[f] || 0;
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

  return data
}

function interpolateModelToUser(realPoints, targetLength) {
  const interpolated = [];
  for (let i = 0; i < targetLength; i++) {
    const t = (i / (targetLength - 1)) * 60; // time in minutes
    // Find two surrounding points
    let j = 1;
    while (j < realPoints.length && realPoints[j].time < t) j++;
    const p1 = realPoints[j - 1];
    const p2 = realPoints[j];
    const ratio = (t - p1.time) / (p2.time - p1.time);
    const glucose = p1.glucose + ratio * (p2.glucose - p1.glucose);
    interpolated.push(glucose);
  }
  return interpolated;
}
let model = null;
let scaler = null;

loadModel();

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const dist = Math.hypot(mx - p.x, my - p.y);
    if (dist < radius + 3) {
      dragging = i;
      break;
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (dragging === null) return;
  const rect = canvas.getBoundingClientRect();
  const my = e.clientY - rect.top;
  const delta = my - points[dragging].y;
  for (let i = 0; i < points.length; i++) {
    const d = Math.abs(i - dragging);
    const influence = Math.max(0, 1 - d / 10);
    points[i].y += delta * influence * 0.5;
  }
  drawCurve();
});

canvas.addEventListener("mouseup", () => dragging = null);
canvas.addEventListener("mouseleave", () => dragging = null);

// const foodInfo = {
//   "Chicken": { gi: 0, strength: 0.1, delay: 50, width: 200 },
//   "Tofu": { gi: 15, strength: 0.2, delay: 45, width: 180 },
//   "Sausage": { gi: 28, strength: 0.3, delay: 40, width: 160 },
//   "Brown Rice": { gi: 50, strength: 0.7, delay: 35, width: 100 },
//   "White Rice": { gi: 72, strength: 0.9, delay: 30, width: 80 },
//   "Sweet Potato": { gi: 65, strength: 0.8, delay: 32, width: 90 },
//   "French Fries": { gi: 75, strength: 1.0, delay: 25, width: 70 },
//   "Broccoli": { gi: 15, strength: 0.2, delay: 60, width: 200 },
//   "Corn": { gi: 60, strength: 0.6, delay: 35, width: 90 },
//   "Apple": { gi: 38, strength: 0.5, delay: 45, width: 100 },
//   "Raisins": { gi: 64, strength: 0.9, delay: 25, width: 70 },
// };

function simulateGlucoseCurve(mealSelection, length = numPoints) {
  const result = new Array(length).fill(0);
  for (const type in mealSelection) {
    const food = mealSelection[type];
    const props = foodInfo[food];
    if (!props) continue;
    const { gi, strength, delay, width } = props;
    for (let t = 0; t < length; t++) {
      const val = gi * strength * Math.exp(-Math.pow((t - delay) / 2, 2) / width);
      result[t] += val;
    }
  }
  return result;
}

function submitPrediction() {
  const mealSelection = window.meal || {
    protein: "Tofu",
    carb: "White Rice",
    veg: "Raisins"
  };

  

  const realPoints = calculate_pred();

  // ⬇️ 归一化（中心化对齐）
  const realGlucose = interpolateModelToUser(realPoints, numPoints);
  const realY = realGlucose.map(g => realCanvas.height - g);
  const realMean = realY.reduce((a, b) => a + b, 0) / realY.length;
  const realNorm = realY.map(y => y - realMean);

  const userY = points.map(p => p.y);
  const userMean = userY.reduce((a, b) => a + b, 0) / userY.length;
  const userNorm = userY.map(y => y - userMean);

  // 🎯 绘制坐标轴
  realCtx.clearRect(0, 0, realCanvas.width, realCanvas.height);
  realCtx.strokeStyle = "#aaa";
  realCtx.beginPath();
  realCtx.moveTo(0, realCanvas.height - 20);
  realCtx.lineTo(realCanvas.width, realCanvas.height - 20);
  realCtx.stroke();
  for (let min = 0; min <= 60; min += 5) {
    const x = (min / 60) * realCanvas.width;
    realCtx.fillStyle = "#666";
    realCtx.font = "12px sans-serif";
    realCtx.fillText(`${min}min`, x + 2, realCanvas.height - 5);
  }

  // ✅ 真实曲线
  realCtx.beginPath();
  realCtx.moveTo(0, realMean + realNorm[0]);
  for (let i = 1; i < realPoints.length; i++) {
    const x = (realPoints[i].time / 60) * realCanvas.width;
    const y = realMean + realNorm[i];
    realCtx.lineTo(x, y);
  }
  realCtx.strokeStyle = "#2E7D32";
  realCtx.lineWidth = 2;
  realCtx.stroke();

  document.getElementById("real-curve-area").classList.remove("hidden");

  // 📏 计算准确率（只关注形状误差）
  let correct = 0;
  for (let i = 0; i < numPoints; i++) {
    const err = Math.abs(userNorm[i] - realNorm[i]);
    if (err < 20) correct++;
  }

  const acc = ((correct / numPoints) * 100).toFixed(1);
  document.getElementById("accuracy-result").textContent = `Your prediction accuracy: ${acc}%`;
  document.getElementById('click-anywhere-tip').classList.remove('hidden');
}

initCurve();
