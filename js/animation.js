// js/animation.js
// 血糖曲线绘制脚本（使用 D3）

function drawGlucoseCurve() {
    const width = document.getElementById('glucose-animation').offsetWidth;
    const height = 400;
  
    const svg = d3.select('#glucose-animation')
      .append('svg')
      .attr('width', width)
      .attr('height', height);
  
    const x = d3.scaleLinear().domain([0, 24]).range([50, width - 50]);
    const y = d3.scaleLinear().domain([70, 180]).range([height - 30, 30]);
  
    const data = [
      { t: 0, g: 85 }, { t: 8.5, g: 95 }, { t: 9.5, g: 130 },
      { t: 10.5, g: 100 }, { t: 12, g: 110 }, { t: 13, g: 160 },
      { t: 14.5, g: 120 }, { t: 18.5, g: 115 }, { t: 20, g: 150 },
      { t: 22, g: 100 }
    ];
  
    const line = d3.line()
      .x(d => x(d.t))
      .y(d => y(d.g))
      .curve(d3.curveMonotoneX);
  
    const path = svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#66BB6A')
      .attr('stroke-width', 3)
      .attr('d', line);
  
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2500)
      .ease(d3.easeCubic)
      .attr('stroke-dashoffset', 0)
      .on('end', () => {
        // 绘制坐标轴
        const xAxis = d3.axisBottom(x)
          .tickValues([0, 6, 8.5, 12, 18.5, 24])
          .tickFormat(d => {
            const hour = Math.floor(d);
            const min = Math.round((d - hour) * 60);
            return `${hour}:${min.toString().padStart(2, '0')}`;
          });
  
        svg.append('g')
          .attr('transform', `translate(0,${height - 30})`)
          .call(xAxis);
  
        // 添加餐点标注
        const meals = [
          { label: 'Breakfast', t: 8.5 },
          { label: 'Lunch', t: 12 },
          { label: 'Dinner', t: 18.5 }
        ];
  
        svg.selectAll('.meal-label')
          .data(meals)
          .enter()
          .append('circle')
          .attr('cx', d => x(d.t))
          .attr('cy', height - 30)
          .attr('r', 5)
          .attr('fill', '#EF6C00');
  
        svg.selectAll('.meal-text')
          .data(meals)
          .enter()
          .append('text')
          .attr('x', d => x(d.t))
          .attr('y', height - 45)
          .attr('text-anchor', 'middle')
          .attr('font-size', '0.9rem')
          .attr('fill', '#444')
          .text(d => d.label);
      });
  }
  
  window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('glucose-animation')) {
      drawGlucoseCurve();
    }
  });

  