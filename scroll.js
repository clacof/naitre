/* scroll.js — motor de scrollytelling de naitre (vanilla, sin dependencias)
 *
 * Première Lumière · del ruido a la forma, de la idea al software.
 *
 * Piezas:
 *   1. SceneEngine — núcleo reutilizable: progreso 0→1 por escena anclada (sticky),
 *      con gating por IntersectionObserver y un único bucle requestAnimationFrame.
 *   2. initHero — Acto I: campo de partículas vivo que reacciona al cursor y se
 *      condensa en la marca, con filamentos de luz, destello (bloom) y la única
 *      ignición terracota sincronizada con el titular.
 *   3. initScrollRail — riel de progreso lateral (cuaderno de laboratorio).
 *   4. initMagnetic — botones magnéticos.
 *   5. initTilt — tarjetas IA con inclinación 3D al puntero.
 *
 * Mejora progresiva: sin JS o con prefers-reduced-motion, el hero se queda con su
 * SVG estático y nada de esto se activa (salvo el riel, que es solo un indicador).
 */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  /* ===============================================================
   *  1. SceneEngine — progreso por escena anclada
   * =============================================================== */
  const scenes = [];
  let running = false;

  const tick = () => {
    let anyActive = false;
    for (const s of scenes) {
      if (!s.active) continue;
      anyActive = true;
      const rect = s.el.getBoundingClientRect();
      let p;
      if (s.mode === 'view') {
        // progreso del elemento cruzando el viewport (estilo CSS view())
        const vh = window.innerHeight;
        p = clamp((vh - rect.top) / (vh + rect.height));
      } else {
        const dist = s.el.offsetHeight - window.innerHeight;
        p = dist > 0 ? clamp(-rect.top / dist) : rect.top <= 0 ? 1 : 0;
      }
      s.onProgress(p);
    }
    if (anyActive) requestAnimationFrame(tick);
    else running = false;
  };

  const startLoop = () => {
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  };

  const registerScene = (el, onProgress, mode = 'pin') => {
    const scene = { el, onProgress, active: false, mode };
    scenes.push(scene);
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => { scene.active = e.isIntersecting; });
        if (scenes.some(s => s.active)) startLoop();
      },
      { rootMargin: '0px' }
    );
    io.observe(el);
    return scene;
  };
  const registerView = (el, onProgress) => registerScene(el, onProgress, 'view');

  /* ===============================================================
   *  2. Acto I — hero de partículas vivo
   * =============================================================== */
  const initHero = () => {
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
      cx = mobile ? W * 0.5 : W * 0.82;   // sangra hacia el borde derecho (asimetría)
      cy = mobile ? H * 0.4 : H * 0.46;
      R = Math.max(180, Math.min(Math.min(W, H) * (mobile ? 0.42 : 0.5), 520));
      readColors();
      buildParticles(mobile);
    };

    const PR = 130; // radio de influencia del cursor (px)
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

    // convierte #rrggbb (o rgb()) + alpha a rgba()
    const hexA = (col, a) => {
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

    // pintamos en rAF para incluir el tiempo (respiración / repulsión)
    let curProgress = 0, painting = false;
    const paint = ts => {
      render(curProgress, ts || 0);
      painting = false;
      // mantener vivo mientras hay interacción, respiración o formación parcial
      if (pointer.active || curProgress > 0.82 || isSettling()) requestPaint();
    };
    const isSettling = () => particles.some(p => Math.abs(p.ox) > 0.3 || Math.abs(p.oy) > 0.3);
    const requestPaint = () => { if (!painting) { painting = true; requestAnimationFrame(paint); } };

    registerScene(track, p => {
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

  /* ===============================================================
   *  3. Riel de progreso lateral
   * =============================================================== */
  const initScrollRail = () => {
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

  /* ===============================================================
   *  4. Botones magnéticos
   * =============================================================== */
  const initMagnetic = () => {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.classList.add('mag');
      const strength = 0.32;
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * strength}px, ${y * strength - 2}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  };

  /* ===============================================================
   *  5. Tarjetas IA con tilt 3D
   * =============================================================== */
  const initTilt = () => {
    document.querySelectorAll('.ai-card').forEach(card => {
      const max = 8; // grados
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add('tilting');
        card.style.transform =
          `perspective(900px) rotateX(${-py * max}deg) rotateY(${px * max}deg) translateZ(6px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
        setTimeout(() => card.classList.remove('tilting'), 160);
      });
    });
  };

  /* ===============================================================
   *  6. Actos II–V — transiciones de sección dirigidas por scroll
   * =============================================================== */
  const initSections = () => {
    const ai = document.querySelector('.ai-section');

    if (reduceMotion.matches) {
      if (ai) ai.style.setProperty('--enter', '1');
      return; // sin movimiento dirigido por scroll
    }

    // Acto II — la losa oscura de IA se eleva al entrar (escala + radio + sombra)
    if (ai) {
      registerView(ai, vp => {
        const enter = clamp((vp - 0.02) / 0.42); // entra gradual, suave
        ai.style.setProperty('--enter', easeOut(enter).toFixed(3));
      });
    }

    // Numerales de acto con parallax (plancha de atlas)
    document.querySelectorAll('section').forEach(sec => {
      registerView(sec, vp => sec.style.setProperty('--vp', vp.toFixed(3)));
    });

    // Entrada en cascada de las planchas IA: un único disparo (.in) cuando la
    // rejilla entra en viewport; el escalonado lo da la CSS con --i por tarjeta.
    // Más robusto que umbrales por tarjeta (no colapsa en un frame si el scroll
    // es rápido tras el hero alto).
    const aiGrid = document.querySelector('.ai-grid');
    if (aiGrid) {
      const cards = Array.prototype.slice.call(aiGrid.querySelectorAll('.ai-card'));
      cards.forEach((c, i) => c.style.setProperty('--i', i));
      aiGrid.classList.add('seq');
      registerView(aiGrid, p => { if (p >= 0.12) aiGrid.classList.add('in'); });
    }

    // Parallax de imágenes: profundidad sin librerías.
    // Si el navegador soporta animation-timeline:view(), lo lleva el CSS (ver
    // bloque @supports en index.html) y aquí no hacemos nada: evita transform
    // por frame en el hilo principal.
    const cssScrollDriven = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline', 'view()'));
    if (!cssScrollDriven) {
      const parallax = (sel, amp) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const host = el.closest('section') || el;
        registerView(host, vp => {
          el.style.transform = `translate3d(0, ${((0.5 - vp) * amp).toFixed(1)}px, 0)`;
        });
      };
      parallax('.ai-card--feature img', 48);
      parallax('.about-photo img', 42);
    }
  };

  /* ===============================================================
   *  7. Scroll horizontal — sección Proceso (pin + traslación lateral)
   * =============================================================== */
  const initHScroll = () => {
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

    registerScene(track, p => {
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

  /* ===============================================================
   *  arranque
   * =============================================================== */
  const boot = () => {
    initHero();
    initScrollRail();
    initSections();
    initHScroll();
    // Tilt 3D y botones magnéticos solo con puntero fino (ratón); en táctil
    // generan saltos al hacer scroll con el dedo.
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!reduceMotion.matches && finePointer) {
      initMagnetic();
      initTilt();
    }
  };
  // IMPORTANTE: app.js renderiza tarjetas/servicios en su handler de
  // DOMContentLoaded. Este módulo (deferred) corre durante 'interactive', antes
  // de que ese handler dispare. Si arrancáramos ya, no existirían las tarjetas
  // (.ai-card / .service) y la entrada escalonada las dejaría invisibles.
  // Por eso esperamos a DOMContentLoaded salvo que la carga ya esté completa.
  if (document.readyState === 'complete') {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }
})();
