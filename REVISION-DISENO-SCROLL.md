# Revisión de diseño, branding y scrolling — naitre

*Auditoría y recomendaciones · junio 2026. No se ha modificado código; este documento es una guía para decidir los siguientes pasos.*

---

## Veredicto rápido

El sitio está **muy por encima de la media**. El branding es coherente y maduro, y el motor de scroll (`scroll.js`) es de los mejor construidos que se ven en una landing vanilla: progresión por escena anclada, *gating* con `IntersectionObserver`, un único bucle `requestAnimationFrame` y mejora progresiva real. No hay nada roto que arreglar.

La pregunta correcta no es "¿cómo añado más frescura?" sino "¿cómo hago que la frescura que ya hay se sienta más fluida, más nativa y más segura en accesibilidad?". Casi todas las recomendaciones de abajo van en esa dirección.

---

## 1. Diseño y branding

### Lo que está muy bien

La identidad **Première Lumière** está aplicada con disciplina, no como decoración. El acento terracota se usa racionado (chispa del hero, CTA, subrayados, numerales) tal como exige el manifiesto y el `CLAUDE.md`. La voz de "cuaderno de laboratorio" se nota en los detalles correctos: el *eyebrow* vertical, las coordenadas (`48.8566° N · 2.3522° E`), la etiqueta `fig. 01`, los numerales de acto en romano gigantes detrás de cada sección, y los índices `decimal-leading-zero` en servicios. Es justo el tipo de "instrumentación, no narración" que pide la filosofía.

Técnicamente, el design system está bien encapsulado: los tokens viven en `vendor/naitre/tokens.css` como fuente única de verdad y `index.html` solo los aliasa. Eso es exactamente lo que permite mantener la paleta sincronizada con `naitre-inventario` sin duplicar valores.

### Puntos a revisar

**Discrepancia entre el manifiesto y los tokens implementados.** El `design-philosophy.md` define ink `#191713`, ivory `#f9f7f1`, y dos acentos sistémicos —azul pizarra `#5d7e9c` y verde musgo `#6f7d54`— "como lecturas de instrumento al borde de la página". Los tokens reales usan otros valores (`--bg #f5f6f7`, `--ink #181b20`) y **no usan los acentos azul/verde en ningún sitio**. No es un error —la simplificación a un solo acento es defendible y más limpia— pero conviene decidir conscientemente: o se actualiza el manifiesto para que refleje la realidad, o se recuperan esos acentos sistémicos en micro-detalles (coordenadas, números de fig., el riel de progreso) para enriquecer la "lectura de instrumentos" sin romper la regla del terracota único.

**Coherencia del wordmark.** La marca es "Naître" (con diéresis, del francés *naître*) pero en UI aparece en minúsculas como "naitre". Es una decisión de estilo válida y consistente en todo el sitio; solo conviene que esté documentada como intencional para que no se "corrija" por error más adelante.

**El bloque oscuro de IA** es el único momento de inversión de contraste de la página y funciona muy bien como acto central. Mantenlo como excepción; si en el futuro se añade otra sección oscura, perdería su fuerza dramática.

---

## 2. El scrolling: diagnóstico de "frescura"

El sitio ya tiene cinco capas de movimiento ligado al scroll, y están bien repartidas:

| Capa | Qué hace | Estado |
|---|---|---|
| Hero de partículas | Campo que se condensa en la marca + ignición terracota | Excelente, es la pieza estrella |
| Escenas *sticky* | Hero (220vh) y Proceso (340vh) anclados con progreso 0→1 | Sólido, patrón correcto |
| Parallax | Imágenes de IA y "nosotros" con profundidad | Bien, sutil |
| Reveals | Entrada escalonada con blur→nítido | Bien |
| Micro-interacción | Botones magnéticos, tilt 3D, riel lateral | Bien, y correctamente limitado a puntero fino |

