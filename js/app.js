/* app.js — composición de la aplicación: store + render + chat + eventos.
 *
 * initApp() es el único punto de arranque. No hay estado global de módulo:
 * todo vive dentro del store creado aquí y se pasa por parámetro.
 */

import { i18n } from './i18n.js';
import { $, $q, $qa } from './dom.js';
import { createStore } from './store.js';
import { syncAll } from './sync.js';
import { renderServices, renderAiCards } from './render.js';
import { createChat } from './chat.js';

export const initApp = () => {
  const store = createStore(syncAll);
  const { getState, dispatch } = store;
  const { toggleChat, sendChat } = createChat(store);

  /* -------- handlers -------- */
  const setLang = lang => dispatch({ type: 'SET_LANG', lang });

  const sendMail = async e => {
    e.preventDefault();
    if (getState().form.status === 'sending') return;

    const payload = {
      name:    $('f-name').value.trim(),
      email:   $('f-email').value.trim(),
      message: $('f-msg').value.trim(),
      company: $('f-company').value, // honeypot: vacío en humanos
    };

    dispatch({ type: 'SET_FORM_STATUS', status: 'sending' });
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('bad status ' + r.status);
      dispatch({ type: 'SET_FORM_STATUS', status: 'sent' });
      $('contactForm').reset();
    } catch (err) {
      console.error(err);
      dispatch({ type: 'SET_FORM_STATUS', status: 'error' });
    }
  };

  const navMenuClose = () => {
    $('navLinks').classList.remove('open');
    $('menuBtn').setAttribute('aria-expanded', 'false');
  };

  const handleEscape = e => {
    if (e.key !== 'Escape') return;
    const state = getState();
    if (state.svc.current) {
      dispatch({ type: 'CLOSE_SVC' });
    } else if (state.chat.opened) {
      dispatch({ type: 'SET_CHAT_OPENED', opened: false });
      $('chatFab').focus();
    } else if ($('navLinks').classList.contains('open')) {
      navMenuClose();
      $('menuBtn').focus();
    }
  };

  /* -------- arranque -------- */
  const lang = $q('html').getAttribute('lang') || 'es';
  renderServices(lang, dispatch);
  renderAiCards(lang, dispatch);
  dispatch({ type: 'SET_LANG', lang });

  /* idioma */
  $('btn-es').addEventListener('click', () => setLang('es'));
  $('btn-en').addEventListener('click', () => setLang('en'));

  /* contacto */
  const form = $('contactForm');
  if (form) form.addEventListener('submit', sendMail);

  /* modal */
  $('svcModal').addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = $qa('button, a[href]', $('svcModal'));
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  $('svcBackdrop').addEventListener('click', () => dispatch({ type: 'CLOSE_SVC' }));
  $('svcClose').addEventListener('click', () => dispatch({ type: 'CLOSE_SVC' }));
  $('svcCta').addEventListener('click', () => dispatch({ type: 'CLOSE_SVC' }));
  document.addEventListener('keydown', handleEscape);

  /* chat — evita el teclado en móvil */
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (!getState().chat.opened) return;
      $('chatBody').scrollTop = $('chatBody').scrollHeight;
    });
  }

  /* chat */
  $('chatFab').addEventListener('click', () => toggleChat());
  $('chatClose').addEventListener('click', () => toggleChat(false));
  $('chatSend').addEventListener('click', sendChat);
  $('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

  /* menú */
  $('menuBtn').addEventListener('click', () => {
    const links = $('navLinks');
    links.classList.toggle('open');
    $('menuBtn').setAttribute('aria-expanded', String(links.classList.contains('open')));
  });
  $qa('#navLinks a').forEach(a => a.addEventListener('click', navMenuClose));

  /* reveal — fallback si el navegador no soporta animaciones scroll-driven */
  const cssScrollDriven = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline', 'view()'));
  if (!cssScrollDriven) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    $qa('.reveal').forEach(el => obs.observe(el));
  }

  return store;
};
