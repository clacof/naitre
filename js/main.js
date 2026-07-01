/* main.js — punto de entrada único (ES module).
 *
 * Orquesta el orden correcto: primero la app (que renderiza tarjetas/servicios
 * y cablea eventos), después el motor de scrollytelling, que necesita esas
 * tarjetas ya en el DOM. Como los módulos van deferred, al ejecutarse el HTML
 * ya está parseado; aun así guardamos por si readyState fuese 'loading'.
 */

import { initApp } from './app.js';
import { initScroll } from './scroll/index.js';

const start = () => {
  initApp();
  initScroll();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
