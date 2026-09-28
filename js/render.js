/* render.js — hidratación de tarjetas pre-renderizadas.
 *
 * El contenido de las tarjetas (servicios e IA) vive estáticamente en
 * index.html / en/index.html para que sea indexable sin ejecutar JS.
 * Aquí solo se añade la interactividad (rol de botón + apertura del modal).
 *
 * `dispatch` se recibe por parámetro (sin globals): el origen de la
 * mutación sigue siendo único y explícito.
 */

import { $qa, setAttr } from './dom.js';

/* -------- accesibilidad de tarjeta interactiva -------- */
const makeCardInteractive = (el, id, dispatch) => {
  const open = () => dispatch({ type: 'OPEN_SVC', id });
  setAttr(el, 'role', 'button');
  setAttr(el, 'tabindex', '0');
  setAttr(el, 'aria-labelledby', id + '-title');
  setAttr(el, 'aria-describedby', id + '-desc');
  setAttr(el, 'aria-haspopup', 'dialog');
  el.addEventListener('click', open);
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
};

/* Hidrata todas las tarjetas marcadas con data-card="s1|…|ai6". */
export const hydrateCards = dispatch => {
  $qa('[data-card]').forEach(el => makeCardInteractive(el, el.dataset.card, dispatch));
};
