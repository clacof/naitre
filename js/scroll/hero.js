/* scroll/hero.js — Acto I: campo de partículas que se condensa en la marca
 * y despierta como átomo vivo: órbitas contra-rotantes con profundidad
 * elíptica, cometa terracota recorriendo el anillo exterior y núcleo que
 * late. Reacciona al cursor con física de muelle. Recibe el SceneEngine.
 */

import { reduceMotion, clamp, lerp, easeInOut, hexA } from './utils.js';

const PR = 160;       // radio de influencia del cursor (px)
const SPRING = 0.045; // retorno del muelle (rebote al soltar)
const DAMP = 0.86;    // amortiguación de la velocidad
const PUSH = 1.9;     // empuje del cursor por frame (≈42px en equilibrio)

/* Órbitas por anillo: velocidad angular (rad/ms, signo = sentido),
 * inclinación de la elipse (rad), orientación inicial y precesión.
 * El átomo se forma plano (la marca) y despierta a 3D con `breathe`. */
const RINGS = [
  { w:  0.00009, tilt: 0.55, phi: -0.55, prec:  0.000016 },
  { w: -0.00016, tilt: 0.95, phi:  0.70, prec: -0.000022 },
  { w:  0.00028, tilt: 1.15, phi:  1.90, prec:  0.000030 }
];

const ARC_START = -Math.PI / 2;
const ARC_SPAN = Math.PI * 1.02;
const COMET_SPEED = 0.00022; // fracción de arco/ms (~4.5s por recorrido)

