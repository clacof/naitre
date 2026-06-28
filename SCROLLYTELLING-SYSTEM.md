# Sistema de scrollytelling de Naître

> Guía de referencia para construir experiencias scrollytelling en la línea de Naître. Pensada para que un agente (o persona) pueda añadir una escena nueva, o levantar un scrolly desde cero, sin reingeniería. Todo es **vanilla**: sin bundler, sin dependencias, sin librerías de scroll. Léela junto a `CLAUDE.md` (convenciones del repo) y `brand/design-philosophy.md` (*Première Lumière*).

---

## 1. Filosofía visual

El relato es siempre el mismo arco: **del ruido a la forma, de la idea al software nacido**. El scroll es el eje del tiempo de un nacimiento. Cada escena debe narrar una etapa de esa emergencia; si un movimiento no narra, se elimina.

Principios de composición (vanguardista, no la retícula centrada de siempre):

- **Romper la retícula.** Nada de contenedor centrado simétrico por defecto. Composición asimétrica, columnas desiguales, elementos que se solapan, negativo activo.
- **Contraste de escala extremo.** Una forma o palabra monumental rodeada de notaciones miniatura. La tipografía "maxi" sangra fuera del lienzo.
- **Marginalia de laboratorio.** Micro-etiquetas, coordenadas, numerales de acto, índices — voz de cuaderno de campo en los márgenes.
- **Una sola ignición terracota.** `--accent` es escaso y precioso: **una** ignición real en todo el recorrido (el hero). El resto del color es información, no atmósfera.
- **Mejora progresiva.** El contenido se lee perfecto sin una sola animación. El movimiento es una capa encima.

---

## 2. Arquitectura

```
index.html   → HTML + TODO el CSS inline (<style> en <head>). Las animaciones
               scroll-driven viven aquí como reglas que leen custom properties.
scroll.js    → motor (ESM, type="module"). No muta el DOM de contenido: solo
               escribe custom properties / clases y pinta el canvas del hero.
app.js       → store unidireccional + render de tarjetas + IntersectionObserver
               de `.reveal` (capa base de revelado, universal).
i18n.js      → todas las cadenas ES/EN. Nada hardcodeado en HTML/JS.
vendor/naitre/tokens.css → paleta (tokens --nai-color-*). NO se toca: es la
               fuente vendorizada compartida con naitre-inventario.
```

Regla de tokens: los valores de **color** se consumen del design system. Los valores de **movimiento** (duraciones, recuentos de partículas, amplitudes de parallax) son locales de la web — viven en `:root` de `index.html` o como constantes en `scroll.js`. Nunca metas motion en `tokens.css`.

---

## 3. El motor (`scroll.js`)

Un único bucle `requestAnimationFrame`, compartido por todas las escenas, con *gating* por `IntersectionObserver`: solo procesa escenas visibles; cuando no hay ninguna en viewport, el bucle se detiene (0% CPU en reposo).

### API interna

```js
// Escena ANCLADA (pin). El progreso 0→1 mapea el recorrido del pin.
// `el` debe ser el carril alto (track) que contiene un hijo sticky.
registerScene(trackEl, p => { /* p: 0→1 */ });

// Escena por VIEW-PROGRESS (estilo CSS view()). El progreso 0→1 es cuánto ha
// cruzado el elemento el viewport (0 = justo debajo, 1 = ya pasó por arriba).
// No requiere pin. Universal en todos los navegadores.
registerView(el, p => { /* p: 0→1 */ });
```

- **`pin`** se usa cuando quieres fijar algo en pantalla mientras la animación "scrubea" con el scroll (hero, scroll horizontal).
- **`view`** se usa para parallax, reveals escalonados y transiciones de entrada de sección. Más barato y sin restructurar el DOM.

Cálculo del progreso (referencia):

```
pin:  p = clamp(-rect.top / (track.offsetHeight - innerHeight))
view: p = clamp((innerHeight - rect.top) / (innerHeight + rect.height))
```

