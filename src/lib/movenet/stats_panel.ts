import Stats from 'stats.js';

export function setupStats() {
  const stats = new Stats();
  
  const customFpsPanel = stats.addPanel(new Stats.Panel('FPS', '#0ff', '#002'));
  stats.showPanel(stats.dom.children.length - 1);

  const parent = document.getElementById('stats')!;
  parent.appendChild(stats.dom);

  const statsPanes = parent.querySelectorAll('canvas');

  for (let i = 0; i < statsPanes.length; ++i) {
    statsPanes[i].style.width = '140px';
    statsPanes[i].style.height = '80px';
  }
  return {stats, customFpsPanel} ;
}
