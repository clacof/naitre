/* scroll/hero.js — Acto I: campo de partículas vivo que se condensa en la marca.
 *
 * Reacciona al cursor (repulsión), respira tras formarse y enciende la única
 * chispa terracota sincronizada con el titular. Recibe el SceneEngine.
 */

import { reduceMotion, clamp, lerp, easeInOut, hexA } from './utils.js';

const PR = 130; // radio de influencia del cursor (px)

export const initHero = engine => {
  if (reduceMotion.matches) return;

  const header = document.querySelector('.hero');
  const track = document.querySelector('.hero-track');
  const stage = document.querySelector('.hero-stage');
  const canvas = document.querySelector('.hero-canvas');
  const hint = document.querySelector('.hero-scroll-hint');
  if (!header || !track || !stage || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  header.classList.add('hero--active');

  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R = 0;
  let particles = [];
  let inkColor = '#181b20', accentColor = '#c96342';
  const pointer = { x: 0, y: 0, active: false };

  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    inkColor = (cs.getPropertyValue('--ink') || '#181b20').trim();
    accentColor = (cs.getPropertyValue('--accent') || '#c96342').trim();
  };

  // Puntos objetivo (coords unitarias) que aproximan la marca.
  const buildTargets = mobile => {
    const pts = [];
    const dens = mobile ? 0.55 : 1;
    const ring = (r, n, link) => {
      n = Math.round(n * dens);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, link: !!link });
      }
    };
    ring(1.0, 120, false);  // anillo exterior (dashed feel)
    ring(0.74, 56, true);
    ring(0.52, 38, true);
    // ticks radiales — 12 marcas, carta astronómica
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      for (let j = 0; j < 3; j++) {
        const rr = 0.6 + j * 0.04;
        pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
      }
    }
    // núcleo
    const coreN = Math.round(28 * dens);
    for (let i = 0; i < coreN; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * 0.13;
      pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr, core: true, link: true });
    }
    // arco-chispa: la única ignición terracota
    const sparkN = Math.round(52 * dens);
    for (let i = 0; i < sparkN; i++) {
      const a = -Math.PI / 2 + (i / sparkN) * (Math.PI * 1.02);
      pts.push({ x: Math.cos(a), y: Math.sin(a), spark: true });
    }
    return pts;
  };

  const buildParticles = mobile => {
    const targets = buildTargets(mobile);
    const ambient = mobile ? 22 : 54;
    particles = targets.map(t => ({
      tx: t.x, ty: t.y,
      spark: !!t.spark, core: !!t.core, link: !!t.link, ambient: false,
      sx: Math.random() * W, sy: Math.random() * H,
      delay: Math.random() * 0.34,
      seed: Math.random() * Math.PI * 2,
      depth: 0.6 + Math.random() * 0.8, // variación de tamaño/opacidad
      ox: 0, oy: 0 // offset por repulsión del cursor
    }));
    for (let i = 0; i < ambient; i++) {
      particles.push({
        tx: (Math.random() * 2 - 1) * 1.6, ty: (Math.random() * 2 - 1) * 1.15,
        spark: false, core: false, link: false, ambient: true,
        sx: Math.random() * W, sy: Math.random() * H,
        delay: Math.random() * 0.5, seed: Math.random() * Math.PI * 2,
        depth: 0.5 + Math.random() * 0.7, ox: 0, oy: 0
      });
    }
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth;
    H = stage.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mobile = W < 760;
    cx = mobile ? W * 0.5 : W * 0.82;   // móvil: centrado; desktop: sangrado a la derecha
    cy = mobile ? H * 0.12 : H * 0.46;  // móvil: marca/acento en la zona superior
    R = mobile
      ? Math.max(78, Math.min(Math.min(W, H) * 0.20, 170))   // pequeño: lee como marca, no invade el texto
      : Math.max(180, Math.min(Math.min(W, H) * 0.5, 520));
    readColors();
    buildParticles(mobile);
  };

  const pos = []; // posiciones calculadas por frame (reutilizado)

  const render = (progress, time) => {
    ctx.clearRect(0, 0, W, H);
    const ignition = clamp((progress - 0.5) / 0.32);  // 0→1 entre .50 y .82
    const breathe = clamp((progress - 0.82) / 0.18);

    // 1) posiciones de este frame (con stagger + respiración + repulsión)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const lp = easeInOut(clamp((progress - p.delay) / 0.62));
      let tx = p.tx * R + cx;
      let ty = p.ty * R + cy;
      if (p.ambient) { tx = lerp(p.sx, tx, 0.16 * lp); ty = lerp(p.sy, ty, 0.16 * lp); }
      let x = lerp(p.sx, tx, lp);
      let y = lerp(p.sy, ty, lp);
      if (breathe > 0 && !p.ambient) {
        const d = breathe * 1.6;
        x += Math.cos(time * 0.0006 + p.seed) * d;
        y += Math.sin(time * 0.0006 + p.seed) * d;
      }
      // repulsión suave del cursor (efecto "primera luz" interactivo)
      if (pointer.active) {
        const dx = x - pointer.x, dy = y - pointer.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < PR * PR) {
          const dist = Math.sqrt(dist2) || 1;
          const f = (1 - dist / PR);
          p.ox = lerp(p.ox, (dx / dist) * f * 34, 0.2);
          p.oy = lerp(p.oy, (dy / dist) * f * 34, 0.2);
        } else { p.ox = lerp(p.ox, 0, 0.12); p.oy = lerp(p.oy, 0, 0.12); }
      } else { p.ox = lerp(p.ox, 0, 0.1); p.oy = lerp(p.oy, 0, 0.1); }
      pos[i] = { x: x + p.ox, y: y + p.oy, lp, p };
    }

    // 2) destello (bloom) terracota central en la ignición
    if (ignition > 0.001) {
      const gr = R * (0.35 + 0.85 * ignition + breathe * 0.15);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
      const a = 0.26 * ignition;
      g.addColorStop(0, hexA(accentColor, a));
      g.addColorStop(0.5, hexA(accentColor, a * 0.4));
      g.addColorStop(1, hexA(accentColor, 0));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, gr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3) filamentos entre partículas internas (hairline connectors)
    if (progress > 0.42) {
      const thr = R * 0.34;
      const formAlpha = clamp((progress - 0.42) / 0.3);
      ctx.lineWidth = 1;
      for (let i = 0; i < pos.length; i++) {
        const A = pos[i];
        if (!A.p.link) continue;
        for (let j = i + 1; j < pos.length; j++) {
          const B = pos[j];
          if (!B.p.link) continue;
          const dx = A.x - B.x, dy = A.y - B.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > thr * thr) continue;
          const d = Math.sqrt(d2);
          const near = 1 - d / thr;
          const warm = ignition * (A.p.core || B.p.core ? 1 : 0.4);
          ctx.strokeStyle = warm > 0.3 ? hexA(accentColor, 0.14 * near * formAlpha)
                                       : hexA(inkColor, 0.1 * near * formAlpha);
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
          ctx.stroke();
        }
      }
    }

    // 4) partículas
    for (let i = 0; i < pos.length; i++) {
      const { x, y, lp, p } = pos[i];
      let color, alpha, size;
      if (p.spark) {
        color = accentColor;
        alpha = (0.1 + 0.9 * ignition) * lp;
        size = (1.7 + 1.4 * ignition) * p.depth;
      } else if (p.core) {
        color = ignition > 0.35 ? accentColor : inkColor;
        alpha = (0.25 + 0.65 * lp) * (0.5 + 0.5 * ignition);
        size = (1.7 + 1.4 * ignition) * p.depth;
      } else if (p.ambient) {
        color = inkColor;
        alpha = 0.1 + 0.08 * lp;
        size = 1.0 * p.depth;
      } else {
        color = inkColor;
        alpha = 0.14 + 0.5 * lp;
        size = 1.5 * p.depth;
      }
      if (p.spark && ignition > 0.05) {
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 10 * ignition;
      }
      ctx.globalAlpha = clamp(alpha);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.4, size), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    if (hint) hint.style.setProperty('--hint-opacity', String(clamp(1 - progress * 7)));
  };

  // pintamos en rAF para incluir el tiempo (respiración / repulsión)
  let curProgress = 0, painting = false;
  const isSettling = () => particles.some(p => Math.abs(p.ox) > 0.3 || Math.abs(p.oy) > 0.3);
  const paint = ts => {
    render(curProgress, ts || 0);
    painting = false;
    // mantener vivo mientras hay interacción, respiración o formación parcial
    if (pointer.active || curProgress > 0.82 || isSettling()) requestPaint();
  };
  const requestPaint = () => { if (!painting) { painting = true; requestAnimationFrame(paint); } };

  engine.registerScene(track, p => {
    curProgress = p;
    stage.style.setProperty('--hp', p.toFixed(3)); // tipografía cinética del hero
    requestPaint();
  });

  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.active = true;
    requestPaint();
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { pointer.active = false; requestPaint(); });

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { resize(); requestPaint(); }, 120);
  }, { passive: true });

  resize();
  requestPaint();

  reduceMotion.addEventListener('change', e => {
    if (e.matches) {
      header.classList.remove('hero--active');
      if (hint) hint.style.setProperty('--hint-opacity', '0');
    }
  });
};
