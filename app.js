/* -------- data -------- */
const serviceIds = ['s1','s2','s3','s4','s5','s6'];

const aiCards = [
  { id:'ai1', feature:true,  img:'brand/agents.png', alt:'Arco de luz terracota naciendo en un campo oscuro' },
  { id:'ai2', feature:false, tint:false },
  { id:'ai3', feature:false, tint:false },
  { id:'ai4', feature:false, tint:false },
  { id:'ai5', feature:false, tint:false },
  { id:'ai6', feature:false, tint:true  },
];

/* -------- state (inmutable, unidireccional) -------- */
const createState = () => ({
  lang: 'es',
  svc:  { current: null, returnFocus: null },
  chat: { history: [], opened: false, busy: false },
});

const transition = (state, action) => {
  switch(action.type){
    case 'SET_LANG':
      return { ...state, lang: action.lang };
    case 'OPEN_SVC':
      return { ...state, svc: { current: action.id, returnFocus: document.activeElement } };
    case 'CLOSE_SVC':
      return { ...state, svc: { current: null, returnFocus: state.svc.returnFocus } };
    case 'ADD_CHAT_MSG':
      return { ...state, chat: { ...state.chat, history: [...state.chat.history, action.msg] } };
    case 'SET_CHAT_BUSY':
      return { ...state, chat: { ...state.chat, busy: action.busy } };
    case 'SET_CHAT_OPENED':
      return { ...state, chat: { ...state.chat, opened: action.opened } };
    default:
      return state;
  }
};

/* -------- dom helpers -------- */
const $ = id => document.getElementById(id);
const $q = (sel, ctx) => (ctx || document).querySelector(sel);
const $qa = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];
const setAttr = (el, k, v) => { if(el) el.setAttribute(k, v); };
const setText = (el, t) => { if(el) el.textContent = t; };

const inertTargets = () =>
  ['nav','main','footer','#chatFab','#chatPanel'].map(s => $q(s)).filter(Boolean);

/* -------- pure helpers -------- */
const svcPrefix = id => id.startsWith('ai') ? 'ai_label' : 'serv_label';
const makeChatMsg = (role, content) => ({ role, content });
const chatSubject = (name, lang) =>
  (lang === 'en' ? 'New project: ' : 'Nuevo proyecto: ') + name;

/* -------- dom sync (efectos laterales aislados) -------- */
const syncAll = (state, prev) => {
  syncLang(state);
  if(state.svc.current !== (prev && prev.svc ? prev.svc.current : null)) syncModal(state);
  if(state.chat.opened !== (prev && prev.chat ? prev.chat.opened : null)) syncChatPanel(state);
  if(state.chat.busy !== (prev && prev.chat ? prev.chat.busy : false)) syncChatBusy(state);
};

const syncLang = state => {
  const t = i18n[state.lang];
  document.documentElement.lang = state.lang;
  document.title = t.doc_title;
  const md = $q('meta[name="description"]');
  if(md) md.setAttribute('content', t.doc_desc);

  const be = $('btn-es'), bn = $('btn-en');
  be.classList.toggle('active', state.lang==='es');
  be.setAttribute('aria-pressed', String(state.lang==='es'));
  bn.classList.toggle('active', state.lang==='en');
  bn.setAttribute('aria-pressed', String(state.lang==='en'));

  $qa('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if(k && t[k]) el.textContent = t[k];
  });
  $qa('[data-i18n-html]').forEach(el => {
    const k = el.getAttribute('data-i18n-html');
    if(k && t[k]) el.innerHTML = t[k];
  });

  const ci = $('chatInput');
  if(ci){ ci.placeholder = t.chat_ph; ci.setAttribute('aria-label', t.chat_ph); }
  const ap = $q('.about-photo img');
  if(ap) ap.setAttribute('alt', t.about_photo_alt);

  $q('nav').setAttribute('aria-label', t.nav_aria);
  $('menuBtn').setAttribute('aria-label', t.menu_label);
  $('svcClose').setAttribute('aria-label', t.close_label);
  $('chatClose').setAttribute('aria-label', t.close_label);
  $('chatSend').setAttribute('aria-label', t.chat_send);
  $('chatFab').setAttribute('aria-label', t.chat_open);
  $('chatPanel').setAttribute('aria-label', t.chat_title);

  if(state.svc.current) syncModalContent(state.svc.current, state.lang);
};