---

## 4. Contratos CSS (custom properties y clases)

El motor solo escribe estas señales; el CSS hace el resto. Esta es la “interfaz” entre `scroll.js` y `index.html`:

| Señal | La pone | La consume el CSS para |
|---|---|---|
| clase `.hero--active` | `initHero` | activar el hero anclado (track 220vh + stage sticky + canvas) |
| `--hp` (0→1) en `.hero-stage` | `initHero` | tipografía cinética del hero (la palabra monumental se desplaza/escala; el contenido se desvanece) |
| `--hint-opacity` en `.hero-scroll-hint` | `initHero` | desvanecer la pista de scroll |
| `--enter` (0→1) en `.ai-section` | `initSections` | la losa oscura que se eleva (escala + radio + sombra) |
| `--vp` (0→1) en cada `section` | `initSections` | parallax de los numerales de acto |
| clase `.seq` + `.in` en `.ai-grid`/tarjetas | `initSections` | entrada escalonada de las planchas IA |
| `transform` inline en imágenes | `initSections` | parallax de profundidad |
| clase `.hscroll--active` | `initHScroll` | activar el pin de scroll horizontal |
| `transform` inline en `.hscroll-row` + width en barra | `initHScroll` | traslación lateral y barra de progreso |
| clase `.visible` en `.reveal` | `app.js` (IO) | revelado base universal (opacidad + blur→nítido + translate) |
| clase `.mag` / `.tilting` | `initMagnetic`/`initTilt` | botones magnéticos y tilt 3D de tarjetas |

Convención: **el CSS define ambos estados** (inactivo = fallback legible; activo = animado). El motor solo conmuta. Así, sin JS o con `prefers-reduced-motion`, el inactivo es la verdad.

---

## 5. Patrones implementados (recetas)

### 5.1 Hero anclado con canvas de partículas
Estructura: `.hero > .hero-track(220vh) > .hero-stage(sticky 100vh) > canvas + contenido`. `initHero` registra un `pin` sobre `.hero-track`, pinta el canvas (ruido→marca + ignición terracota + filamentos + bloom + repulsión del cursor) y escribe `--hp` para la tipografía cinética.

### 5.2 Tipografía maxi cinética
La palabra clave del titular es un `<em>` a `display:block`, `font-size` hasta ~15rem, que sangra. Se mueve con `transform:translateX(calc(var(--hp) * -8vw))`. Contraste de escala extremo = el resto de la frase va pequeño alrededor.

### 5.3 Inmersión de sección (losa que se eleva)
`registerView` sobre la sección escribe `--enter`; el CSS interpola `transform:scale()`, `border-radius` y `box-shadow`. Entra como una losa que se asienta, sin recortar contenido.

### 5.4 Parallax de profundidad
`registerView` sobre la sección anfitriona; el callback fija `transform:translate3d(0, (0.5 - p)*amp, 0)` en la imagen. La imagen se sobredimensiona (~120%) para no dejar huecos.

### 5.5 Entrada en cascada (reveal por scroll)
Patrón robusto: **un solo disparo + escalonado por CSS**, no umbrales por tarjeta.

```css
.grid.seq .card{opacity:0;transform:translateY(56px)}
.grid.seq.in .card{
  opacity:1;transform:none;
  transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1);
  transition-delay:calc(var(--i,0) * .1s);   /* el escalonado */
}
```
```js
const cards = [...grid.querySelectorAll('.card')];
cards.forEach((c, i) => c.style.setProperty('--i', i)); // índice → retardo
grid.classList.add('seq');
registerView(grid, p => { if (p >= 0.12) grid.classList.add('in'); }); // 1 disparo
```

Por qué así y no `p >= base + k*step` por tarjeta: tras un hero alto (pin de 220vh), al llegar a la sección el progreso puede cruzar todos los umbrales en un mismo frame y las tarjetas aparecen a la vez (se percibe como un fundido, no una cascada). Con un único `.in` y el retardo en CSS, la cascada se ve siempre, sin importar la velocidad de scroll.

