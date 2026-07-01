/* scroll/rail.js — riel de progreso lateral (cuaderno de laboratorio). */

import { clamp } from './utils.js';

export const initScrollRail = () => {
  const rail = document.createElement('div');
  rail.className = 'scroll-rail';
  rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML =
    '<div class="rl-track"><div class="rl-fill"></div></div><div class="rl-pct">00</div>';
  document.body.appendChild(rail);
  const fill = rail.querySelector('.rl-fill');
  const pct = rail.querySelector('.rl-pct');
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(window.scrollY / max) : 0;
    fill.style.height = (p * 100).toFixed(1) + '%';
    pct.textContent = String(Math.round(p * 100)).padStart(2, '0');
  };
  window.addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
};
