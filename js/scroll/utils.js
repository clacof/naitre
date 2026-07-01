/* scroll/utils.js — utilidades puras de animación y un singleton de media query. */

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = t => 1 - Math.pow(1 - t, 3);

// convierte #rrggbb (o rgb()) + alpha a rgba()
export const hexA = (col, a) => {
  col = (col || '').trim();
  if (col[0] === '#') {
    let h = col.slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  const m = col.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${a})`;
  return `rgba(201,99,66,${a})`;
};
