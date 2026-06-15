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

Paleta definida como CSS custom properties en `index.html` (`<style>` en `<head>`):

| Variable | Valor | Uso |
|---|---|---|
| `--ink` | `#191713` | Negro cálido — texto principal, fondo hero |
| `--cream` | `#f9f7f1` | Marfil — fondo claro, texto sobre oscuro |
| `--accent` | `#c96342` | Terracota — acento único, CTAs, spark |
| `--slate` | `#5d7e9c` | Azul pizarra — acento sistémico secundario |
| `--moss` | `#6f7d54` | Verde musgo — acento sistémico terciario |
| `--line` | `#2a2722` | Borde sutil sobre fondo oscuro |
| `--accent-ink` | `#a54e32` | Terracota oscuro (hover de botones) |

**Regla crítica**: el terracota es escaso y precioso. Nunca usarlo como fondo de secciones enteras ni como color decorativo. Solo para sparks: CTA principal, un único acento por composición.

Manifiesto completo en `brand/design-philosophy.md`.

---

## Estado y arquitectura JS

`app.js` implementa un mini store unidireccional al estilo Redux:

```js
// Estado inmutable — solo se modifica via dispatch()
state = { lang, svc: { current, returnFocus }, chat: { history, opened, busy } }

dispatch({ type: 'SET_LANG', lang: 'en' })
dispatch({ type: 'OPEN_SVC', id: 's1' })
dispatch({ type: 'TOGGLE_CHAT' })
```

- `render(state)` — reconcilia el DOM a partir del estado (NO usar innerHTML directo fuera de render)
- `$('id')` — alias de `document.getElementById`
- El chat se conecta a la API en `api/chat.js` via fetch POST

---

## Internacionalización

Todas las cadenas visibles viven en `i18n.js`. Acceso:

```js
t('hero.title')        // string en idioma activo
t('hero.title', 'en')  // forzar idioma
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