**Cuidado:** el estado oculto (`opacity:0`) vive solo bajo `.seq` (clase que añade el JS). Así, sin JS o con reduced-motion, las tarjetas se ven por defecto. Si las crea `app.js` desde `<template>`, no les pongas la clase `reveal` (evita doble sistema) y asegúrate de que este init corre tras el render (§9).

### 5.6 Scroll horizontal (pin + traslación)
Estructura: `.hscroll > .hscroll-track(340vh) > .hscroll-viewport(sticky 100vh, overflow hidden) > .hscroll-row(flex nowrap)`. `initHScroll` registra un `pin` y fija `row.transform = translate3d(-p*maxX,0,0)` donde `maxX = row.scrollWidth - viewport.clientWidth`. Fallback: la fila hace `flex-wrap` y se lee en vertical.

### 5.7 Marginalia y numerales de acto
Numerales romanos con `counter(act, upper-roman)` en `section::before` (cero texto hardcodeado), con parallax vía `--vp`. Eyebrow vertical (`writing-mode:vertical-rl`) y coordenadas/figuras en posiciones absolutas.

---

## 6. Accesibilidad (innegociable)

- **`prefers-reduced-motion: reduce`**: `scroll.js` no arranca los efectos con movimiento (no añade `.hero--active`/`.hscroll--active`/`.seq`, fija `--enter:1`, no hace parallax). Todo queda en su estado final, legible.
- **El pin no altera el orden del DOM** (es `position:sticky`), así que foco y lectores de pantalla recorren el contenido en secuencia natural. Nunca secuestres el scroll ni el teclado.
- **Nada solo-visual**: todo lo que comunica es texto real vía `i18n.js`; el canvas es `aria-hidden`.
- Conserva skip-link, `:focus-visible` e `inert` de modales.

---

## 7. Rendimiento

- *Gating* por `IntersectionObserver`: el rAF solo corre con una escena visible.
- Anima **solo `transform` y `opacity`** (compositor). `will-change` puntual.
- Nada de trabajo pesado en el evento `scroll`: todo se lee dentro del rAF; listeners `passive`.
- Canvas: DPR capado a 2, recuento de partículas escalado por área, menos en móvil.
- Objetivo: 60fps en móvil de gama media; 0% CPU en reposo.

---

## 8. Receta: añadir una escena nueva

### A) Escena de parallax / reveal (lo más común — usa `view`)
1. Marca el HTML (sin clases de animación; debe leerse bien tal cual).
2. En `index.html`, define los dos estados en CSS leyendo una custom property, p.ej. `--mp`:
   ```css
   .mi-elem{ transform: translateY(calc((var(--mp,.5) - .5) * 40px)); }
   ```
3. En `scroll.js`, dentro de `initSections` (rama con movimiento), registra:
   ```js
   const el = document.querySelector('.mi-seccion');
   if (el) registerView(el, p => el.style.setProperty('--mp', p.toFixed(3)));
   ```
4. Verifica el fallback con `prefers-reduced-motion` (debe quedar estático y legible).

### B) Escena anclada (pin con scrub)
1. HTML: un carril alto + hijo sticky.
   ```html
   <section class="mi-pin"><div class="mi-track">
     <div class="mi-stage"><!-- contenido fijo --></div>
   </div></section>
   ```
2. CSS: estado activo (lo conmuta una clase que añade el JS).
   ```css
   .mi-pin--active .mi-track{height:300vh}
   .mi-pin--active .mi-stage{position:sticky;top:0;height:100vh;overflow:hidden}
   ```
3. `scroll.js`: nueva `initMiPin()` llamada en `boot()`; `if (reduceMotion.matches) return;` y luego `sec.classList.add('mi-pin--active'); registerScene(track, p => { /* scrub con p */ });`
4. Re-mide tamaños en `resize` si dependes de anchos (como el scroll horizontal).

