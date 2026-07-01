/* chat.js — UI y flujo del chat. Fábrica que cierra sobre el store.
 *
 * createChat(store) -> { toggleChat, sendChat }
 * Los constructores de mensajes (addMsgEl/addTypingEl) son efectos de DOM
 * locales: insertan y devuelven el nodo, sin tocar el estado.
 */

import { i18n } from './i18n.js';
import { $ } from './dom.js';
import { makeChatMsg } from './pure.js';

const scrollToEnd = body => { body.scrollTop = body.scrollHeight; };

const addMsgEl = (role, text) => {
  const el = document.createElement('div');
  el.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  el.textContent = text;
  const body = $('chatBody');
  body.appendChild(el);
  scrollToEnd(body);
  return el;
};

const addTypingEl = () => {
  const el = document.createElement('div');
  el.className = 'msg bot typing';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span></span><span></span><span></span>';
  const body = $('chatBody');
  body.appendChild(el);
  scrollToEnd(body);
  return el;
};

export const createChat = ({ getState, dispatch }) => {
  const toggleChat = open => {
    const state = getState();
    const next = open !== undefined ? open : !state.chat.opened;
    if (next === state.chat.opened) return;
    if (next && !state.chat.opened && state.chat.history.length === 0) {
      const hello = i18n[state.lang].chat_hello;
      addMsgEl('assistant', hello);
      dispatch({ type: 'ADD_CHAT_MSG', msg: makeChatMsg('assistant', hello) });
    }
    dispatch({ type: 'SET_CHAT_OPENED', opened: next });
    if (next) $('chatInput').focus();
  };

  const sendChat = async () => {
    const input = $('chatInput');
    const text = input.value.trim();
    if (!text || getState().chat.busy) return;
    input.value = '';
    addMsgEl('user', text);
    dispatch({ type: 'ADD_CHAT_MSG', msg: makeChatMsg('user', text) });
    dispatch({ type: 'SET_CHAT_BUSY', busy: true });
    const typing = addTypingEl();
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: getState().chat.history.slice(-12), lang: getState().lang }),
      });
      typing.remove();
      const data = r.ok ? await r.json() : {};
      const reply = data.reply || i18n[getState().lang].chat_error;
      addMsgEl('assistant', reply);
      dispatch({ type: 'ADD_CHAT_MSG', msg: makeChatMsg('assistant', reply) });
    } catch (err) {
      typing.remove();
      addMsgEl('assistant', i18n[getState().lang].chat_error);
    } finally {
      dispatch({ type: 'SET_CHAT_BUSY', busy: false });
      $('chatInput').focus();
    }
  };

  return { toggleChat, sendChat };
};
