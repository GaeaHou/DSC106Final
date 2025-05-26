// js/observer.js

// 创建 IntersectionObserver 实例
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.classList.remove('hidden');
      }
    });
  }, {
    threshold: 0.1
  });
  
  // 选择所有 fade-in 元素并观察
  document.addEventListener('DOMContentLoaded', () => {
    const targets = document.querySelectorAll('.fade-in');
    targets.forEach(el => {
      el.classList.add('hidden');
      observer.observe(el);
    });
  });