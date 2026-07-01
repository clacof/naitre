/* engine.js — SceneEngine: progreso 0→1 por escena anclada.
 *
 * Núcleo del scrollytelling, agnóstico de framework y sin dependencias.
 * Fábrica funcional: createSceneEngine() encapsula el array de escenas y el
 * bucle requestAnimationFrame, sin estado global de módulo. Cada escena se
 * activa/desactiva por IntersectionObserver y el bucle SOLO gira si hay alguna
 * escena visible — fuera de pantalla, cero trabajo por frame.
 *
 * Filosofía:
 *  - Una sola fuente de movimiento: el callback onProgress(p) con p ∈ [0,1].
 *  - Tú decides qué hacer con p. Lo idiomático es escribir una custom property
 *    CSS (--enter, --vp, --hp…) y dejar que el CSS haga el transform: mantiene
 *    el layout fuera del hilo JS y permite fallbacks/medias en CSS.
 *  - Nunca leas y escribas layout en el mismo frame fuera de este tick.
 */

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

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
        // Progreso del elemento cruzando el viewport (estilo CSS view()):
        // 0 cuando su borde superior toca el fondo de la ventana,
        // 1 cuando su borde inferior sale por arriba.
        const vh = window.innerHeight;
        p = clamp((vh - rect.top) / (vh + rect.height));
      } else {
        // Modo 'pin': el elemento es más alto que el viewport y contiene un
        // hijo position:sticky. Progreso = cuánto hemos recorrido el sobrante.
        const dist = s.el.offsetHeight - window.innerHeight;
        p = dist > 0 ? clamp(-rect.top / dist) : rect.top <= 0 ? 1 : 0;
      }
      s.onProgress(p);
    }
    if (anyActive) requestAnimationFrame(tick);
    else running = false; // se reanima al volver a entrar una escena
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

  // Azúcar para el modo más común de revelado: el elemento cruza el viewport.
  const registerView = (el, onProgress) => registerScene(el, onProgress, 'view');

  return { registerScene, registerView };
};