export const initHero = engine => {
  if (reduceMotion.matches) return;

  const header = document.querySelector('.hero');
  const track = document.querySelector('.hero-track');
  const stage = document.querySelector('.hero-stage');
  const canvas = document.querySelector('.hero-canvas');
  const content = document.querySelector('.hero-content');
  const hint = document.querySelector('.hero-scroll-hint');
  if (!header || !track || !stage || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  header.classList.add('hero--active');

  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R = 0;
  let isMobile = false, bandH = 0; // móvil: banda libre sobre el texto
  let particles = [];
  let inkColor = '#181b20', accentColor = '#c96342';
  const pointer = { x: 0, y: 0, active: false };
  let gpx = 0, gpy = 0; // inclinación global suavizada (parallax de puntero)
  let cometPhase = 0;

  // Estado mutable de cada órbita (fase acumulada + precesión)
  const ringState = RINGS.map(r => ({
    w: r.w, prec: r.prec,
    cosT: Math.cos(r.tilt), sinT: Math.sin(r.tilt),
    phase: 0, phiNow: r.phi, cosP: 1, sinP: 0
  }));

  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    inkColor = (cs.getPropertyValue('--ink') || '#181b20').trim();
    accentColor = (cs.getPropertyValue('--accent') || '#c96342').trim();
  };

  // Puntos objetivo (coords unitarias) que aproximan la marca.
  const buildTargets = mobile => {
    const pts = [];
    const dens = mobile ? 0.55 : 1;
    const ring = (idx, r, n, link) => {
      n = Math.round(n * dens);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, ring: idx, baseA: a, rr: r, link: !!link });
      }
    };
    ring(0, 1.0, 120, false);  // anillo exterior (dashed feel)
    ring(1, 0.74, 56, true);
    ring(2, 0.52, 38, true);
    // ticks radiales — 12 marcas fijas, carta astronómica (contraste con las órbitas)
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
    // arco-chispa: la única ignición terracota; vive en el anillo exterior
    const sparkN = Math.round(52 * dens);
    for (let i = 0; i < sparkN; i++) {
      const a = ARC_START + (i / sparkN) * ARC_SPAN;
      pts.push({
        x: Math.cos(a), y: Math.sin(a),
        spark: true, ring: 0, baseA: a, rr: 1, arcFrac: i / sparkN
      });
    }
    return pts;
  };

  const buildParticles = mobile => {
    const targets = buildTargets(mobile);
    const ambient = mobile ? 22 : 54;
    particles = targets.map(t => ({
      tx: t.x, ty: t.y,
      ring: t.ring != null ? t.ring : -1, baseA: t.baseA || 0, rr: t.rr || 0,
      arcFrac: t.arcFrac || 0,
      spark: !!t.spark, core: !!t.core, link: !!t.link, ambient: false,
      sx: Math.random() * W, sy: Math.random() * bandH,
      delay: Math.random() * 0.34,
      seed: Math.random() * Math.PI * 2,
      depth: 0.6 + Math.random() * 0.8, // variación de tamaño/opacidad
      ox: 0, oy: 0, vx: 0, vy: 0        // muelle: offset + velocidad
    }));
    for (let i = 0; i < ambient; i++) {
      particles.push({
        tx: (Math.random() * 2 - 1) * 1.6, ty: (Math.random() * 2 - 1) * 1.15,
        ring: -1, baseA: 0, rr: 0, arcFrac: 0,
        spark: false, core: false, link: false, ambient: true,
        sx: Math.random() * W, sy: Math.random() * bandH,
        delay: Math.random() * 0.5, seed: Math.random() * Math.PI * 2,
        depth: 0.5 + Math.random() * 0.7, ox: 0, oy: 0, vx: 0, vy: 0
      });
    }
  };

  /* Geometría del átomo. En móvil se mide la banda libre real entre el borde
   * superior y el texto (.hero-content, anclado abajo por CSS) y el átomo se
   * centra y dimensiona dentro de ella: el bloom máximo (~1.35R) nunca toca
   * el h1. Con R = 0.34·banda, cy = 0.52·banda ⇒ cy + 1.35R ≈ 0.98·banda. */
  const layout = () => {
    isMobile = W < 760;
    if (isMobile) {
      const contentTop = content ? content.offsetTop : H * 0.62; // offsetTop ignora las transforms de entrada
      const free = Math.max(150, contentTop - 24);               // 24px de aire sobre el texto
      cx = W * 0.5;
      cy = free * 0.52;
      R = clamp(Math.min(free * 0.34, W * 0.34), 48, 190);
      bandH = free; // dispersión inicial y polvo ambiental confinados a la banda
    } else {
      cx = W * 0.82;  // desktop: sangrado a la derecha
      cy = H * 0.46;
      R = Math.max(180, Math.min(Math.min(W, H) * 0.5, 520));
      bandH = H;
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
    readColors();
    layout();
    buildParticles(isMobile);
  };

  const pos = []; // posiciones calculadas por frame (reutilizado)

  const render = (progress, time, dt) => {
    ctx.clearRect(0, 0, W, H);
    const ignition = clamp((progress - 0.5) / 0.32);  // 0→1 entre .50 y .82
    const breathe = clamp((progress - 0.82) / 0.18);
    const t3d = easeInOut(breathe);                    // plano (marca) → elíptico (átomo)
    const pulse = 1 + 0.09 * Math.sin(time * 0.0011) * breathe; // latido del núcleo

    // órbitas: avance de fase + precesión (solo cuando el átomo despierta)
    for (const rs of ringState) {
      rs.phase += rs.w * dt * breathe;
      rs.phiNow += rs.prec * dt * breathe;
      rs.cosP = Math.cos(rs.phiNow);
      rs.sinP = Math.sin(rs.phiNow);
    }
    if (ignition > 0) cometPhase = (cometPhase + dt * COMET_SPEED) % 1;

    // parallax de puntero (inclinación global suavizada); en móvil no hay
    // cursor: deriva autónoma lenta para que la profundidad siga leyéndose
    const drift = isMobile && !pointer.active ? breathe : 0;
    const tgx = pointer.active ? clamp((pointer.x - cx) / R, -1, 1)
                               : Math.sin(time * 0.00023) * 0.6 * drift;
    const tgy = pointer.active ? clamp((pointer.y - cy) / R, -1, 1)
                               : Math.cos(time * 0.00017) * 0.5 * drift;
    gpx = lerp(gpx, tgx, 0.06);
    gpy = lerp(gpy, tgy, 0.06);

    // proyección de un punto orbital: mezcla anillo plano ↔ elipse inclinada
    const project = (ring, angle, rr) => {
      const rs = ringState[ring];
      const a = angle + rs.phase;
      const ca = Math.cos(a), sa = Math.sin(a);
      const ey = sa * rs.cosT;
      const px = ca * rs.cosP - ey * rs.sinP;
      const py = ca * rs.sinP + ey * rs.cosP;
      return {
        x: lerp(ca, px, t3d) * rr,
        y: lerp(sa, py, t3d) * rr,
        z: sa * rs.sinT * rr * t3d // profundidad: >0 delante, <0 detrás
      };
    };

    // 1) posiciones de este frame (stagger + órbita + respiración + muelle)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const lp = easeInOut(clamp((progress - p.delay) / 0.62));
      let ux, uy, z = 0;
      if (p.ring >= 0) {
        const o = project(p.ring, p.baseA, p.rr);
        ux = o.x; uy = o.y; z = o.z;
      } else {
        ux = p.tx; uy = p.ty;
        if (p.core) { ux *= pulse; uy *= pulse; } // el núcleo late
      }
      let tx = ux * R + cx + z * R * 0.10 * gpx;
      let ty = uy * R + cy + z * R * 0.10 * gpy;
      if (p.ambient) { tx = lerp(p.sx, tx, 0.16 * lp); ty = lerp(p.sy, ty, 0.16 * lp); }
      let x = lerp(p.sx, tx, lp);
      let y = lerp(p.sy, ty, lp);
      if (breathe > 0 && !p.ambient) {
        const d = breathe * 1.6;
        x += Math.cos(time * 0.0006 + p.seed) * d;
        y += Math.sin(time * 0.0006 + p.seed) * d;
      }
      // repulsión del cursor con física de muelle (empuje + retorno con rebote)
      let fx = -SPRING * p.ox, fy = -SPRING * p.oy;
      if (pointer.active) {
        const dx = x - pointer.x, dy = y - pointer.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < PR * PR) {
          const dist = Math.sqrt(dist2) || 1;
          const f = 1 - dist / PR;
          fx += (dx / dist) * f * f * PUSH;
          fy += (dy / dist) * f * f * PUSH;
        }
      }
      p.vx = (p.vx + fx) * DAMP;
      p.vy = (p.vy + fy) * DAMP;
      p.ox += p.vx;
      p.oy += p.vy;
      pos[i] = { x: x + p.ox, y: y + p.oy, z, lp, p };
    }

    // 2) destello (bloom) terracota central en la ignición, late con el núcleo
    if (ignition > 0.001) {
      const gr = R * (0.35 + 0.85 * ignition + breathe * 0.15) * pulse;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
      const a = 0.26 * ignition * (0.85 + 0.15 * pulse);
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

    // 4) partículas (tamaño/alpha modulados por profundidad z y twinkle)
    for (let i = 0; i < pos.length; i++) {
      const { x, y, z, lp, p } = pos[i];
      let color, alpha, size;
      if (p.spark) {
        // cometa: cabezal brillante recorriendo el arco, estela que decae
        const behind = (cometPhase - p.arcFrac + 1) % 1;
        const boost = behind < 0.4 ? Math.exp(-behind * 8) * ignition : 0;
        color = accentColor;
        alpha = (0.08 + 0.5 * ignition + 0.55 * boost) * lp;
        size = (1.5 + 1.1 * ignition + 2.0 * boost) * p.depth;
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
      if (z !== 0) { // volumen: detrás más tenue y pequeño, delante al contrario
        alpha *= clamp(1 + z * 0.5, 0.3, 1.15);
        size *= 1 + z * 0.45;
      }
      if (breathe > 0 && !p.spark && !p.ambient) { // twinkle sutil
        alpha *= 1 - 0.12 * breathe * (0.5 + 0.5 * Math.sin(time * 0.0024 + p.seed * 6));
      }
      ctx.globalAlpha = clamp(alpha);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.4, size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 5) glow del cometa: un único gradiente radial (sin shadowBlur por partícula)
    if (ignition > 0.05) {
      const h = project(0, ARC_START + cometPhase * ARC_SPAN, 1);
      const hx = h.x * R + cx + h.z * R * 0.10 * gpx;
      const hy = h.y * R + cy + h.z * R * 0.10 * gpy;
      const hr = R * 0.16 * (1 + h.z * 0.35);
      const ha = 0.45 * ignition * clamp(1 + h.z * 0.5, 0.4, 1.2);
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
      g.addColorStop(0, hexA(accentColor, ha));
      g.addColorStop(1, hexA(accentColor, 0));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (hint) hint.style.setProperty('--hint-opacity', String(clamp(1 - progress * 7)));
  };

  // pintamos en rAF para incluir el tiempo (órbitas / cometa / muelle)
  let curProgress = 0, painting = false, lastT = 0, visible = true;
  const isSettling = () => particles.some(p =>
    Math.abs(p.ox) > 0.3 || Math.abs(p.oy) > 0.3 ||
    Math.abs(p.vx) > 0.05 || Math.abs(p.vy) > 0.05);
  const paint = ts => {
    const dt = lastT ? Math.min(ts - lastT, 48) : 16;
    lastT = ts;
    render(curProgress, ts || 0, dt);
    painting = false;
    // vivo mientras sea visible y haya órbitas, cometa, interacción o muelle activo
    if (visible && (pointer.active || curProgress > 0.5 || isSettling())) requestPaint();
  };
  const requestPaint = () => { if (!painting) { painting = true; requestAnimationFrame(paint); } };

  // no gastar frames cuando el hero sale del viewport
  new IntersectionObserver(entries => {
    entries.forEach(e => { visible = e.isIntersecting; });
    if (visible) { lastT = 0; requestPaint(); }
  }).observe(track);

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

  // si el texto cambia de altura (idioma, fuentes), solo se recoloca el átomo
  // — sin reconstruir partículas, que provocaría un re-scatter visible
  if (content && 'ResizeObserver' in window) {
    new ResizeObserver(() => { layout(); requestPaint(); }).observe(content);
  }

  resize();
  requestPaint();

  reduceMotion.addEventListener('change', e => {
    if (e.matches) {
      header.classList.remove('hero--active');
      if (hint) hint.style.setProperty('--hint-opacity', '0');
    }
  });
};
