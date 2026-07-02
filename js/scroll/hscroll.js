/* scroll/hscroll.js — sección Proceso: pin + traslación lateral, coreografía
 * por panel (--pp: presencia según distancia al centro) y contador de fase.
 * El JS produce números; los transforms viven en CSS (salvo la fila, que es
 * la coreografía sincronizada que justifica la escena pin).
 */

import { reduceMotion, clamp } from './utils.js';

export const initHScroll = engine => {
  const sec = document.querySelector('.hscroll');
  if (!sec) return;
  const track = sec.querySelector('.hscroll-track');
  const viewport = sec.querySelector('.hscroll-viewport');
  const row = sec.querySelector('.hscroll-row');
  const bar = sec.querySelector('.hscroll-progress span');
  const count = sec.querySelector('.hscroll-count .cur');
  if (!track || !viewport || !row) return;
  if (reduceMotion.matches) return; // fallback: paneles en vertical

  sec.classList.add('hscroll--active');

  const panels = Array.prototype.slice.call(row.querySelectorAll('.hpanel'));
  const phaseIdx = panels
    .map((p, i) => (p.classList.contains('hpanel--intro') ? -1 : i))
    .filter(i => i >= 0);
  // En móvil la CSS deja los paneles asentados (--pp por defecto = 1):
  // evitamos también las escrituras por frame.
  const mobile = window.matchMedia('(max-width:760px)').matches;

  let maxX = 0, vw = 0, centers = [];
  const measure = () => {
    vw = viewport.clientWidth;
    maxX = Math.max(0, row.scrollWidth - vw);
    centers = panels.map(p => p.offsetLeft + p.offsetWidth / 2);
  };

  let phase = -1;
  engine.registerScene(track, p => {
    const x = p * maxX;
    row.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`;
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`; // sin layout por frame

    const c = x + vw / 2; // punto del recorrido en el centro del viewport

    if (!mobile) {
      for (let i = 0; i < panels.length; i++) {
        const pp = clamp(1 - Math.abs(centers[i] - c) / (vw * 0.72));
        panels[i].style.setProperty('--pp', pp.toFixed(3));
      }
    }

    // Contador de fase: la más cercana al centro (solo escribe al cambiar)
    if (count && phaseIdx.length) {
      let best = 0, bd = Infinity;
      for (let k = 0; k < phaseIdx.length; k++) {
        const d = Math.abs(centers[phaseIdx[k]] - c);
        if (d < bd) { bd = d; best = k; }
      }
      if (best !== phase) {
        phase = best;
        count.textContent = String(best + 1).padStart(2, '0');
      }
    }
  });

  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(measure, 120);
  }, { passive: true });

  measure();
  setTimeout(measure, 250); // re-medir tras asentarse fuentes/layout
};
