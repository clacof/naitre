/* scroll/hscroll.js — sección Proceso: pin + traslación lateral. */

import { reduceMotion } from './utils.js';

export const initHScroll = engine => {
  const sec = document.querySelector('.hscroll');
  if (!sec) return;
  const track = sec.querySelector('.hscroll-track');
  const viewport = sec.querySelector('.hscroll-viewport');
  const row = sec.querySelector('.hscroll-row');
  const bar = sec.querySelector('.hscroll-progress span');
  if (!track || !viewport || !row) return;
  if (reduceMotion.matches) return; // fallback: paneles en vertical

  sec.classList.add('hscroll--active');

  let maxX = 0;
  const measure = () => { maxX = Math.max(0, row.scrollWidth - viewport.clientWidth); };

  engine.registerScene(track, p => {
    row.style.transform = `translate3d(${(-p * maxX).toFixed(1)}px,0,0)`;
    if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
  });

  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(measure, 120);
  }, { passive: true });

  measure();
  setTimeout(measure, 250); // re-medir tras asentarse fuentes/layout
};
