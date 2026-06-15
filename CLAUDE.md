# CLAUDE.md

Documentación para agentes de Claude Code. Lee esto antes de tocar cualquier archivo.

## Qué es este proyecto

**Naître** es el sitio web de la consultora de inteligencia artificial *Naître Studio*. Landing page de una sola página (vanilla JS + HTML), desplegada en Vercel.

Stack: HTML · CSS (custom properties) · JavaScript ESM vanilla · sin bundler · i18n propio (`i18n.js`)

---

## Comandos esenciales

```bash
# No hay build step — es HTML/JS estático
# Para previsualizar en local con recarga en vivo:
npx serve .              # servidor estático en puerto 3000
python3 -m http.server   # alternativa sin deps

# Linting (si se instalan deps):
npm install
# No hay lint script definido aún — ver sección Recomendaciones
```

---

## Arquitectura de archivos

```
/
├── index.html          # Única página — todo el HTML + CSS inline
├── app.js              # Lógica completa: estado, eventos, API chat
├── i18n.js             # Diccionario ES/EN — todas las cadenas de UI
├── brand/
│   ├── logo.svg        # Logo principal (crema sobre fondo oscuro)
│   ├── logo-dark.svg   # Logo para fondos claros
│   ├── og-image.png    # Open Graph 1200×630
│   ├── agents.png      # Imagen hero sección IA
│   ├── studio.png      # Imagen sección estudio
│   └── design-philosophy.md  # Manifiesto estético Première Lumière
├── fonts/              # Fuentes self-hosted (subset)
├── api/                # Vercel serverless functions
└── .vercel/            # Config de proyecto Vercel (no tocar)
```

---

## Design system: Première Lumière

Paleta definida como CSS custom properties en `index.html` (`<style>` en `<head>`). Hay versión light y dark (via `@media prefers-color-scheme: dark`):

| Variable | Light | Dark | Uso |
|---|---|---|---|
| `--bg` | `#f5f6f7` | `#14161a` | Fondo principal de página |
| `--surface` | `#ffffff` | `#1b1e24` | Superficies elevadas (modales, tarjetas) |
| `--soft` | `#e9ecef` | `#23272e` | Superficie secundaria (hover, inputs) |
| `--ink` | `#181b20` | `#e9eaec` | Texto principal |
| `--muted` | `#5b6370` | `#9aa1ac` | Texto secundario / subtítulos |
| `--line` | `#dfe3e8` | `#2a2e36` | Bordes y separadores |
| `--accent` | `#c96342` | `#d4714f` | Terracota — acento único, CTAs |
| `--accent-ink` | `#a04527` | `#df8a6b` | Terracota oscuro (hover de botones) |
| `--ai-bg` | `#181b20` | `#181c22` | Fondo sección IA (siempre oscuro) |
| `--ai-card` | `#1d2127` | `#1e232a` | Tarjetas internas de la sección IA |
| `--ai-line` | `rgba(245,246,247,.14)` | `rgba(233,234,236,.12)` | Separadores en sección IA |

**Regla crítica**: `--accent` es escaso y precioso. Nunca usarlo como fondo de secciones enteras ni como color decorativo. Solo para sparks: CTA principal, un único acento por composición.

Manifiesto completo en `brand/design-philosophy.md`.

---

## Estado y arquitectura JS

`app.js` implementa un mini store unidireccional al estilo Redux:

```js
// Estado inmutable — solo se modifica via dispatch()
state = { lang, svc: { current, returnFocus }, chat: { history, opened, busy } }

dispatch({ type: 'SET_LANG', lang: 'en' })
dispatch({ type: 'OPEN_SVC', id: 's1' })
dispatch({ type: 'SET_CHAT_OPENED', opened: true })
dispatch({ type: 'SET_CHAT_BUSY', busy: false })
dispatch({ type: 'ADD_CHAT_MSG', msg: { role: 'user', content: '...' } })
```

- `syncAll(state, prev)` — reconcilia el DOM tras cada dispatch (NO mutar el DOM directamente)
- `$('id')` — alias de `document.getElementById`
- El chat se conecta a la API en `api/chat.js` via fetch POST

---

## Internacionalización

Todas las cadenas visibles viven en `i18n.js`. Acceso directo por idioma y clave:

```js
i18n[state.lang]['hero_title']   // string en idioma activo (guiones bajos, no puntos)
i18n['en']['hero_title']         // forzar idioma
```

**Regla**: nunca escribir texto hardcodeado en HTML o JS. Todo va en `i18n.js`.

---

## Proyectos relacionados

| Proyecto | Ruta | Relación |
|---|---|---|
| `naitre-inventario` | `~/code/naitre-inventario` | ERP interno — replica la paleta crema/terracota de este design system |
| `naitre-erp` | `~/naitre-erp` | Monorepo de servicios backend |

Los design tokens de `naitre-inventario` deben mantenerse sincronizados con la paleta de este proyecto. Ver `/sync-tokens`.

---

## Comandos slash disponibles

- `/build-check` — verifica que el HTML es válido y no hay errores en la consola del servidor de prueba
- `/sync-tokens` — instrucciones para sincronizar la paleta con naitre-inventario

---

## Convenciones

- CSS: custom properties en `:root`, sin preprocesador, sin Tailwind
- JS: ESM nativo (`type="module"`), sin TypeScript, sin bundler
- Commits en español, mensaje descriptivo del *por qué* no del *qué*
- Nunca modificar `.vercel/` ni `.agents/`
- Imágenes grandes (>500KB) van en `public/` o se gitignoran si son temporales
