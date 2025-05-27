window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById('loading-screen').style.display = 'none';
    const scene = document.getElementById('meal-scene');
    scene.classList.remove('hidden');

    const dialogue = document.getElementById('dialogue-box');
    dialogue.classList.remove('hidden');

    setTimeout(() => {
      dialogue.classList.add('hidden');
      const stage = document.getElementById('alice-stage');
      stage.style.opacity = 0;

      setTimeout(() => {
        stage.style.display = 'none';
        document.getElementById('meal-layout').classList.remove('hidden');
      }, 1000);
    }, 2000);
  }, 3500);
});
