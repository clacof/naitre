# naitre — Revisión de diseño y técnica
*10 junio 2026*

## Lo que ya funciona

El concepto es sólido y poco común: un estudio con una metáfora real (naître / nacer) llevada hasta una filosofía de diseño escrita (*Première Lumière*) y un póster de marca excelente. La marca SVG (el círculo radial) es coherente, reutilizada con `<use>` en nav, hero, chat y footer — buena disciplina. El copy es humano y sin humo ("sin intermediarios", "no inventes precios"), que es exactamente lo que pides: genuino. La base técnica (un solo HTML, i18n ligero, serverless mínima) es proporcionada al tamaño del proyecto.

Las mejoras van de mayor a menor impacto.

---

## 1. Autenticidad: la paleta es literalmente la de Anthropic

`#faf9f5 / #141413 / #d97757 / #6a9bcc / #788c5d` + Poppins/Lora es, color por color y fuente por fuente, el branding oficial de Anthropic. Para un estudio que vende integración de IA, parecer un clon del sitio de Claude es el mayor riesgo contra "genuino": cualquier cliente que conozca Claude lo notará, y debilita el argumento de que diseñáis identidades propias.

No hace falta tirar nada — la lógica (marfil cálido + tinta + un acento terracota racionado) es correcta y está justificada en vuestra propia filosofía. Basta desplazar los valores para haceros dueños de ella: un marfil un punto más cálido o más frío, una terracota más quemada o más rosada (p. ej. hacia `#c4633e` o `#e08a63`), y acentos secundarios propios. El póster seguiría funcionando igual.

## 2. Tipografía: Poppins traiciona al póster

El póster escribe "naître" con una serif de alto contraste, elegante, casi didona — ese es el momento más sofisticado de toda la marca. La web, en cambio, titula con Poppins: geométrica, amable, y la fuente más usada del internet genérico. El sitio y el artefacto de marca no hablan el mismo idioma.

La mejora de mayor retorno estético del proyecto: usar una display serif para logo, h1 y h2 (Fraunces, Cormorant Garamond o similar, en peso ligero y con el acento circunflejo bien resuelto), dejando una sans solo para etiquetas, botones y micro-texto. Eso conecta web y póster y sube el nivel percibido inmediatamente.

Detalle de código relacionado: las variables están invertidas semánticamente — `--serif` apunta a Poppins (sans) y `--sans` a Lora (serif). Funciona, pero es una trampa de mantenimiento; renombrar a `--display` y `--body`.

## 3. Llevar *Première Lumière* a la web

La filosofía describe un lenguaje riquísimo — tick marks, micro-etiquetas, índices, coordenadas, reglas finas, "instrumentación de laboratorio" — y la web solo lo usa en la marca SVG. Los números `01–06` de servicios son el único eco. Oportunidades concretas, todas baratas:

separadores de sección como regla fina con tick marks en vez de un simple `border-top`; micro-etiquetas tipo coordenada en los márgenes (`fig. 03 — servicios`, como hace el pie del póster); índices `n.01` en las tarjetas IA en lugar del punto de color; un footer con la firma del póster ("fig. 01 · cartographie de l'émergence"). Eso convertiría un sitio limpio-pero-estándar en uno con huella propia.

## 4. Craft: detalles pequeños que delatan

- El fondo del nav es `rgba(250,248,244,.85)` pero `--bg` es `#faf9f5` (250,249,245) — no coinciden.
- `.msg.bot` tiene dos `background` seguidos (uno sobrescribe al otro): código muerto.
- Iconos como caracteres de texto (`✕`, `☰`, `➤`) renderizan distinto según plataforma; en SVG quedarían consistentes con el resto de la marca.
- El badge "en línea" del chat con punto verde está siempre encendido aunque la API falle — pequeño golpe a la honestidad; mejor "asistente IA" sin estado fingido.
- En móvil desaparece la marca del hero (`display:none`) y con ella el momento de marca más fuerte; mejor una versión pequeña y estática sobre el título.
- El título del documento y la meta description no cambian con `setLang`.

## 5. Accesibilidad

Las tarjetas de servicio son `<div>` clicables: sin teclado, sin foco, sin rol. Deberían ser `<button>` o tener `role="button"` + `tabindex` + Enter/Espacio. El modal no atrapa el foco ni lo devuelve al cerrar. Los botones ES/EN necesitan `aria-pressed`. El "Ver más +" como span dentro de la tarjeta clicable está bien visualmente pero es invisible para lectores de pantalla.

## 6. API y arquitectura

Lo más urgente del proyecto entero: `/api/chat` está abierto al mundo sin rate limiting ni verificación de origen. Cualquiera puede hacer scripting contra el endpoint y quemar la cuenta de OpenAI. Mínimo viable: comprobar `Origin`/`Referer` contra el dominio y un rate limit por IP (Upstash Ratelimit en Vercel son ~10 líneas). 

Segundo: sin streaming, el usuario mira los tres puntos y recibe un bloque; con streaming SSE la conversación se siente viva — es además lo que vendéis.

Menor: el error de `OPENAI_API_KEY` ausente devuelve detalle interno al cliente; y siendo un estudio que anuncia integración con Anthropic, que el propio asistente corra sobre Claude sería coherencia de marca (opcional, pero contable como detalle genuino).

El resto de la función está bien: historial recortado, contenido truncado, validación de roles, `max_tokens` acotado.

## 7. SEO y compartir

Falta por completo la capa social: sin `og:title`, `og:image`, `twitter:card` ni canonical. Tenéis un póster espectacular — un recorte 1200×630 como `og:image` es la mejora de marketing más barata posible. Añadir también JSON-LD de `Organization` y, cuando exista, la URL real en canonical.

## 8. Formulario

El `mailto:` es honesto (la nota lo explica, bien) pero frágil: en máquinas sin cliente de correo configurado no pasa nada y el lead se pierde. Ya tenéis funciones serverless — un `/api/contact` que envíe por Resend/Postmark cuesta poco y mantiene la promesa de "te respondemos en 48h".

---

## Prioridad sugerida

1. Rate limit + origin check en `/api/chat` (riesgo real de coste).
2. Tipografía display serif (mayor salto de sofisticación).
3. Apropiarse de la paleta (autenticidad).
4. Lenguaje *Première Lumière* en la web (diferenciación).
5. og:image + meta social.
6. Accesibilidad de tarjetas y modal.
7. Formulario serverless, streaming del chat, detalles de craft.
