/* dom.js — helpers de acceso/escritura al DOM (efectos laterales mínimos y puros en forma) */

export const $ = id => document.getElementById(id);
export const $q = (sel, ctx) => (ctx || document).querySelector(sel);
export const $qa = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];
export const setAttr = (el, k, v) => { if (el) el.setAttribute(k, v); };
export const setText = (el, t) => { if (el) el.textContent = t; };

export const inertTargets = () =>
  ['nav', 'main', 'footer', '#chatFab', '#chatPanel'].map(s => $q(s)).filter(Boolean);
