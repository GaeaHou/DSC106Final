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
  for (let i = 0; i <= 5; i++) {
    const x = (i / 5) * canvas.width;
    ctx.fillStyle = "#666";
    ctx.font = "12px sans-serif";
    ctx.fillText(`${i * 30}min`, x + 2, canvas.height - 5);
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

const foodInfo = {
  "Chicken":     { gi: 0,    strength: 0.1, delay: 50, width: 200 },
  "Tofu":        { gi: 15,   strength: 0.2, delay: 45, width: 180 },
  "Sausage":     { gi: 28,   strength: 0.3, delay: 40, width: 160 },
  "Brown Rice":  { gi: 50,   strength: 0.7, delay: 35, width: 100 },
  "White Rice":  { gi: 72,   strength: 0.9, delay: 30, width: 80 },
  "Sweet Potato":{ gi: 65,   strength: 0.8, delay: 32, width: 90 },
  "French Fries":{ gi: 75,   strength: 1.0, delay: 25, width: 70 },
  "Broccoli":    { gi: 15,   strength: 0.2, delay: 60, width: 200 },
  "Corn":        { gi: 60,   strength: 0.6, delay: 35, width: 90 },
  "Apple":       { gi: 38,   strength: 0.5, delay: 45, width: 100 },
  "Raisins":     { gi: 64,   strength: 0.9, delay: 25, width: 70 },
};

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

  const realPoints = simulateGlucoseCurve(mealSelection);

  // ⬇️ 归一化（中心化对齐）
  const realY = realPoints.map(y => realCanvas.height - y);
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
  for (let i = 0; i <= 5; i++) {
    const x = (i / 5) * realCanvas.width;
    realCtx.fillStyle = "#666";
    realCtx.font = "12px sans-serif";
    realCtx.fillText(`${i * 30}min`, x + 2, realCanvas.height - 5);
  }

  // ✅ 真实曲线
  realCtx.beginPath();
  realCtx.moveTo(points[0].x, realMean + realNorm[0]);
  for (let i = 1; i < numPoints; i++) {
    realCtx.lineTo(points[i].x, realMean + realNorm[i]);
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
