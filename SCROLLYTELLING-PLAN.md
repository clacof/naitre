# Plan — Naître scrollytelling

> De landing estática a *field study of becoming*. Convertir la web en un único relato visual de scroll: del ruido a la forma, de la idea al software nacido. Vanilla puro, sin bundler, sin dependencias externas. Respeta `CLAUDE.md` y el design system *Première Lumière*.

---

## 1. La tesis

El branding ya es un guion de scrollytelling escrito de antemano. *Première Lumière* —"primera luz"— estudia "el instante antes de que algo exista y el instante después: la semilla, la señal, el primer latido de un sistema entrando en línea". Describe el ojo viajando "del caos al orden" para entender, "sin una sola frase de explicación, que ha presenciado un nacimiento".

Eso es, literalmente, la definición de scrollytelling: una narrativa que el usuario revela al avanzar. Hoy el sitio *describe* la marca; el objetivo es que el sitio *sea* la marca en movimiento. El scroll deja de ser navegación y se convierte en el eje del tiempo de un nacimiento: partículas dispersas que se condensan, una chispa terracota que se enciende, una forma que cohere.

El principio rector no cambia: **el acento terracota (`--accent`) es escaso y precioso**. En todo el recorrido habrá una sola ignición real de terracota —el momento de "primera luz"— y el resto del color seguirá siendo información, no atmósfera.

---

## 2. Estado actual (punto de partida)

Lo que ya existe y se conserva como base:

- **`index.html`** — página única, todo el CSS inline en `<head>`. Hero con `.hero-mark` (SVG del símbolo) en rotación lenta infinita. Secciones: IA (único bloque oscuro), Servicios (lista editorial), Nosotros, Contacto.
- **`app.js`** — store unidireccional (`dispatch`/`transition`/`syncAll`), render de tarjetas desde `<template>`, modal de detalle, chat widget, y un `IntersectionObserver` que añade `.reveal.visible` con stagger.
- **`i18n.js`** — todas las cadenas ES/EN. Regla dura: nada de texto hardcodeado.
- **`vendor/naitre/tokens.css`** — paleta como tokens `--nai-color-*`, fuente única de verdad, vendorizada de `@naitre/tokens` (sincronizada con `naitre-inventario`).
- Ya hay base de accesibilidad sólida: `prefers-reduced-motion`, skip-link, focus-visible, `inert` en modal.

El sitio ya tiene un sistema de revelado al hacer scroll (`.reveal`). El plan **extiende** ese patrón hacia animación dirigida por progreso de scroll, no lo reemplaza.

---

## 3. Enfoque técnico: vanilla puro

Tres mecanismos nativos, cero dependencias:

1. **Motor de progreso de scroll** (nuevo módulo `scroll.js`, ESM). Un único bucle `requestAnimationFrame` que, para cada "escena" activa, calcula un progreso `0→1` a partir de `getBoundingClientRect()` contra la ventana. Escribe ese valor en una custom property (`--p`) sobre el elemento de escena.
2. **CSS dirigido por variables.** El CSS interpola con `calc()` usando `--p` (opacidad, `translate`, `scale`, `clip-path`). El movimiento vive en CSS; JS solo aporta el número. Esto mantiene fluidez y deja la animación declarativa.
3. **Pinning con `position: sticky`.** Cada escena de scrollytelling es un contenedor alto (el "carril" de scroll) con un hijo `sticky` que se queda fijo mientras el progreso avanza. Sin librerías de pin.

El `IntersectionObserver` existente se reutiliza para **activar/desactivar** escenas: el bucle rAF solo procesa la escena visible y se detiene cuando no hay ninguna en viewport (clave para batería y rendimiento).

**Por qué no GSAP/Lenis:** `CLAUDE.md` exige vanilla sin bundler; las tres piezas de arriba cubren el 95% de los efectos buscados sin añadir ~50KB ni una dependencia que mantener sincronizada. Si en el futuro se necesita scrubbing de timelines muy complejos, GSAP por CDN queda como puerta abierta documentada, no como requisito.

---

## 4. La narrativa: escena por escena

El recorrido completo es un solo arco —del ruido a la forma nacida—. Cinco actos sobre la estructura actual.

### Acto I · Primera luz (Hero)
**Branding:** "partículas dispersas en la periferia que se cierran en órbitas, retículas, y finalmente una figura resuelta en el corazón."

