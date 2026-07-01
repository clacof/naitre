# Contrato HTML/CSS de las escenas

El motor (`engine.js`) no toca el layout: solo lee `getBoundingClientRect()` y te
entrega `p ∈ [0,1]`. Para que `p` signifique algo, el HTML/CSS debe darle a cada
escena la geometría correcta. Hay dos contratos, uno por modo.

## Modo `pin` — sección clavada con scroll interno

La idea: una pista (`*-track`) **más alta que el viewport** que contiene un
escenario (`*-stage`) en `position:sticky`. Mientras recorres el sobrante de la
pista, el escenario queda clavado y `p` va de 0 a 1. Es la base del hero
cinético, del scroll horizontal y de cualquier "se queda fijo mientras pasa algo".

```html
<header class="hero">
  <div class="hero-track">         <!-- alto > viewport: define la duración -->
    <div class="hero-stage">       <!-- sticky: lo que el usuario ve clavado -->
      <canvas class="hero-canvas"></canvas>
      <h1>…</h1>
    </div>
  </div>
</header>
```

```css
/* La clase --active la añade el JS: si el JS no corre (o reduce-motion),
   la sección se comporta como un bloque normal sin clavar nada. */
.hero--active .hero-track { height: 220vh; }          /* duración del acto */
.hero--active .hero-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;   /* dvh: evita saltos con la barra de URL en móvil */
}
```

```js
engine.registerScene(track, p => {
  stage.style.setProperty('--hp', p.toFixed(3)); // 0→1 durante el pin
});
```

Reglas:
- El `height` de la pista **es** la duración. 220vh ≈ "el acto dura ~1.2 pantallas
  de scroll". Más alto = más lento y con más recorrido para animar.
- El stage debe medir ≤100vh para que el sticky tenga sobrante que recorrer.
- `dist = track.offsetHeight - innerHeight`. Si la pista no es más alta que el
  viewport, no hay recorrido y `p` salta de 0 a 1 — por eso 220vh, no 100vh.

## Modo `view` — revelar al cruzar el viewport

La idea: no clavas nada. `p` describe el progreso del elemento **cruzando** la
ventana (0 = acaba de asomar por abajo, 1 = acaba de salir por arriba). Ideal
para parallax, números de acto y entradas suaves.

```html
<section class="ai-section">…</section>
```

```js
engine.registerView(ai, vp => {
  // Recorta el tramo útil: solo anima entre el 2% y el 44% de la travesía.
  const enter = clamp((vp - 0.02) / 0.42);
  ai.style.setProperty('--enter', easeOut(enter).toFixed(3));
});
```

```css
.ai-section {
  /* El JS escribe --enter de 0→1; el CSS hace el trabajo visual. */
  transform: scale(calc(.984 + var(--enter,1) * .016));
  border-radius: calc((1 - var(--enter,1)) * 28px) calc((1 - var(--enter,1)) * 28px) 0 0;
}
```

Nota el `var(--enter, 1)`: el **valor por defecto es el estado final**. Así, si
el JS nunca corre, la sección aparece ya asentada en vez de rota.

## Por qué custom properties y no `el.style.transform`

Escribir `--hp`/`--enter` y dejar el `transform` en CSS te da gratis:
- **Fallbacks declarativos**: media queries apagan el efecto en móvil sin tocar JS.
- **`@supports`**: si el navegador soporta `animation-timeline: view()`, dejas que
  el CSS conduzca el parallax y ni registras la escena (un transform menos por
  frame en el hilo principal).
- **Separación limpia**: el JS produce un número; el CSS decide qué significa.

## Patrón de entrada en cascada (un disparo, escalonado por CSS)

Para revelar una rejilla de tarjetas en cascada, no registres una escena por
tarjeta (frágil si el scroll es rápido). Dispara una clase una sola vez y deja
que el CSS escalone con `--i`:

```js
cards.forEach((c, i) => c.style.setProperty('--i', i));
grid.classList.add('seq');                          // estado oculto inicial
engine.registerView(grid, p => { if (p >= 0.12) grid.classList.add('in'); });
```

```css
.grid.seq .card        { opacity: 0; transform: translateY(56px); }
.grid.seq.in .card     {
  opacity: 1; transform: none;
  transition: opacity .6s, transform .6s;
  transition-delay: calc(var(--i) * .08s);          /* el escalonado */
}
```
