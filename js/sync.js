/* sync.js — reconciliación DOM (efectos laterales aislados).
 *
 * Cada función recibe el `state` y proyecta su parte sobre el DOM. No mutan
 * estado ni leen del DOM para decidir lógica: el DOM es solo el destino.
 */

import { i18n } from './i18n.js';
import { $, $q, $qa, inertTargets } from './dom.js';
import { svcPrefix } from './pure.js';

export const syncModalContent = (id, lang) => {
  $('svcLabel').textContent = i18n[lang][svcPrefix(id)];
  $('svcTitle').textContent = i18n[lang][id + '_t'];
  $('svcBody').innerHTML = i18n[lang][id + '_long'] || '';
  $('svcCta').textContent = i18n[lang].modal_cta;
};

export const syncLang = state => {
  const t = i18n[state.lang];
  document.documentElement.lang = state.lang;
  document.title = t.doc_title;
  const md = $q('meta[name="description"]');
  if (md) md.setAttribute('content', t.doc_desc);

  const be = $('btn-es'), bn = $('btn-en');
  be.classList.toggle('active', state.lang === 'es');
  be.setAttribute('aria-pressed', String(state.lang === 'es'));
  bn.classList.toggle('active', state.lang === 'en');
  bn.setAttribute('aria-pressed', String(state.lang === 'en'));

  $qa('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (k && t[k]) el.textContent = t[k];
  });
  $qa('[data-i18n-html]').forEach(el => {
    const k = el.getAttribute('data-i18n-html');
    if (k && t[k]) el.innerHTML = t[k];
  });

  const ci = $('chatInput');
  if (ci) { ci.placeholder = t.chat_ph; ci.setAttribute('aria-label', t.chat_ph); }
  const ap = $q('.about-photo img');
  if (ap) ap.setAttribute('alt', t.about_photo_alt);

  $q('nav').setAttribute('aria-label', t.nav_aria);
  $('menuBtn').setAttribute('aria-label', t.menu_label);
  $('svcClose').setAttribute('aria-label', t.close_label);
  $('chatClose').setAttribute('aria-label', t.close_label);
  $('chatSend').setAttribute('aria-label', t.chat_send);
  $('chatFab').setAttribute('aria-label', t.chat_open);
  $('chatPanel').setAttribute('aria-label', t.chat_title);
  const proc = $('proceso');
  if (proc && t.proc_region) proc.setAttribute('aria-label', t.proc_region);

  if (state.svc.current) syncModalContent(state.svc.current, state.lang);
};

export const syncModal = state => {
  const { current, returnFocus } = state.svc;
  const m = $('svcModal');
  if (!current) {
    m.classList.remove('open');
    document.body.style.overflow = '';
    inertTargets().forEach(el => { el.inert = false; });
    if (returnFocus && returnFocus.focus) returnFocus.focus();
    return;
  }
  syncModalContent(current, state.lang);
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  inertTargets().forEach(el => { el.inert = true; });
  $('svcClose').focus();
};

export const syncChatPanel = (state, prev) => {
  const { opened } = state.chat;
  const panel = $('chatPanel');
  const fab = $('chatFab');
  panel.classList.toggle('open', opened);
  fab.classList.toggle('open', opened);
  fab.setAttribute('aria-expanded', String(opened));
  document.body.classList.toggle('chat-open', opened);
  if (!opened && prev && prev.chat && prev.chat.opened) fab.focus();
};

export const syncChatBusy = state => {
  const btn = $('chatSend');
  const inp = $('chatInput');
  if (btn) { btn.disabled = state.chat.busy; btn.setAttribute('aria-busy', String(state.chat.busy)); }
  if (inp) inp.disabled = state.chat.busy;
};

export const syncForm = state => {
  const t = i18n[state.lang];
  const status = state.form.status;
  const btn = $('contactForm') && $q('button[type="submit"]', $('contactForm'));
  if (btn) {
    btn.disabled = status === 'sending';
    btn.setAttribute('aria-busy', String(status === 'sending'));
    btn.textContent = status === 'sending' ? t.f_sending : t.f_send;
  }
  const note = $('formNote');
  if (note) {
    const msg = { sending: t.f_sending, sent: t.f_sent, error: t.f_error }[status] || t.f_note;
    note.textContent = msg;
    note.classList.toggle('is-sent', status === 'sent');
    note.classList.toggle('is-error', status === 'error');
  }
};

const prevSvc  = prev => (prev && prev.svc ? prev.svc.current : null);
const prevChat = (prev, key, dflt) => (prev && prev.chat ? prev.chat[key] : dflt);
const prevForm = prev => (prev && prev.form ? prev.form.status : null);

export const syncAll = (state, prev) => {
  syncLang(state);
  if (state.svc.current  !== prevSvc(prev))               syncModal(state);
  if (state.chat.opened  !== prevChat(prev, 'opened', null)) syncChatPanel(state, prev);
  if (state.chat.busy    !== prevChat(prev, 'busy', false))  syncChatBusy(state);
  if (state.form.status  !== prevForm(prev))              syncForm(state);
};