const syncModal = state => {
  const { current, returnFocus } = state.svc;
  const m = $('svcModal');
  if(!current){
    m.classList.remove('open');
    document.body.style.overflow = '';
    inertTargets().forEach(el => { el.inert = false; });
    if(returnFocus && returnFocus.focus) returnFocus.focus();
    return;
  }
  syncModalContent(current, state.lang);
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  inertTargets().forEach(el => { el.inert = true; });
  $('svcClose').focus();
};

const syncModalContent = (id, lang) => {
  $('svcLabel').textContent = i18n[lang][svcPrefix(id)];
  $('svcTitle').textContent = i18n[lang][id+'_t'];
  $('svcBody').innerHTML = i18n[lang][id+'_long'] || '';
  $('svcCta').textContent = i18n[lang].modal_cta;
};

const syncChatPanel = state => {
  const { opened } = state.chat;
  const panel = $('chatPanel');
  const fab = $('chatFab');
  panel.classList.toggle('open', opened);
  fab.classList.toggle('open', opened);
  fab.setAttribute('aria-expanded', String(opened));
};

const syncChatBusy = state => {
  const btn = $('chatSend');
  const inp = $('chatInput');
  if(btn) { btn.disabled = state.chat.busy; btn.setAttribute('aria-busy', String(state.chat.busy)); }
  if(inp) inp.disabled = state.chat.busy;
};

/* -------- template rendering -------- */
const makeCardInteractive = (el, id) => {
  const cb = () => dispatch({ type:'OPEN_SVC', id });
  setAttr(el, 'role', 'button');
  setAttr(el, 'tabindex', '0');
  setAttr(el, 'aria-labelledby', id+'-title');
  setAttr(el, 'aria-describedby', id+'-desc');
  setAttr(el, 'aria-haspopup', 'dialog');
  el.addEventListener('click', cb);
  el.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); cb(); }
  });
};

const renderServices = lang => {
  const list = $q('.services-list');
  const tpl = $('tpl-service');
  if(!list || !tpl) return;
  serviceIds.forEach(id => {
    const div = tpl.content.cloneNode(true).querySelector('.service');
    const h3 = div.querySelector('h3'), p = div.querySelector('p'), m = div.querySelector('.more');
    setAttr(h3, 'data-i18n', id+'_t'); setText(h3, i18n[lang][id+'_t']);
    setAttr(p, 'data-i18n', id+'_d');  setText(p, i18n[lang][id+'_d']);
    setAttr(m, 'data-i18n', 'more_label'); setText(m, i18n[lang].more_label);
    h3.id = id+'-title'; p.id = id+'-desc';
    makeCardInteractive(div, id);
    list.appendChild(div);
  });
};

const renderAiCards = lang => {
  const grid = $q('.ai-grid');
  const tplCard = $('tpl-ai-card'), tplFeat = $('tpl-ai-card-feature');
  if(!grid || !tplCard || !tplFeat) return;
  aiCards.forEach(item => {
    const tpl = item.feature ? tplFeat : tplCard;
    const div = tpl.content.cloneNode(true).querySelector('.ai-card');
    const h3 = div.querySelector('h3'), p = div.querySelector('p'), m = div.querySelector('.more');
    setAttr(h3, 'data-i18n', item.id+'_t'); setText(h3, i18n[lang][item.id+'_t']);
    setAttr(p, 'data-i18n', item.id+'_d');  setText(p, i18n[lang][item.id+'_d']);
    setAttr(m, 'data-i18n', 'more_label'); setText(m, i18n[lang].more_label);
    if(item.tint) div.classList.add('ai-card--tint');
    if(item.feature){
      const img = div.querySelector('img');
      if(img){ img.src = item.img; img.alt = item.alt || ''; }
    }
    h3.id = item.id+'-title'; p.id = item.id+'-desc';
    makeCardInteractive(div, item.id);
    grid.appendChild(div);
  });
};

/* -------- dom builders (chat) -------- */
const addMsgEl = (role, text) => {
  const el = document.createElement('div');
  el.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  el.textContent = text;
  const body = $('chatBody');
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
};

const addTypingEl = () => {
  const el = document.createElement('div');
  el.className = 'msg bot typing';
  el.setAttribute('aria-hidden','true');
  el.innerHTML = '<span></span><span></span><span></span>';
  const body = $('chatBody');
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
  return el;
};

/* -------- store (único punto de mutación) -------- */
let state = createState();
let prevState = null;

const dispatch = action => {
  prevState = state;
  state = transition(state, action);
  syncAll(state, prevState);
};

