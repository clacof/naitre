/* utils.js — utilidades puras de animación + un singleton de media query.
 * Sin dependencias. Cópialas tal cual junto a engine.js. */

// Singleton: reutiliza la misma MediaQueryList para reduce-motion en todo el app.
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp  = (a, b, t) => a + (b - a) * t;

// Curvas de easing comunes (t ∈ [0,1]).
export const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut   = t => 1 - Math.pow(1 - t, 3);

// Convierte #rrggbb (o #rgb / rgb()) + alpha a rgba(). Útil para leer un token
// CSS de color y pintarlo en canvas con opacidad variable.
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
  return `rgba(0,0,0,${a})`;
};
