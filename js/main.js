// main.js
const meal = { protein: null, carb: null, veg: null };

window.selectFood = function(type, item) {
  meal[type] = item;
  const imgMap = {
    "Chicken": "🍗", "Tofu": "🦬", "Sausage": "🌭",
    "Brown Rice": "🍚", "White Rice": "🍚", "Sweet Potato": "🥠", "French Fries": "🍟",
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

window.selectCurve = function(id) {
  document.getElementById('curve-reveal')?.classList.remove('hidden');
};

window.goBackToSelection = function() {
  document.getElementById('glucose-predict').classList.add('hidden');
  document.getElementById('meal-select').classList.remove('hidden');

  meal.protein = null;
  meal.carb = null;
  meal.veg = null;

  ['img-protein', 'img-carb', 'img-veg'].forEach(id => {
    const slot = document.getElementById(id);
    if (slot) slot.innerHTML = '';
  });

  document.getElementById('curve-reveal')?.classList.add('hidden');
  document.getElementById('glucose-options')?.classList.add('hidden');
  document.getElementById('real-curve-area')?.classList.add('hidden');

  initCurve();
  realCtx?.clearRect(0, 0, realCanvas.width, realCanvas.height);
};

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('meal-select').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('meal-select').classList.add('animate-ready');
    }, 100);
  }, 3500);
});