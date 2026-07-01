# Recetario de actos

Cada receta es un `init*(engine)` independiente que enchufas en `initScroll()`.
Todas siguen el mismo molde: localizar el elemento, salir si no existe o si
`reduceMotion`, añadir la clase `--active`, registrar la escena. Copia la que
necesites y bórrala si no.

## 1. Scroll horizontal clavado (pin + traslación lateral)

Una fila más ancha que la pantalla se desliza en horizontal mientras la sección
queda clavada. Modo `pin`.

```js
export const initHScroll = engine => {
  const sec = document.querySelector('.hscroll');
  if (!sec) return;
  const track    = sec.querySelector('.hscroll-track');
  const viewport = sec.querySelector('.hscroll-viewport');
  const row      = sec.querySelector('.hscroll-row');
  const bar      = sec.querySelector('.hscroll-progress span');
  if (!track || !viewport || !row) return;
  if (reduceMotion.matches) return; // fallback CSS: paneles en vertical

  sec.classList.add('hscroll--active');

  let maxX = 0;
  const measure = () => { maxX = Math.max(0, row.scrollWidth - viewport.clientWidth); };

  engine.registerScene(track, p => {
    row.style.transform = `translate3d(${(-p * maxX).toFixed(1)}px,0,0)`;
    if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
  });

  // Re-medir: el ancho de la fila cambia con resize y al asentar fuentes.
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(measure, 120); }, { passive: true });
  measure();
  setTimeout(measure, 250);
};
```

CSS clave: `.hscroll--active .hscroll-track{height:260vh}` (duración) y
`.hscroll--active .hscroll-viewport{position:sticky;top:0;height:100dvh;overflow:hidden}`.

## 2. Parallax de profundidad (modo view)

```js
const parallax = (sel, amp) => {
  const el = document.querySelector(sel);
  if (!el) return;
  const host = el.closest('section') || el;
  engine.registerView(host, vp => {
    el.style.transform = `translate3d(0, ${((0.5 - vp) * amp).toFixed(1)}px, 0)`;
  });
};
parallax('.feature img', 48);
```

Antes de registrarlo, comprueba si el CSS puede hacerlo nativo y ahórrate el
trabajo por frame:

```js
const cssDriven = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline', 'view()'));
if (!cssDriven && !mobile) { parallax('.feature img', 48); }
```

## 3. Riel de progreso global (no necesita engine)

Una barra lateral que refleja el scroll de toda la página. Va por su cuenta con
un listener `scroll` + rAF coalescido (no por escena).

```js
export const initScrollRail = () => {
  const rail = document.createElement('div');
  rail.className = 'scroll-rail';
  rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML = '<div class="rl-track"><div class="rl-fill"></div></div><div class="rl-pct">00</div>';
  document.body.appendChild(rail);
  const fill = rail.querySelector('.rl-fill');
  const pct  = rail.querySelector('.rl-pct');
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
```

## 4. Hero de canvas dirigido por scroll (modo pin)

El patrón completo del campo de partículas es largo; lo esencial es el cableado:
el progreso del pin alimenta tanto una custom property (tipografía cinética) como
el render del canvas, y el canvas se pinta en su propio rAF para incluir el
tiempo (respiración/cursor), no solo el scroll.

```js
let curProgress = 0, painting = false;
const paint = ts => {
  render(curProgress, ts || 0);  // tu función de dibujo
  painting = false;
  // Sigue vivo mientras haya interacción aunque el scroll esté quieto.
  if (pointer.active || curProgress > 0.82) requestPaint();
};
const requestPaint = () => { if (!painting) { painting = true; requestAnimationFrame(paint); } };

engine.registerScene(track, p => {
  curProgress = p;
  stage.style.setProperty('--hp', p.toFixed(3));
  requestPaint();
});
```

Dentro de `render(progress, time)`, parte el progreso en sub-tramos para
encadenar fases (`clamp((progress - 0.5) / 0.32)` = "ignición entre el 50% y el
82%"). Lee colores con `getComputedStyle(documentElement).getPropertyValue('--accent')`
y píntalos con `hexA()` para respetar el tema claro/oscuro.

## 5. Micro-interacciones de puntero (sin engine, solo puntero fino)

Tilt 3D y botones magnéticos. Actívalos solo con ratón: en táctil generan saltos
al hacer scroll con el dedo.

```js
// En el arranque:
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (!reduceMotion.matches && finePointer) { initMagnetic(); initTilt(); }
```

```js
export const initTilt = () => {
  document.querySelectorAll('.card').forEach(card => {
    const max = 8;
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - 0.5;
      const py = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-py*max}deg) rotateY(${px*max}deg)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
};
```
