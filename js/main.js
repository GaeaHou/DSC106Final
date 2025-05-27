// main.js

const meal = { protein: null, carb: null, veg: null };

window.selectFood = function (type, item) {
  meal[type] = item;

  const imgMap = {
    "Chicken": "🍗", "Tofu": "🥬", "Sausage": "🌭",
    "Brown Rice": "🍚", "White Rice": "🍚", "Sweet Potato": "🍠", "French Fries": "🍟",
    "Broccoli": "🥦", "Corn": "🌽", "Apple": "🍎", "Raisins": "🍇"
  };

  const slotId = `img-${type}`;
  const slot = document.getElementById(slotId);
  if (slot) {
    slot.innerHTML = `<span class="food-emoji">${imgMap[item]}</span><div>${item}</div>`;
  }

  if (meal.protein && meal.carb && meal.veg) {
    setTimeout(() => {
      document.getElementById('meal-select').classList.add('fade-out');
      setTimeout(() => {
        document.getElementById('meal-select').classList.add('hidden');
        document.getElementById('glucose-predict').classList.remove('hidden');
        document.getElementById('glucose-predict').classList.remove('fade-out');
        document.getElementById('glucose-predict').classList.add('fade-in');
      }, 1000);
    }, 600);
  }
};

window.selectCurve = function (id) {
  document.getElementById('curve-reveal').classList.remove('hidden');
};

window.goBackToSelection = function () {
  document.getElementById('glucose-predict').classList.add('hidden');
  document.getElementById('meal-select').classList.remove('hidden');

  // 清除用户选择
  meal.protein = null;
  meal.carb = null;
  meal.veg = null;
  ['img-protein', 'img-carb', 'img-veg'].forEach(id => {
    const slot = document.getElementById(id);
    if (slot) slot.innerHTML = '';
  });

  // 隐藏结果区
  const curveReveal = document.getElementById('curve-reveal');
  if (curveReveal) curveReveal.classList.add('hidden');

  const glucoseOptions = document.getElementById('glucose-options');
  if (glucoseOptions) glucoseOptions.classList.add('hidden');
};

window.addEventListener("DOMContentLoaded", () => {
    // Step 1: Show loading, then Alice
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
      const scene = document.getElementById('meal-scene');
      scene.classList.remove('hidden');
  
      // Step 2: Show dialogue
      const dialogue = document.getElementById('dialogue-box');
      dialogue.classList.remove('hidden');
  
      // Step 3: After 2s, hide dialogue, move to layout
      setTimeout(() => {
        dialogue.classList.add('hidden');
  
        // Fade out intro
        const stage = document.getElementById('alice-stage');
        stage.style.opacity = 0;
  
        // Step 4: Show meal layout
        setTimeout(() => {
          stage.style.display = 'none';
          document.getElementById('meal-layout').classList.remove('hidden');
        }, 1000);
      }, 2000);
    }, 3500); // Wait for progress bar
  });