- Un `<canvas>` 2D a pantalla completa detrás del hero. Cientos de partículas (motas) nacen dispersas como ruido en el campo ivory.
- A medida que se hace scroll en el primer tramo, las partículas **interpolan** desde posiciones aleatorias (sembradas con semilla fija, reproducible) hacia las coordenadas que dibujan el símbolo de la marca (el mismo `#mark`: anillos concéntricos + ticks radiales).
- En el punto exacto de coherencia, se **enciende la chispa**: el arco terracota se traza (stroke-dashoffset) y el núcleo terracota aparece. Única ignición de `--accent` con todo su peso.
- El titular `hero_title` ("Donde las ideas *nacen*") permanece legible desde el primer frame; la palabra *nacen* en terracota se sincroniza con la ignición.
- Sustituye a la `slow-spin` actual del `.hero-mark` (que se conserva como fallback estático).

### Acto II · El útero (Sección IA)
**Branding:** "el espacio es el útero de la obra"; la sección IA es el único bloque oscuro de la página.

- Transición de ivory a `--ai-bg` no como corte, sino como **inmersión**: el fondo oscuro sube desde abajo conforme se entra (clip-path o gradiente dirigido por progreso).
- Las tarjetas IA dejan de aparecer todas con stagger fijo: emergen del fondo oscuro una a una según el progreso, como "lecturas de instrumento al borde de la página". La tarjeta `feature` (con `agents.png`) se revela última, como figura monumental.
- Micro-etiquetas tipo cuaderno de laboratorio (números de índice, coordenadas) aparecen en los márgenes —"tipografía como instrumentación"— usando cadenas nuevas en `i18n.js`.

### Acto III · Cartografía (Servicios)
**Branding:** "marcas de tick medidas dan la cadencia de una carta astronómica"; "el ritmo es generativo, elementos que se repiten con ligera variación, como división celular."

- La lista editorial de servicios se dibuja como un registro que se va trazando: cada fila entra con su línea separadora animándose de 0 a 100% de ancho al cruzar el viewport (la división celular / iteración).
- Numeración tipo índice (I, II, III…) reforzando el lenguaje de "plancha de atlas".
- El hover existente (`padding-left` + acento en `h3`) se mantiene; lo nuevo es solo el revelado dirigido por scroll.

### Acto IV · La figura resuelta (Nosotros)
**Branding:** "una forma monumental dominando el campo, rodeada de cientos de notaciones miniatura."

- El símbolo de la marca reaparece, ahora **completo y en reposo** —el sistema ya nació—. Contraste deliberado con el caos del hero: cierre del arco narrativo.
- Los cuatro pilares (Artesanía, Transparencia, Colaboración, Largo plazo) se revelan como las "notaciones miniatura" alrededor de la figura.
- La foto del estudio (`studio.png`, ya en grayscale) entra con un sutil desvelado de saturación/contraste dirigido por progreso.

### Acto V · La chispa devuelta (Contacto)
- El CTA final ("¿Tienes una idea? Hagámosla nacer") recupera el motivo de ignición: un pequeño eco de la chispa terracota del hero, cerrando el círculo "primera luz → tu próxima idea".
- Cero ornamento nuevo: una sola spark, fiel a la regla del acento racionado.

---

## 5. Arquitectura de archivos

Cambios mínimos y alineados con las convenciones del repo:

```
index.html      → + <canvas> del hero; + contenedores de escena (carriles sticky);
                  + bloque <style> de animaciones scroll-driven (sigue inline, por convención)
scroll.js       → NUEVO módulo ESM: motor de progreso (rAF), gating por IntersectionObserver,
                  motor de partículas del canvas. type="module".
app.js          → sin cambios estructurales; el IntersectionObserver de .reveal queda como
                  capa de fallback. Posible pequeño hook para que scroll.js conozca el estado.
i18n.js         → + cadenas nuevas (micro-etiquetas, numeración, labels de escena) ES/EN.
```

**Decisión sobre tokens:** los valores de *movimiento* (duraciones, easings, recuentos de partículas) son específicos de la web y **no** van en `vendor/naitre/tokens.css` (esa es la fuente vendorizada compartida con `naitre-inventario`; meter motion ahí obligaría a sincronizar algo que el ERP no usa). Se definen como custom properties locales en el `:root` de `index.html`, junto a los alias actuales. Los tokens de *color* se siguen consumiendo del design system sin tocarlos.

---

## 6. Accesibilidad (no negociable)

El scrollytelling es **mejora progresiva**: el contenido debe ser completo y legible sin una sola animación.

