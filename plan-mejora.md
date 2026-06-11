# Plan de mejora — naitre.vercel.app

Auditoría según `design-taste-frontend` (tasteskill), modo **Redesign - Preserve** (Sección 11).

**Design Read:** landing de estudio de software para pymes hispanohablantes, lenguaje editorial cálido, single-page HTML estático.
**Dials actuales (leídos del sitio):** VARIANCE 3 / MOTION 3 / DENSITY 4.
**Dials objetivo:** VARIANCE 6 / MOTION 5 / DENSITY 4.

---

## Lo que ya está bien (preservar, no tocar)

- **Accesibilidad excelente:** skip-link, `focus-visible`, focus-trap en modal con `inert`, `aria-*` correcto, `prefers-reduced-motion` respetado, `role="log"` en el chat. Por encima de la media. No regresar nada de esto (Sección 11.C).
- **Rendimiento sano:** IntersectionObserver para reveals (no hay `scroll` listeners), CSS inline, sin frameworks, anima solo `transform`/`opacity`.
- **SEO/social completo:** canonical, OG, Twitter card, JSON-LD. Mantener slugs y anclas (`#ia`, `#servicios`...) intactos.
- **i18n ES/EN funcional** y chat con API endurecida.
- **El logo-mark SVG** (círculo/dial) es distintivo y propio. Es el activo de marca más fuerte de la página.

---

## Violaciones detectadas (por severidad)

### 1. Paleta: la familia beige+clay+espresso prohibida (Sección 4.2)
`--bg:#f9f7f1` (crema/papel cálido), `--ink:#191713` (espresso), `--accent:#c96342` (clay/terracota). Es **exactamente** la paleta AI-default vetada para briefs premium. Además hay 3 acentos (`--accent`, `--accent-blue:#5d7e9c`, `--accent-green:#6f7d54`) rotando en las cards IA → viola "máx. 1 acento, Color Consistency Lock".

**Acción:** migrar a una familia alternativa del skill manteniendo el carácter cálido de la marca. Recomendada: **Terracotta + Slate** (óxido cálido sobre gris frío) que conserva el acento `#c96342` reconocible pero elimina el fondo crema; o **monocromo + un pop saturado**. Eliminar `--accent-blue` y `--accent-green`.

### 2. Fraunces está explícitamente vetada (Sección 4.1)
Fraunces + Lora + Poppins. Fraunces es una de las dos serifs "LLM-favorite" prohibidas como default, y aquí no hay justificación de brief (la identidad se generó también con IA).

**Acción:** display sans con carácter (Cabinet Grotesk, Satoshi, GT Walsheim o PP Neue Montreal) + un solo sans para body/labels (eliminar la tríada de 3 familias). Si se quiere conservar el aire editorial, una serif justificada del pool rotado (p. ej. Reckless Neue o Tiempos) solo en el wordmark. Self-host con `@font-face` + `font-display:swap`; **eliminar el `<link>` a Google Fonts** (regla 3.A).

### 3. Em-dashes por todas partes (Sección 9.G, no negociable)
- `<title>` y OG: "naitre — Estudio…"
- Footer: "© 2026 naitre — estudio…"
- Cabecera del chat: "n. — asistente"
- Bullets del modal: `li::before{content:"—"}`
- Copy EN: "— not afterthoughts", "— not the other way around", "— because while it lasts", "— no hype"

**Acción:** barrido completo. Título → "naitre · Estudio…" o punto. Bullets del modal → guion simple o sin marcador con `border`. Reescribir las frases EN con coma o punto.

### 4. Eyebrows en exceso (Sección 4.7, regla nº1 violada)
6 labels uppercase-tracking en 5 secciones (hero eyebrow + ai-badge + "Inteligencia Artificial" + "Servicios" + "Nosotros" + "Contacto"). Máximo permitido: ceil(5/3) = **2**.

**Acción:** eliminar los section-labels redundantes (el h2 ya nombra la sección). Quitar el doble label de la sección IA (badge + eyebrow es redundante: dejar uno). El eyebrow del hero "naître · nacer · estudio de software" es además un decoration-strip con middle-dots racionados → sustituir por nada o por una sola palabra.

