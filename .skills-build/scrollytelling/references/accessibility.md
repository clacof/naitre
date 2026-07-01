# Accesibilidad, rendimiento y móvil — lo que separa una demo de algo enviable

El scrollytelling falla más por estas decisiones que por la técnica de animación.
Trátalas como parte del diseño, no como un parche al final.

## Movimiento y vestíbulo (no es opcional)

Datos de la encuesta de WebAIM a usuarios con trastornos vestibulares: ~40% tiene
problemas con el scroll "siempre o a menudo", y **más del 50% señala el parallax**
como desencadenante de mareo o malestar. La clave no es "menos animación" sino
**qué tipo**: el riesgo está en el movimiento que simula desplazamiento en 3D —
parallax amplio, zooms, profundidad de campo, cosas que ocupan gran parte del
campo visual. Una barra de progreso lenta y pequeña es inofensiva.

Reglas:
- **`prefers-reduced-motion` corta el movimiento dirigido, no el contenido.** Con
  reduce-motion la historia debe seguir leyéndose entera, solo sin la coreografía.
  El SceneEngine ya hace `if (reduceMotion.matches) return;` por acto.
- **Parallax sutil o nada.** Amplitudes pequeñas (decenas de px), nunca capas
  enteras volando. Si dudas, quítalo.
- **El contenido no depende del scroll.** Texto e info esenciales accesibles y
  navegables aunque el JS no corra o el usuario no complete el scroll. El
  scrollytelling es *mejora progresiva*, no requisito.

## No secuestres el scroll (scrolljacking)

El antipatrón más odiado: interceptar la rueda/el gesto para "tomar el control"
del scroll (un `wheel` que avanza de sección en sección, swipe-takeover). Rompe
la velocidad nativa, el momentum, la barra de scroll, los anclajes y el teclado.

Este patrón **no secuestra**: clava con `position: sticky` y lee la posición —
el scroll nativo se preserva intacto. Mantenlo así. Si alguna vez te ves
escuchando `wheel`/`touchmove` y llamando `preventDefault` para mover la
narrativa, párate: casi siempre hay una solución con sticky + progreso.

## Móvil: ¿seguir scrolly o apilar?

No todo acto sobrevive a una pantalla pequeña. Decide por acto:

- **Mantén el scroll** solo si la transición es *significativa*: cambio a lo largo
  del tiempo o movimiento espacial que se entiende mejor en movimiento. Reduce
  flair, no la idea.
- **Apila (stack)** charts/paneles independientes cuando: la animación penaliza el
  rendimiento, cada paso se entiende igual de bien como pieza estática, necesitas
  otro tipo de gráfico que quepa en vertical, o vas con el tiempo justo. A menudo
  es la mejor opción móvil, no la peor.
- **Evita** el *stepper* (obliga a hacer clic) y el *swipe/tap takeover* (pisa el
  scroll nativo). El sentido del scrollytelling es no esconder contenido tras
  interacción.

Pacing: en móvil el cansancio llega antes. Pocos pasos, al grano, y fuera.

## El detalle de `vh` en móvil

`vh` es cómodo pero las barras de URL móviles cambian de tamaño al hacer scroll y
mueven el `100vh`, lo que desincroniza disparadores calculados con `vh`. Dos
defensas, ya integradas en este patrón:
- El engine calcula el progreso con `window.innerHeight` **vivo cada frame** (no
  con un `vh` cacheado), así que es resistente a ese cambio.
- En CSS, usa **`dvh`** para la altura del stage sticky (`height: 100dvh`): se
  ajusta a la barra dinámica y evita saltos.

## Toque: sustituye el hover

Las interacciones de hover no existen en táctil y, peor, los `pointermove` ligados
al scroll pueden disparar efectos sin querer mientras el usuario solo desplaza.
Por eso tilt 3D y botones magnéticos van **solo con puntero fino**
(`(hover:hover) and (pointer:fine)`). En táctil, reemplaza el hover por texto o
anotación fija que comunique lo mismo sin gesto.

## Rendimiento (Core Web Vitals)

- **Anima solo `transform`/`opacity`/`filter`.** El resto fuerza layout/paint.
- **`will-change` con cuentagotas.** Solo en el elemento que de verdad se mueve y
  mientras se mueve; abusar reserva memoria de más.
- **Reserva el espacio del sticky/pin** para no provocar CLS al clavarse.
- **rAF encendido bajo demanda.** El engine ya apaga el bucle fuera de pantalla
  (IntersectionObserver); no añadas listeners de `scroll` globales por acto.
- **Media ligera:** AVIF/WebP, `loading="lazy"` bajo el pliegue, dimensiones
  explícitas para evitar saltos. LCP < 2.5s o el SEO sufre por bonita que sea.

Fuentes: The Pudding *Responsive scrollytelling best practices*; WebAIM survey
vía Smashing/Webflow; WebKit *Responsive Design for Motion*; guías de Webflow,
Shorthand y Lovable sobre patrones de scroll.
