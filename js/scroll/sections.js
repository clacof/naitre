/* scroll/sections.js — Actos II–V: transiciones de sección dirigidas por scroll. */

import { reduceMotion, clamp, easeOut } from './utils.js';

export const initSections = engine => {
  const ai = document.querySelector('.ai-section');
  // En móvil la CSS desactiva los transforms por scroll (más sobrio y fluido):
  // evitamos también el trabajo por frame y dejamos la sección asentada.
  const mobile = window.matchMedia('(max-width:760px)').matches;

  if (reduceMotion.matches || mobile) {
    if (ai) ai.style.setProperty('--enter', '1');
    if (reduceMotion.matches) return; // sin movimiento dirigido por scroll
  }

  // Acto II — la losa oscura de IA se eleva al entrar (escala + radio + sombra).
  // Solo en desktop: en móvil resta fluidez.
  if (ai && !mobile) {
    engine.registerView(ai, vp => {
      const enter = clamp((vp - 0.02) / 0.42); // entra gradual, suave
      ai.style.setProperty('--enter', easeOut(enter).toFixed(3));
    });
  }

  // Numerales de acto con parallax (plancha de atlas). En móvil la CSS los
  // deja fijos, así que no registramos la escena (un transform menos por frame).
  if (!mobile) {
    document.querySelectorAll('section').forEach(sec => {
      engine.registerView(sec, vp => sec.style.setProperty('--vp', vp.toFixed(3)));
    });
  }

  // Entrada en cascada de las planchas IA: un único disparo (.in) cuando la
  // rejilla entra en viewport; el escalonado lo da la CSS con --i por tarjeta.
  // Más robusto que umbrales por tarjeta (no colapsa en un frame si el scroll
  // es rápido tras el hero alto).
  const aiGrid = document.querySelector('.ai-grid');
  if (aiGrid) {
    const cards = Array.prototype.slice.call(aiGrid.querySelectorAll('.ai-card'));
    cards.forEach((c, i) => c.style.setProperty('--i', i));
    aiGrid.classList.add('seq');
    engine.registerView(aiGrid, p => { if (p >= 0.12) aiGrid.classList.add('in'); });
  }

  // Parallax de imágenes: profundidad sin librerías.
  // Si el navegador soporta animation-timeline:view(), lo lleva el CSS (ver
  // bloque @supports en index.html) y aquí no hacemos nada: evita transform
  // por frame en el hilo principal.
  const cssScrollDriven = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline', 'view()'));
  if (!cssScrollDriven && !mobile) {
    const parallax = (sel, amp) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const host = el.closest('section') || el;
      engine.registerView(host, vp => {
        el.style.transform = `translate3d(0, ${((0.5 - vp) * amp).toFixed(1)}px, 0)`;
      });
    };
    parallax('.ai-card--feature img', 48);
    parallax('.about-photo img', 42);
  }
};
