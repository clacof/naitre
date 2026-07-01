# Capa 0 — scroll-driven animations en CSS puro (úsala antes que el JS)

Desde finales de 2024 la plataforma hace sola buena parte del trabajo: animaciones
ligadas al scroll **sin JavaScript**, sin librerías y sin un bucle rAF. Antes de
registrar una escena en el SceneEngine, pregúntate si el efecto cabe aquí — es
más barato, más fluido y se degrada solo.

Soporte (junio 2026): Chrome/Edge/Opera estable desde dic-2024; Safari desde la
26 (2025); Firefox tras flag. Para el resto, hay polyfill oficial, o
simplemente sirve el estado final (la animación no corre y la página se ve bien).

## Las tres piezas

1. **target** — el elemento que animas.
2. **@keyframes** — la animación CSS de siempre.
3. **animation-timeline** — qué la hace avanzar: `scroll()` o `view()`.

```css
@keyframes grow-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }

.progress {
  transform-origin: left;
  animation: grow-progress linear;
  animation-timeline: scroll();   /* avanza con el scroll del scroller más cercano */
}
```

`view()` en cambio ata la animación a la **visibilidad del propio elemento** al
cruzar el viewport — el equivalente declarativo del modo `view` del engine:

```css
@keyframes slide-in { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:none; } }

.card {
  animation: slide-in linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 50%;  /* termina a media pantalla y se queda */
}
```

`animation-range` recorta el tramo útil: `0%` = el elemento empieza a entrar,
`100%` = acaba de salir. Pararlo en `entry 50%` evita que el contenido siga
moviéndose mientras el usuario intenta leerlo (error clásico de los reveals).

## `scroll()` vs `view()` — cuál

- **`scroll()`** — progreso del scroller completo, sin importar qué se ve. Para
  barras de progreso globales, fondos que reaccionan a toda la página.
- **`view()`** — progreso de *este* elemento atravesando la ventana. Para
  revelar tarjetas, parallax por imagen, números de sección. Es lo que querrás
  el 80% de las veces.

## Gotchas que cuestan una tarde

- **Orden de declaración.** `animation-timeline` debe ir **después** del shorthand
  `animation`, o no surte efecto. El shorthand resetea `animation-timeline` a su
  valor inicial si lo declaras antes.
- **`overflow: hidden` rompe el scroll-seeking.** Usa **`overflow: clip`** en su
  lugar; recorta igual pero no crea un scroll container que interfiere con la
  timeline.
- **Solo propiedades GPU.** Anima `transform`, `opacity` y algunos `filter`.
  `width`, `height`, `top`, `box-shadow` fuerzan layout/paint por frame y matan
  los 60fps — justo lo que el scroll-driven debería evitar.
- **Easing lineal.** Las animaciones ligadas al gesto se sienten mejor con
  `linear`: el movimiento sigue al dedo, no a una curva temporal.
- **Envuelve en reduced-motion.** `@media (prefers-reduced-motion: no-preference)`
  (o `@media not (prefers-reduced-motion)`). Sin ese guard, los reveals grandes
  marean a usuarios sensibles (ver `accessibility.md`).

## Cuándo seguir necesitando el SceneEngine (capa JS)

El CSS scroll-driven no lo hace todo. Quédate con el motor cuando:

- Necesitas **un número** `p` para alimentar canvas, WebGL o lógica (el hero de
  partículas, contadores, dibujar trayectorias).
- **Coreografía entre varios elementos** sincronizada a un mismo progreso (el
  scroll horizontal: una escena conduce fila + barra + título a la vez).
- Soporte amplio **hoy** sin depender de un polyfill, con un único fallback claro.

Patrón recomendado: **CSS por defecto, JS donde el CSS no llega**, y deja que el
engine se salte la escena si el navegador ya lo hace en CSS:

```js
const cssDriven = window.CSS?.supports?.('animation-timeline', 'view()');
if (!cssDriven) engine.registerView(el, p => el.style.setProperty('--vp', p));
```

Fuentes: WebKit "A guide to Scroll-driven Animations with just CSS" (2025),
MDN *Scroll-driven animations*, Smashing Magazine, Codrops.
