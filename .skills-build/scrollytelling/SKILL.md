---
name: scrollytelling
description: >-
  Construye scrollytelling (narrativa dirigida por scroll) vanilla y sin
  dependencias: secciones que se clavan mientras pasa algo, scroll horizontal,
  parallax de profundidad, riel de progreso, heroes de canvas dirigidos por
  scroll, entradas en cascada y micro-interacciones de puntero. Usa esta skill
  siempre que el usuario quiera animar contenido al hacer scroll, "que algo se
  quede fijo mientras se desplaza", efectos de scroll, pinned sections, scroll
  horizontal, parallax, una landing animada o storytelling visual — aunque no
  diga la palabra "scrollytelling" y aunque esté tentado de alcanzar GSAP /
  ScrollMagic / Locomotive. El patrón aquí es ligero, accesible y sin librerías.
---

# Scrollytelling vanilla — patrón SceneEngine

Una forma probada de hacer narrativa dirigida por scroll **sin librerías**
(nada de GSAP, ScrollTrigger, Locomotive ni Lenis): un único motor de escenas
que convierte la posición de scroll en un progreso `0→1` por sección y deja que
tú (o el CSS) decidas qué animar. Extraído del sitio de Naître Studio.

## Primero pregunta: ¿lo hace el CSS solo?

Desde finales de 2024 la plataforma anima ligado al scroll **sin JavaScript** vía
`animation-timeline: scroll()` / `view()`. Es más barato y más fluido que
cualquier motor. **Elige la capa más baja que resuelva el efecto:**

- **Capa 0 · CSS scroll-driven** — reveals al entrar, parallax por imagen, barras
  de progreso, fades. Si cabe aquí, hazlo aquí. Ver `references/css-scroll-driven.md`.
- **Capa 1 · SceneEngine (este patrón)** — cuando necesitas *un número* `p` para
  canvas/WebGL/lógica, coreografía sincronizada entre varios elementos (scroll
  horizontal), o soporte amplio hoy sin polyfill.

No es uno u otro: lo idiomático es CSS por defecto y JS donde el CSS no llega,
dejando que el engine se salte la escena si el navegador ya la conduce en CSS.

## Por qué este patrón (capa 1) y no una librería

- **Un solo bucle rAF, encendido bajo demanda.** Las escenas se activan por
  `IntersectionObserver`; el `requestAnimationFrame` solo gira si hay alguna
  escena visible. Fuera de pantalla: cero trabajo por frame, cero batería.
- **El JS produce un número, el CSS hace el movimiento.** El callback escribe una
  custom property (`--hp`, `--enter`, `--vp`) y el `transform` vive en CSS. Eso
  da fallbacks declarativos, soporte de `@supports (animation-timeline:view())`
  y mantiene el layout fuera del hilo JS.
- **Accesibilidad de serie.** `prefers-reduced-motion` y "móvil" cortan los
  efectos en seco, y los valores por defecto de las custom properties son el
  **estado final**, así que sin JS la página se ve asentada, no rota.
- **Ligero y auditable.** El motor entero cabe en ~60 líneas (`references/engine.js`).

## Los dos modos de escena (esto es el 80% del trabajo)

Todo se reduce a registrar una escena y recibir `p ∈ [0,1]`:

- **`pin`** — para "se queda fijo mientras pasa algo". Una pista más alta que el
  viewport contiene un hijo `position:sticky`; `p` recorre el sobrante. Base del
  hero cinético y del scroll horizontal.
- **`view`** (`registerView`) — para "revelar al cruzar la pantalla". No clava
  nada; `p` es el progreso del elemento atravesando el viewport. Base del
  parallax y de las entradas.

```js
import { createSceneEngine } from './engine.js';
const engine = createSceneEngine();

// pin: p=0 al clavarse, p=1 al terminar el recorrido
engine.registerScene(track, p => stage.style.setProperty('--hp', p.toFixed(3)));

// view: p=0 al asomar por abajo, p=1 al salir por arriba
engine.registerView(section, vp => section.style.setProperty('--vp', vp.toFixed(3)));
```

El contrato HTML/CSS que hace que `p` signifique algo (alturas de pista, sticky,
defaults) está en **`references/css-contract.md`** — léelo antes de escribir el
primer acto, es donde se cometen los errores.

## Flujo de trabajo para construir un acto

1. **Decide el modo.** ¿Algo se queda fijo mientras pasa contenido? → `pin`.
   ¿Algo entra/parallax al pasar? → `view`.