- **`prefers-reduced-motion: reduce`** → el motor rAF no arranca; el canvas se pinta una sola vez en su estado final (la marca ya formada, chispa encendida); las escenas muestran su estado final directamente. Esto extiende el bloque `@media (prefers-reduced-motion)` que ya existe.
- **Orden de foco y teclado intactos.** El pinning con `sticky` no altera el orden del DOM, así que tabulación y lectores de pantalla recorren el contenido en secuencia natural. El scrollytelling nunca atrapa el scroll ni secuestra el teclado.
- **Sin contenido solo-visual.** Todo lo que comunique algo (titulares, copy) existe como texto real vía `i18n.js`; el canvas es `aria-hidden`.
- **Contraste:** la fase de transición ivory→oscuro nunca deja texto sobre fondo de contraste insuficiente (se valida en los estados intermedios, no solo en los extremos).
- Skip-link, `focus-visible` y `inert` del modal se conservan tal cual.

---

## 7. Rendimiento

- **Gating por visibilidad:** el bucle rAF solo corre cuando hay una escena en viewport (vía `IntersectionObserver`); en reposo, 0% CPU.
- **Canvas:** DPR capado (máx. 2), recuento de partículas escalado por área de viewport (menos en móvil), `ctx` con `alpha` solo si hace falta. Repintado solo cuando cambia el progreso.
- **CSS:** animar exclusivamente `transform` y `opacity` (compositor); `will-change` puntual y retirado tras la escena. Evitar animar `clip-path`/`filter` en bucle caliente salvo medición previa.
- **Listeners** pasivos; nada de trabajo pesado en el evento `scroll` —todo se lee dentro del rAF—.
- **Presupuesto:** objetivo 60fps en móvil de gama media; sin librerías, el peso extra es solo el JS del motor (estimado < 8KB sin minificar) y el canvas.
- **Móvil:** en pantallas pequeñas, escenas más cortas y partículas reducidas; el hero ya oculta `.hero-mark` en `<=760px`, el canvas seguirá esa misma lógica responsive.

---

## 8. Fases de ejecución

| Fase | Entregable | Riesgo |
|---|---|---|
| **0 · Andamiaje** | `scroll.js` con motor de progreso + gating por IO; tokens de movimiento en `:root`; guardas de `prefers-reduced-motion`. Sin efectos aún. | Bajo |
| **1 · Acto I (Hero)** | Canvas de partículas: ruido→marca + ignición terracota sincronizada con el titular. La escena más vistosa y la que valida todo el motor. | Medio-alto |
| **2 · Acto II (IA)** | Inmersión ivory→oscuro + emergencia escalonada de tarjetas + micro-etiquetas i18n. | Medio |
| **3 · Acto III (Servicios)** | Trazado de la lista como carta astronómica (líneas + numeración). | Bajo |
| **4 · Actos IV–V (Nosotros + Contacto)** | Figura resuelta + pilares como notaciones; eco de chispa en el CTA. | Bajo |
| **5 · Pulido** | Auditoría a11y (teclado + lector + reduced-motion), perf (DevTools, móvil real), `/build-check`. | Medio |

Cada fase es desplegable de forma independiente: si solo se completa la Fase 1, el sitio ya sube de nivel y el resto sigue funcionando con el `.reveal` actual.

---

## 9. Riesgos y mitigaciones

- **Jank de scroll en móvil** → gating por IO, animar solo transform/opacity, partículas reducidas, pruebas en dispositivo real (no solo emulador).
- **Crecimiento del CSS inline** → el `<style>` de `index.html` ya es grande; las animaciones nuevas lo engordan. Mitigación: bloque comentado y agrupado por acto; si supera lo manejable, evaluar extraer a `<link>` local (sin romper "sin bundler").
- **Sobre-animar = traicionar la marca** → *Première Lumière* es contención y precisión, no espectáculo. Cada efecto debe "ganarse su lugar"; una sola ignición terracota en todo el recorrido. Regla: si un movimiento no narra el nacimiento, se elimina.
- **Mantenibilidad** → mantener el patrón unidireccional de `app.js`; `scroll.js` no muta DOM de contenido, solo escribe custom properties. Separación limpia efecto/estado.
- **i18n** → toda cadena nueva (micro-etiquetas, numeración decorativa con semántica) entra en `i18n.js` ES/EN; nada hardcodeado.
- **Sincronía con design system** → no tocar `vendor/naitre/tokens.css`; motion tokens locales. Verificar con `/build-check` y `/sync-tokens` que la paleta sigue intacta.

---

## 10. Definición de "terminado"

- El recorrido completo cuenta el nacimiento de un producto sin una sola frase explicativa extra.
- 60fps en móvil de gama media; 0% CPU en reposo.
- Idéntico contenido y usabilidad con `prefers-reduced-motion` activado.
- Navegable 100% por teclado y lector de pantalla, orden de foco intacto.
- Una única ignición terracota; paleta del design system sin alterar.
- `/build-check` en verde; sin errores de consola.
