#!/usr/bin/env node
/* build-en.mjs — genera en/index.html a partir de index.html + i18n.en
 *
 * La página inglesa es un snapshot estático (SEO: hreflang + contenido
 * indexable sin JS). index.html sigue siendo la fuente de verdad.
 *
 * Uso:  node tools/build-en.mjs
 * Ejecutar tras cualquier cambio en index.html o js/i18n.js.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { i18n } from '../js/i18n.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const en = i18n.en;

const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

let html = readFileSync(join(root, 'index.html'), 'utf8');

/* 1 — idioma del documento + aviso de archivo generado */
html = html
  .replace('<html lang="es">', '<html lang="en">')
  .replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- GENERADO por tools/build-en.mjs — no editar a mano. Edita index.html o js/i18n.js y ejecuta: node tools/build-en.mjs -->');

/* 2 — textos marcados con data-i18n / data-i18n-html */
html = html.replace(/(data-i18n="(\w+)"[^>]*>)([^<]*)/g, (m, open, key) =>
  en[key] !== undefined ? open + esc(en[key]) : m);
html = html.replace(/(data-i18n-html="hero_title">)[\s\S]*?(<\/h1>)/, `$1${en.hero_title}$2`);

/* 3 — head, atributos y textos sin data-i18n */
const swaps = [
  ['<title>naitre · Estudio de desarrollo de software en Chile</title>', `<title>${esc(en.doc_title)}</title>`],
  ['content="naitre, estudio de desarrollo de software en Chile. IA, webs, apps móviles, IoT y software a medida. Donde las ideas nacen."', `content="${esc(en.doc_desc)}"`],
  ['<link rel="canonical" href="https://www.naitre.cl/">', '<link rel="canonical" href="https://www.naitre.cl/en/">'],
  ['<meta property="og:locale" content="es_CL">', '<meta property="og:locale" content="en_US">'],
  ['<meta property="og:title" content="naitre · estudio de desarrollo de software">', '<meta property="og:title" content="naitre · software development studio">'],
  ['<meta property="og:description" content="Donde las ideas nacen. IA, automatizaciones, webs, apps móviles, IoT y software a medida.">', '<meta property="og:description" content="Where ideas are born. AI, automations, websites, mobile apps, IoT and custom software.">'],
  ['<meta property="og:url" content="https://www.naitre.cl/">', '<meta property="og:url" content="https://www.naitre.cl/en/">'],
  ['<meta property="og:image:alt" content="naitre · estudio de desarrollo de software">', '<meta property="og:image:alt" content="naitre · software development studio">'],
  ['<meta name="twitter:title" content="naitre · estudio de desarrollo de software">', '<meta name="twitter:title" content="naitre · software development studio">'],
  ['<meta name="twitter:description" content="Donde las ideas nacen. IA, automatizaciones, webs, apps móviles, IoT y software a medida.">', '<meta name="twitter:description" content="Where ideas are born. AI, automations, websites, mobile apps, IoT and custom software.">'],
  ['"description":"Estudio de desarrollo de software en Chile: IA, webs, apps móviles, IoT y software a medida."', '"description":"Software development studio in Chile: AI, websites, mobile apps, IoT and custom software."'],
  ['aria-label="Principal"', 'aria-label="Main"'],
  ['aria-label="Menú"', 'aria-label="Menu"'],
  ['aria-label="Proceso" aria-roledescription="secuencia horizontal"', 'aria-label="Process" aria-roledescription="horizontal sequence"'],
  ['aria-label="Abrir chat"', `aria-label="${esc(en.chat_open)}"`],
  ['aria-label="asistente de naitre"', `aria-label="${esc(en.chat_title)}"`],
  ['placeholder="Escribe tu mensaje…"', `placeholder="${esc(en.chat_ph)}"`],
  ['aria-label="Escribe tu mensaje"', 'aria-label="Type your message"'],
  ['alt="Primera luz sobre el horizonte"', `alt="${esc(en.about_photo_alt)}"`],
  ['alt="Arco de luz terracota naciendo en un campo oscuro"', 'alt="Terracotta arc of light rising over a dark field"'],
  ['<label for="f-company">No rellenar</label>', '<label for="f-company">Do not fill</label>'],
];
for (const [from, to] of swaps) {
  if (!html.includes(from)) { console.warn('⚠ no encontrado (index.html cambió):', from.slice(0, 70)); continue; }
  html = html.replaceAll(from, to);
}

/* aria-label="Cerrar" (modal + chat) y CTA del modal (sin data-i18n) */
html = html
  .replaceAll('aria-label="Cerrar"', `aria-label="${esc(en.close_label)}"`)
  .replaceAll('>Empezar un proyecto</a>', `>${esc(en.modal_cta)}</a>`);

/* 4 — rutas absolutas (la página vive en /en/) */
html = html
  .replaceAll('href="css/', 'href="/css/')
  .replaceAll('href="vendor/', 'href="/vendor/')
  .replaceAll('href="fonts/', 'href="/fonts/')
  .replaceAll('src="js/', 'src="/js/')
  .replaceAll('src="brand/', 'src="/brand/')
  .replace(/srcset="([^"]*)"/g, (m, v) => `srcset="${v.replace(/(^|,\s*)brand\//g, '$1/brand/')}"`);

/* 5 — escribir */
mkdirSync(join(root, 'en'), { recursive: true });
writeFileSync(join(root, 'en', 'index.html'), html);

const restantes = [...html.matchAll(/(?:src|href)="(?!https?:|\/|#|mailto:|data:)[^"]+"/g)];
if (restantes.length) console.warn('⚠ rutas relativas restantes:', restantes.map(m => m[0]));
console.log('✓ en/index.html generado');