**Lo más importante que haces bien:** no usas una librería de *smooth scroll* (tipo Lenis). El scroll sigue siendo nativo, y eso es una decisión acertada. Las librerías de scroll secuestrado entran en conflicto directo con `scroll-snap` y con secciones *sticky*, y en móvil el conflicto es especialmente grave ([análisis Lenis vs scroll-snap, 2026](https://raoulcoutard.com/posts/2026-02-03-lenis-scrollsnap-conflict-en/)). Tu enfoque —scroll nativo + `position: sticky` + progreso calculado— es justamente el camino que evita ese problema. **No lo cambies.**

### Riesgos reales a vigilar

**Las pistas largas son *scrolljacking* suave.** El hero ocupa 220vh y Proceso 340vh: el usuario scrollea 2-3 pantallas para avanzar lo que visualmente parece una. El patrón *sticky* es la forma "buena" de hacerlo (no captura el evento de scroll, no desorienta como el secuestro duro), pero Nielsen Norman Group documenta que el scrolljacking, incluso suave, "genera más dolor que beneficio" cuando alarga el recorrido sin recompensa proporcional ([NN/g, Scrolljacking 101](https://www.nngroup.com/articles/scrolljacking-101/)). Recomendación: mide si 340vh en Proceso es necesario o si con 240-260vh el ritmo mejora. La regla es que cada 100vh extra de pista debe entregar contenido o asombro que lo justifique.

**El scroll horizontal de Proceso es el punto más delicado en accesibilidad.** El scroll horizontal tiene coste de interacción alto y es problemático para usuarios con baja visión, movilidad reducida o que navegan por teclado ([Bogdan, a11y horizontal scroll](https://cerovac.com/a11y/2024/02/consider-accessibility-when-using-horizontally-scrollable-regions-in-webpages-and-apps/); [NN/g, Scrolling and Scrollbars](https://www.nngroup.com/articles/scrolling-and-scrollbars/)). Tu *fallback* vertical con `prefers-reduced-motion` es correcto, pero en el modo activo conviene: dar `tabindex="0"` y un `aria-label` a la región desplazable, garantizar que el contenido es alcanzable por foco secuencial, y reforzar el indicador de progreso (ya tienes la barra inferior — hazla más visible). Es contenido suplementario (las 4 fases), no navegación crítica, así que el patrón es aceptable; solo hay que blindar el teclado.

**Core Web Vitals con el canvas del hero.** Un hero animado pesado puede penalizar LCP e INP ([UI Deploy, scrollytelling guide 2025](https://ui-deploy.com/blog/complete-scrollytelling-guide-how-to-create-interactive-web-narratives-2025)). Tu `anti-flash` y el `font-display: swap` ayudan, pero merece la pena medir con Lighthouse en móvil: que el LCP (probablemente el `<h1>`) entre por debajo de 2,5 s y que el canvas no bloquee el primer pintado.

---

## 3. Un camino recomendado para el scrolling

En orden de impacto/esfuerzo. Todo es opcional y aditivo; nada obliga a reescribir el motor actual.

### Prioridad alta — fluidez sin coste

**a) Migrar reveals y parallax a *scroll-driven animations* nativas de CSS (`view()`).** Hoy resuelves reveals y parallax con JS (`IntersectionObserver` + `rAF`). Desde 2026 las animaciones ligadas a scroll nativas (`scroll()` y `view()`) tienen ~85% de soporte: Chrome/Edge/Opera completo, Safari 26 completo, Firefox tras flag ([MDN, scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations); [Chrome for Developers](https://developer.chrome.com/blog/scroll-triggered-animations)). La ventaja clave: corren en el hilo del compositor, así que **siguen fluidas aunque el hilo principal esté ocupado** (por ejemplo, mientras el canvas del hero calcula partículas). El patrón recomendado es `animation-duration: 1ms` + `animation-timeline: view()`, con degradado natural: el navegador que no lo entiende simplemente deja el elemento en su estado final ([Josh Comeau, Scroll-Driven Animations](https://www.joshwcomeau.com/animation/scroll-driven-animations/)). Mantén el JS para lo que CSS no puede hacer (el canvas), y deja que CSS lleve reveals/parallax. Resultado: menos trabajo en el hilo principal y scroll más sedoso, sobre todo en móvil de gama media.

**b) Tokens de movimiento.** Define `--motion-duration`, `--motion-easing` y un `--motion-scale` en el design system, con sus overrides bajo `prefers-reduced-motion`. Hoy el `reduced-motion` apaga casi todo con `!important`; un sistema de tokens permite *reducir* el movimiento (más sobrio) en vez de *eliminarlo*, que es la práctica recomendada actual ([CSS Scroll-Driven, accessibility standards](https://www.css-scroll-driven.com/accessibility-inclusive-motion-standards/)). Encaja perfectamente con tu enfoque ya tokenizado.

### Prioridad media — frescura percibida

**c) Acortar la pista de Proceso** (340vh → ~260vh) y medir el ritmo. Menos esfuerzo de scroll por la misma historia se siente más fresco, no menos.

**d) Blindar la accesibilidad del scroll horizontal:** `tabindex`, `aria-label`, foco secuencial alcanzable e indicador de progreso reforzado (ver §2).

**e) Punto de respiro entre actos.** Las narrativas de scroll que mejor envejecen "preservan espacio de respiro, puntos de salida y CTAs visibles" ([UI Deploy 2025](https://ui-deploy.com/blog/complete-scrollytelling-guide-how-to-create-interactive-web-narratives-2025)). Tu nav fija ya da una salida permanente (bien). Considera un respiro de ivory más amplio justo antes y después del bloque oscuro de IA para que el contraste "respire".

### Lo que NO recomiendo

- **No añadas Lenis ni *smooth scroll* por JS.** Romperá el *sticky* y cualquier futuro `scroll-snap`, y empeora el móvil ([Uncut, 2026](https://raoulcoutard.com/posts/2026-02-03-lenis-scrollsnap-conflict-en/); [Beamtic](https://beamtic.com/scrolljacking-a-ux-problem)). El scroll nativo que ya tienes es la opción correcta.
- **No abuses de `scroll-snap` a pantalla completa.** Convertir cada sección en un *snap* obligatorio es otra forma de secuestro y choca con tus secciones ancladas. Si lo usas, que sea `proximity`, no `mandatory`, y nunca sobre las secciones *sticky*.
- **No metas más capas de parallax.** Ya estás en el límite sano; más profundidad simultánea diluye el efecto y sube el coste de render.

---

## 4. Resumen accionable

1. Decidir la discrepancia manifiesto ↔ tokens (acentos azul/verde): documentar o recuperar.
2. Migrar reveals + parallax a `animation-timeline: view()` (mantener JS solo para el canvas).
3. Introducir tokens de movimiento con overrides de `prefers-reduced-motion`.
4. Acortar la pista de Proceso y medir el ritmo.
5. Reforzar accesibilidad del scroll horizontal (teclado + foco + indicador).
6. Medir Core Web Vitals en móvil (LCP < 2,5 s, INP estable).
7. Mantener: scroll nativo, terracota racionado, bloque IA como única inversión, *fallbacks* de reduced-motion.

---

## Fuentes

- [MDN — CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [MDN — Scroll-driven animation timelines](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations/Timelines)
- [Chrome for Developers — Scroll-triggered animations](https://developer.chrome.com/blog/scroll-triggered-animations)
- [Chrome for Developers — How NRK uses scroll-driven animations](https://developer.chrome.com/blog/nrk-casestudy)
- [Josh W. Comeau — Scroll-Driven Animations](https://www.joshwcomeau.com/animation/scroll-driven-animations/)
- [NN/g — Scrolljacking 101](https://www.nngroup.com/articles/scrolljacking-101/)
- [NN/g — Scrolling and Scrollbars](https://www.nngroup.com/articles/scrolling-and-scrollbars/)
- [Uncut — Why Lenis Broke My Scroll-Snap (2026)](https://raoulcoutard.com/posts/2026-02-03-lenis-scrollsnap-conflict-en/)
- [Beamtic — Avoid Scrolljacking and Smooth-scroll Effects](https://beamtic.com/scrolljacking-a-ux-problem)
- [Bogdan — Accessibility of horizontally scrollable regions](https://cerovac.com/a11y/2024/02/consider-accessibility-when-using-horizontally-scrollable-regions-in-webpages-and-apps/)
- [CSS Scroll-Driven — Accessibility & Inclusive Motion Standards](https://www.css-scroll-driven.com/accessibility-inclusive-motion-standards/)
- [UI Deploy — Complete Scrollytelling Guide 2025](https://ui-deploy.com/blog/complete-scrollytelling-guide-how-to-create-interactive-web-narratives-2025)
- [Lovable — Scrolling Designs: 8 Patterns (2026)](https://lovable.dev/guides/scrolling-designs-patterns-when-to-use)