2. **Monta el contrato HTML/CSS** de `references/css-contract.md`. Para `pin`,
   recuerda: la pista define la duración (`height: 220vh`), el stage es `sticky`
   y mide ≤100vh.
3. **Escribe `initMiActo(engine)`** siguiendo el molde de `references/recipes.md`:
   localizar el elemento → salir si no existe o si `reduceMotion` → añadir clase
   `--active` → `engine.registerScene/View`.
4. **Anima desde el progreso.** Escribe una custom property y deja el `transform`
   en CSS; o, para canvas, parte `p` en sub-tramos (`clamp((p-0.5)/0.32)`) para
   encadenar fases.
5. **Enchúfalo en `initScroll()`** y arráncalo *después* de renderizar el DOM que
   las escenas necesitan.

## Arranque

```js
// scroll/index.js
import { reduceMotion } from './utils.js';
import { createSceneEngine } from './engine.js';
import { initHero }     from './hero.js';
import { initSections } from './sections.js';
import { initHScroll }  from './hscroll.js';

export const initScroll = () => {
  const engine = createSceneEngine();   // UN motor compartido por todos los actos
  initHero(engine);
  initSections(engine);
  initHScroll(engine);

  // Micro-interacciones de puntero solo con ratón: en táctil saltan al scrollear.
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reduceMotion.matches && fine) { /* initTilt(); initMagnetic(); */ }
};
```

```js
// main.js — orden importa: el DOM debe existir antes que las escenas
import { initApp } from './app.js';
import { initScroll } from './scroll/index.js';
const start = () => { initApp(); initScroll(); };
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', start)
  : start();
```

## No secuestres el scroll

El antipatrón que más se odia: interceptar la rueda/el gesto (`wheel` +
`preventDefault`, swipe-takeover) para "avanzar de sección". Rompe la velocidad
nativa, el momentum, los anclajes y el teclado. Este patrón **clava con
`position: sticky` y solo lee la posición** — el scroll nativo queda intacto.
Si te ves escuchando `wheel`/`touchmove` para mover la narrativa, párate: casi
siempre hay solución con sticky + progreso.

## Reglas que evitan el 90% de los bugs

- **No leas y escribas layout fuera del `tick`.** El motor ya agrupa la lectura
  de `getBoundingClientRect`. Dentro de `onProgress` solo escribe estilos.
- **Anima solo `transform`/`opacity`/`filter`.** Lo demás (`width`, `top`,
  `box-shadow`) fuerza layout/paint por frame y mata los 60fps.
- **`overflow: clip`, no `hidden`.** `hidden` crea un scroll container que
  interfiere con timelines CSS y con la medición; `clip` recorta sin ese efecto.
- **Re-mide tras resize y tras asentar fuentes.** Anchos y alturas cambian; en
  scroll horizontal, `setTimeout(measure, 250)` evita un track mal medido.
- **Toda escena puede no existir.** `if (!el) return;` al principio: la skill se
  copia entre páginas que no tienen todas las secciones.
- **Default = estado final.** Usa `var(--enter, 1)` (no `0`) para que sin JS la
  sección aparezca terminada.
- **`reduceMotion` corta el movimiento, no el contenido.** Con reduce-motion la
  historia se lee entera, solo sin coreografía. Parallax: sutil o nada (>50% de
  usuarios vestibulares lo señalan como desencadenante de mareo).
- **Móvil: `dvh` para el sticky** y decide por acto si seguir scrolly o apilar.
  Desactiva transforms por frame en `(max-width:760px)` para ganar fluidez táctil.

## Recursos

- `references/engine.js` — el SceneEngine completo, agnóstico de framework. Cópialo tal cual.
- `references/utils.js` — `clamp`, `lerp`, `easeInOut`, `easeOut`, `hexA`, singleton `reduceMotion`.
- `references/css-scroll-driven.md` — **capa 0**: animaciones ligadas al scroll en CSS puro (`scroll()`/`view()`), gotchas y cuándo basta sin JS. Mira esto antes de escribir JS.
- `references/css-contract.md` — el HTML/CSS que hace funcionar `pin` y `view`, más el patrón de cascada. **Léelo antes del primer acto JS.**
- `references/recipes.md` — actos listos para copiar: scroll horizontal, parallax, riel de progreso, hero de canvas, tilt/magnético.
- `references/accessibility.md` — vestíbulo y reduce-motion, scrolljacking, móvil (scroll vs stack), `vh`/`dvh`, hover en táctil y Core Web Vitals. **Léelo antes de enviar.**
