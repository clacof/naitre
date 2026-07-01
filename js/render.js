/* render.js — renderizado de tarjetas desde <template> + datos de catálogo.
 *
 * Las funciones reciben `dispatch` por parámetro (sin globals): así el origen
 * de la mutación sigue siendo único y explícito.
 */

import { i18n } from './i18n.js';
import { $, $q, setAttr, setText } from './dom.js';

/* -------- datos -------- */
export const serviceIds = ['s1', 's2', 's3', 's4', 's5', 's6'];

export const aiCards = [
  { id: 'ai1', feature: true,  img: 'brand/agents.png', alt: 'Arco de luz terracota naciendo en un campo oscuro' },
  { id: 'ai2', feature: false, tint: false },
  { id: 'ai3', feature: false, tint: false },
  { id: 'ai4', feature: false, tint: false },
  { id: 'ai5', feature: false, tint: false },
  { id: 'ai6', feature: false, tint: true  },
];

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

/* -------- rellena h3/p/more de una tarjeta clonada -------- */
const fillCard = (div, id, lang) => {
  const h3 = div.querySelector('h3');
  const p  = div.querySelector('p');
  const m  = div.querySelector('.more');
  setAttr(h3, 'data-i18n', id + '_t'); setText(h3, i18n[lang][id + '_t']);
  setAttr(p,  'data-i18n', id + '_d'); setText(p,  i18n[lang][id + '_d']);
  setAttr(m,  'data-i18n', 'more_label'); setText(m, i18n[lang].more_label);
  h3.id = id + '-title';
  p.id  = id + '-desc';
};

export const renderServices = (lang, dispatch) => {
  const list = $q('.services-list');
  const tpl = $('tpl-service');
  if (!list || !tpl) return;
  serviceIds.forEach(id => {
    const div = tpl.content.cloneNode(true).querySelector('.service');
    fillCard(div, id, lang);
    makeCardInteractive(div, id, dispatch);
    list.appendChild(div);
  });
};

export const renderAiCards = (lang, dispatch) => {
  const grid = $q('.ai-grid');
  const tplCard = $('tpl-ai-card'), tplFeat = $('tpl-ai-card-feature');
  if (!grid || !tplCard || !tplFeat) return;
  aiCards.forEach(item => {
    const tpl = item.feature ? tplFeat : tplCard;
    const div = tpl.content.cloneNode(true).querySelector('.ai-card');
    fillCard(div, item.id, lang);
    if (item.tint) div.classList.add('ai-card--tint');
    if (item.feature) {
      const img = div.querySelector('img');
      if (img) { img.src = item.img; img.alt = item.alt || ''; }
    }
    makeCardInteractive(div, item.id, dispatch);
    grid.appendChild(div);
  });
};
