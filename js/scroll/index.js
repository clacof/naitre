/* scroll/index.js — arranque del scrollytelling.
 *
 * Crea un único SceneEngine compartido y enchufa cada acto. initScroll() debe
 * llamarse DESPUÉS de que app.js haya renderizado tarjetas/servicios (lo
 * orquesta main.js), porque la entrada en cascada necesita las .ai-card ya en
 * el DOM.
 */

import { reduceMotion } from './utils.js';
import { createSceneEngine } from './engine.js';
import { initHero } from './hero.js';
import { initScrollRail } from './rail.js';
import { initSections } from './sections.js';
import { initHScroll } from './hscroll.js';
import { initMagnetic } from './magnetic.js';
import { initTilt } from './tilt.js';

export const initScroll = () => {
  const engine = createSceneEngine();
  initHero(engine);
  initScrollRail();
  initSections(engine);
  initHScroll(engine);
  // Tilt 3D y botones magnéticos solo con puntero fino (ratón); en táctil
  // generan saltos al hacer scroll con el dedo.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reduceMotion.matches && finePointer) {
    initMagnetic();
    initTilt();
  }
};
