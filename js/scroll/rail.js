/* scroll/rail.js — riel de progreso lateral (cuaderno de laboratorio):
 * relleno por transform (scaleY, sin layout por frame) y un marcador por
 * acto que se enciende al alcanzarlo. */

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
  const trackEl = rail.querySelector('.rl-track');

  // Marcadores de acto: un punto por sección con id, a su altura proporcional
  const secs = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  const dots = secs.map(() => {
    const d = document.createElement('div');
    d.className = 'rl-dot';
    trackEl.appendChild(d);
    return d;
  });
  let fracs = [];
  const place = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    fracs = secs.map(s => (max > 0 ? clamp(s.offsetTop / max) : 0));
    dots.forEach((d, i) => { d.style.top = (fracs[i] * 100).toFixed(2) + '%'; });
  };

  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(window.scrollY / max) : 0;
    fill.style.transform = `scaleY(${p.toFixed(4)})`;
    pct.textContent = String(Math.round(p * 100)).padStart(2, '0');
    for (let i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('on', p >= fracs[i] - 0.02);
    }
  };
  window.addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', () => { place(); update(); }, { passive: true });

  place();
  update();
  // re-colocar tras asentarse fuentes/imágenes (cambian la altura del documento)
  setTimeout(() => { place(); update(); }, 400);
};