### Checklist de cierre
- [ ] Sin JS / con reduced-motion: contenido completo y legible.
- [ ] Toda cadena visible está en `i18n.js` (ES + EN).
- [ ] Solo se anima `transform`/`opacity`; `will-change` puntual.
- [ ] Una sola ignición terracota en todo el sitio.
- [ ] No se tocó `vendor/naitre/tokens.css`.
- [ ] `node --check scroll.js` y `/build-check` en verde; consola sin errores.

---

## 9. Gotchas conocidos

- **Conflictos de `transform`.** `.reveal`, el tilt y el parallax compiten por `transform` en el mismo elemento. Soluciones usadas: el parallax actúa sobre hijos no-`.reveal` (imágenes); para offsets de layout usa `margin`, no `transform`; el tilt sube su especificidad con `.tilting`.
- **`overflow-x:hidden` en `body`/`html` rompe `position:sticky`.** No lo uses para contener sangrados; sobredimensiona/recorta a nivel de componente.
- **Medir anchos antes de tiempo.** En el scroll horizontal, `scrollWidth` cambia al cargar fuentes; vuelve a medir con un `setTimeout` y en `resize`.
- **Numerales de acto y `counter`.** `counter-increment` corre en cada `section`; si una sección no debe numerarse (p.ej. el scroll horizontal), ponle `counter-increment:none`.
- **Flash del estado de respaldo (anti-FOUC).** Entre el primer pintado y el arranque del JS, los elementos de fallback (p.ej. la marca SVG estática del hero, que gira) se ven una fracción de segundo → "flash del logo". Solución: un `<script>` inline en `<head>` que marca el documento **antes del primer pintado**, y CSS que oculta el fallback bajo esa clase:
  ```html
  <script>(function(){var d=document.documentElement;d.classList.add('js');
    try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('motion');}catch(e){}})();</script>
  ```
  ```css
  .motion .hero-mark{display:none}      /* oculta el fallback ya */
  .motion .hero-canvas{display:block}   /* el canvas (en blanco) ya presente; el JS lo pinta */
  ```
  El elemento animado por JS (canvas) debe estar **posicionado y dimensionado en su regla base** (no solo bajo `.hero--active`), para que al mostrarse con `.motion` no provoque salto de layout.
- **Suavizar transiciones de sección.** Para que el paso entre secciones no sea tosco: dispara los `.reveal` un poco antes (IntersectionObserver con `rootMargin:'0px 0px -10% 0px'`, `threshold:0`), usa transiciones largas y curva suave (`1s cubic-bezier(.22,1,.36,1)`) con poco desplazamiento/blur, y mapea las inmersiones (escala/clip) sobre un rango de progreso amplio (`enter = (vp-0.02)/0.42`) con `easeOut`. Escalas pequeñas (≤2%) leen como premium; grandes, como salto.
- **Orden de arranque vs. contenido dinámico (¡crítico!).** `app.js` renderiza tarjetas IA y servicios dentro de su handler de `DOMContentLoaded`. `scroll.js` es `type="module"` (deferred) y su código *top-level* corre durante `readyState === 'interactive'`, **antes** de que ese handler dispare. Si arrancas ahí, las `.ai-card`/`.service` **todavía no existen**: la entrada escalonada añade `.seq` (opacity:0) pero nunca encuentra tarjetas que activar → **sección invisible**. Por eso `boot()` espera a `DOMContentLoaded` (los listeners disparan en orden de registro: primero el render de `app.js`, luego el `boot`):
  ```js
  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot);
  ```
  Regla general: si una escena toca elementos que crea `app.js` desde `<template>`, su init debe correr **después** del render. Defensa extra: el estado oculto (`opacity:0`) debe vivir solo bajo una clase que añade el JS (p.ej. `.seq`), nunca por defecto, para que un fallo de JS no deje contenido invisible.