window.setLang = l => dispatch({ type:'SET_LANG', lang:l });

/* -------- event handlers -------- */
const sendMail = e => {
  e.preventDefault();
  const name = $('f-name').value;
  const email = $('f-email').value;
  const msg = $('f-msg').value;
  window.location.href = 'mailto:hola@naitre.dev?' +
    'subject=' + encodeURIComponent(chatSubject(name, state.lang)) +
    '&body='  + encodeURIComponent(msg + '\n\n- ' + name + ' (' + email + ')');
};

const handleEscape = e => {
  if(e.key !== 'Escape') return;
  if(state.svc.current){ dispatch({ type:'CLOSE_SVC' }); }
  else if(state.chat.opened){ dispatch({ type:'SET_CHAT_OPENED', opened:false }); $('chatFab').focus(); }
  else if($('navLinks').classList.contains('open')){ navMenuClose(); $('menuBtn').focus(); }
};

const navMenuClose = () => {
  const links = $('navLinks');
  links.classList.remove('open');
  $('menuBtn').setAttribute('aria-expanded','false');
};

const toggleChat = (open) => {
  const next = open !== undefined ? open : !state.chat.opened;
  if(next === state.chat.opened) return;
  if(next && !state.chat.opened && state.chat.history.length === 0){
    const hello = i18n[state.lang].chat_hello;
    addMsgEl('assistant', hello);
    dispatch({ type:'ADD_CHAT_MSG', msg:makeChatMsg('assistant', hello) });
  }
  dispatch({ type:'SET_CHAT_OPENED', opened:next });
  if(next) $('chatInput').focus();
};

const sendChat = async () => {
  const input = $('chatInput');
  const text = input.value.trim();
  if(!text || state.chat.busy) return;
  input.value = '';
  addMsgEl('user', text);
  dispatch({ type:'ADD_CHAT_MSG', msg:makeChatMsg('user', text) });
  dispatch({ type:'SET_CHAT_BUSY', busy:true });
  const typing = addTypingEl();
  try{
    const r = await fetch('/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ messages: state.chat.history.slice(-12), lang: state.lang })
    });
    typing.remove();
    const data = r.ok ? await r.json() : {};
    const reply = data.reply || i18n[state.lang].chat_error;
    addMsgEl('assistant', reply);
    dispatch({ type:'ADD_CHAT_MSG', msg:makeChatMsg('assistant', reply) });
  }catch(err){
    typing.remove();
    addMsgEl('assistant', i18n[state.lang].chat_error);
  }finally{
    dispatch({ type:'SET_CHAT_BUSY', busy:false });
    $('chatInput').focus();
  }
};

/* -------- init -------- */
document.addEventListener('DOMContentLoaded', () => {
  const lang = $q('html').getAttribute('lang') || 'es';
  renderServices(lang);
  renderAiCards(lang);
  dispatch({ type:'SET_LANG', lang });

  /* modal */
  $('svcModal').addEventListener('keydown', e => {
    if(e.key !== 'Tab') return;
    const f = $qa('button, a[href]', $('svcModal'));
    const first = f[0], last = f[f.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
  $('svcBackdrop').addEventListener('click', () => dispatch({ type:'CLOSE_SVC' }));
  $('svcClose').addEventListener('click', () => dispatch({ type:'CLOSE_SVC' }));
  $('svcCta').addEventListener('click', () => dispatch({ type:'CLOSE_SVC' }));
  document.addEventListener('keydown', handleEscape);

  /* chat — keyboard avoidance (mobile) */
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', () => {
      if(!state.chat.opened) return;
      $('chatBody').scrollTop = $('chatBody').scrollHeight;
    });
  }

  /* chat */
  $('chatFab').addEventListener('click', () => toggleChat());
  $('chatClose').addEventListener('click', () => toggleChat(false));
  $('chatSend').addEventListener('click', sendChat);
  $('chatInput').addEventListener('keydown', e => { if(e.key==='Enter') sendChat(); });

  /* menu */
  $('menuBtn').addEventListener('click', () => {
    const links = $('navLinks');
    links.classList.toggle('open');
    $('menuBtn').setAttribute('aria-expanded', String(links.classList.contains('open')));
  });
  $qa('#navLinks a').forEach(a => a.addEventListener('click', navMenuClose));

  /* reveal */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if(en.isIntersecting){ en.target.classList.add('visible'); obs.unobserve(en.target); }
    });
  }, { threshold:.12 });
  $qa('.reveal').forEach(el => obs.observe(el));
});
