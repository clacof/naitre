/* scroll/engine.js — SceneEngine: progreso 0→1 por escena anclada.
 *
 * Fábrica funcional: createSceneEngine() encapsula el array de escenas y el
 * bucle requestAnimationFrame, sin estado global de módulo. Cada escena se
 * activa/desactiva por IntersectionObserver y solo gira el bucle si hay alguna
 * activa.
 */

import { clamp } from './utils.js';

export const createSceneEngine = () => {
  const scenes = [];
  let running = false;

  const tick = () => {
    let anyActive = false;
    for (const s of scenes) {
      if (!s.active) continue;
      anyActive = true;
      const rect = s.el.getBoundingClientRect();
      let p;
      if (s.mode === 'view') {
        // progreso del elemento cruzando el viewport (estilo CSS view())
        const vh = window.innerHeight;
        p = clamp((vh - rect.top) / (vh + rect.height));
      } else {
        const dist = s.el.offsetHeight - window.innerHeight;
        p = dist > 0 ? clamp(-rect.top / dist) : rect.top <= 0 ? 1 : 0;
      }
      s.onProgress(p);
    }
    if (anyActive) requestAnimationFrame(tick);
    else running = false;
  };

  const startLoop = () => {
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  };

  const registerScene = (el, onProgress, mode = 'pin') => {
    const scene = { el, onProgress, active: false, mode };
    scenes.push(scene);
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => { scene.active = e.isIntersecting; });
        if (scenes.some(s => s.active)) startLoop();
      },
      { rootMargin: '0px' }
    );
    io.observe(el);
    return scene;
  };

  const registerView = (el, onProgress) => registerScene(el, onProgress, 'view');

  return { registerScene, registerView };
};