### 5. Cero imágenes reales (Sección 4.8)
Página 100% texto + SVG. "Pure-text no es minimalismo, es trabajo incompleto."

**Acción:** añadir 2-3 imágenes reales: una en el hero o sección Nosotros (equipo/estudio/proceso, puede ser fotografía generada o picsum con seed mientras tanto), y variación visual en al menos 2-3 celdas de los grids (Bento Background Diversity).

### 6. Repetición de layout: dos grids de 6 cards idénticas seguidos (Sección 4.7)
IA (6 cards uniformes) → Servicios (6 cards uniformes). Misma familia de layout dos veces consecutivas + el tell "cards iguales en grid".

**Acción:** recomponer una de las dos. IA como **bento asimétrico** (1 celda destacada grande + resto, con imagen/gradiente en 2 celdas) y Servicios como **lista editorial expandible** (filas con número grande + título, ya que son clicables hacia el modal) o acordeón horizontal. Eliminar los índices decorativos `n.01…n.06` y `01…06` (tell de section-numbering, 9.F).

### 7. Theme flip a mitad de página (Sección 4.11)
La sección IA invierte a dark entre secciones light. Permitido solo como "Color Block Story" deliberado y único.

**Acción (decisión):** o se convierte en el único bloque dark intencional con transición fuerte (válido: es la línea de producto destacada), o se mantiene light con un tratamiento diferenciado (borde, fondo tintado del mismo tema). Recomendación: conservarlo como bloque dark único y consciente; ya cumple "una sola inversión por página".

### 8. CTA con intent duplicado (Sección 4.5)
"Empezar un proyecto" (hero) + "Explorar soluciones IA" (→ #contacto) + "Empezar un proyecto" (modal): dos labels distintos para el mismo intent de contacto.

**Acción:** un solo label de contacto en toda la página. "Explorar soluciones IA" pasa a llamarse igual que el primario o se elimina.

### 9. Hero: titular de 3-4 líneas y `100vh` (Secciones 4.7 y 3.E)
`max-width:16ch` con "Donde las ideas nacen y se convierten en software" fuerza ~4 líneas (máx. 2). `min-height:100vh` salta en iOS Safari.

**Acción:** ensanchar a ~22-24ch o acortar el titular ("Donde las ideas nacen" + subtítulo lleva el resto); `min-height:100dvh`.

---

## Plan por fases (orden de palancas, Sección 11.D)

| Fase | Trabajo | Riesgo | Impacto |
|---|---|---|---|
| 1. Tipografía | Sustituir Fraunces/Lora/Poppins por sistema de 2 familias self-hosted | Bajo | Alto |
| 2. Color | Nueva paleta (Terracotta+Slate), 1 solo acento, eliminar blue/green | Bajo | Alto |
| 3. Barrido de copy | Em-dashes fuera, eyebrows reducidos a ≤2, labels numerados fuera, CTA unificado | Bajo | Medio |
| 4. Imágenes | 2-3 fotos reales/generadas + diversidad en celdas de grid | Medio | Alto |
| 5. Recomposición | Hero (titular 2 líneas, 100dvh), IA→bento asimétrico, Servicios→lista editorial | Medio | Alto |
| 6. Motion | Subir a MOTION 5: stagger en reveals, hover físico en cards (`:active` translate), micro-física en CTA. Mantener reduced-motion | Bajo | Medio |
| 7. Dark mode | Hoy no hay `prefers-color-scheme`. Añadir tokens dual-mode (Sección 6.C, obligatorio consumer) | Medio | Medio |

**Invariantes (Sección 11.F):** no tocar slugs/anclas, labels de nav, estructura del formulario, logo-mark, ni el copy ES de voz de marca salvo lo listado en fase 3.

**Pre-Flight al terminar:** checklist Sección 14 completa, con foco en: cero em-dashes, eyebrow count ≤2, contraste AA en CTAs y form, hero ≤2 líneas, theme lock, un acento.
