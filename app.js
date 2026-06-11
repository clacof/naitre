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

/* -------- i18n -------- */
let lang = 'es';
function setLang(l){
  lang = l;
  document.documentElement.lang = l;
  document.title = i18n[l].doc_title;
  const md = document.querySelector('meta[name="description"]');
  if(md) md.setAttribute('content', i18n[l].doc_desc);
  const be = document.getElementById('btn-es'), bn = document.getElementById('btn-en');
  be.classList.toggle('active', l==='es'); be.setAttribute('aria-pressed', String(l==='es'));
  bn.classList.toggle('active', l==='en'); bn.setAttribute('aria-pressed', String(l==='en'));
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k = el.getAttribute('data-i18n');
    if(k && i18n[l][k]) el.textContent = i18n[l][k];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el=>{
    const k = el.getAttribute('data-i18n-html');
    if(k && i18n[l][k]) el.innerHTML = i18n[l][k];
  });
  const ci = document.getElementById('chatInput');
  if(ci){ ci.placeholder = i18n[l].chat_ph; ci.setAttribute('aria-label', i18n[l].chat_ph); }
  const ap = document.querySelector('.about-photo img');
  if(ap) ap.setAttribute('alt', i18n[l].about_photo_alt);
  const t = i18n[l];
  document.querySelector('nav').setAttribute('aria-label', t.nav_aria);
  document.getElementById('menuBtn').setAttribute('aria-label', t.menu_label);
  document.getElementById('svcClose').setAttribute('aria-label', t.close_label);
  document.getElementById('chatClose').setAttribute('aria-label', t.close_label);
  document.getElementById('chatSend').setAttribute('aria-label', t.chat_send);
  document.getElementById('chatFab').setAttribute('aria-label', t.chat_open);
  document.getElementById('chatPanel').setAttribute('aria-label', t.chat_title);
  if(typeof svcCurrent === 'string' && svcCurrent) fillSvc(svcCurrent);
}

/* -------- form -------- */
function sendMail(e){
  e.preventDefault();
  const name = document.getElementById('f-name').value;
  const email = document.getElementById('f-email').value;
  const msg = document.getElementById('f-msg').value;
  const subject = encodeURIComponent(lang==='es' ? 'Nuevo proyecto: '+name : 'New project: '+name);
  const body = encodeURIComponent(msg+'\n\n- '+name+' ('+email+')');
  window.location.href = 'mailto:hola@naitre.dev?subject='+subject+'&body='+body;
  return false;
}

/* -------- modal -------- */
const svcModal = document.getElementById('svcModal');
let svcCurrent = null;
function fillSvc(id){
  document.getElementById('svcLabel').textContent = i18n[lang][id.startsWith('ai') ? 'ai_label' : 'serv_label'];
  document.getElementById('svcTitle').textContent = i18n[lang][id+'_t'];
  document.getElementById('svcBody').innerHTML = i18n[lang][id+'_long'] || '';
  document.getElementById('svcCta').textContent = i18n[lang].modal_cta;
}
let svcReturnFocus = null;
const inertTargets = ()=>['nav','main','footer','#chatFab','#chatPanel']
  .map(s=>document.querySelector(s)).filter(Boolean);
function openSvc(id){
  svcCurrent = id; fillSvc(id);
  svcReturnFocus = document.activeElement;
  svcModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  inertTargets().forEach(el=>{ el.inert = true; });
  document.getElementById('svcClose').focus();
}
function closeSvc(){
  if(!svcCurrent) return;
  svcCurrent = null;
  svcModal.classList.remove('open');
  document.body.style.overflow = '';
  inertTargets().forEach(el=>{ el.inert = false; });
  if(svcReturnFocus && svcReturnFocus.focus){ svcReturnFocus.focus(); }
  svcReturnFocus = null;
}

/* -------- chat -------- */
const chatPanel = document.getElementById('chatPanel');
const chatBody  = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const chatSend  = document.getElementById('chatSend');
let chatHistory = [];
let chatOpened = false, chatBusy = false;

function addMsg(role, text){
  const el = document.createElement('div');
  el.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  el.textContent = text;
  chatBody.appendChild(el);
  chatBody.scrollTop = chatBody.scrollHeight;
  return el;
}
function addTyping(){
  const el = document.createElement('div');
  el.className = 'msg bot typing';
  el.setAttribute('aria-hidden','true');
  el.innerHTML = '<span></span><span></span><span></span>';
  chatBody.appendChild(el);
  chatBody.scrollTop = chatBody.scrollHeight;
  return el;
}
function toggleChat(open){
  chatPanel.classList.toggle('open', open);
  const fab = document.getElementById('chatFab');
  fab.classList.toggle('open', open);
  fab.setAttribute('aria-expanded', String(open));
  if(open && !chatOpened){
    chatOpened = true;
    addMsg('assistant', i18n[lang].chat_hello);
  }
  if(open) chatInput.focus();
}
async function sendChat(){
  const text = chatInput.value.trim();
  if(!text || chatBusy) return;
  chatInput.value = '';
  addMsg('user', text);
  chatHistory.push({role:'user', content:text});
  chatBusy = true; chatSend.disabled = true;
  const typing = addTyping();
  try{
    const r = await fetch('/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({messages: chatHistory.slice(-12), lang})
    });
    if(!r.ok) throw new Error('HTTP '+r.status);
    const data = await r.json();
    typing.remove();
    const reply = data.reply || i18n[lang].chat_error;
    addMsg('assistant', reply);
    chatHistory.push({role:'assistant', content:reply});
  }catch(err){
    typing.remove();
    addMsg('assistant', i18n[lang].chat_error);
  }finally{
    chatBusy = false; chatSend.disabled = false; chatInput.focus();
  }
}

/* -------- mobile menu -------- */
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
function closeMenu(){
  navLinks.classList.remove('open');
  menuBtn.setAttribute('aria-expanded','false');
}

/* -------- reveal observer -------- */
function initReveal(){
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('visible'); obs.unobserve(en.target);} });
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

/* -------- template rendering -------- */
function renderServices(){
  const list = document.querySelector('.services-list');
  if(!list) return;
  const tpl = document.getElementById('tpl-service');
  if(!tpl) return;
  serviceIds.forEach(id => {
    const clone = tpl.content.cloneNode(true);
    const div = clone.querySelector('.service');
    const h3 = div.querySelector('h3');
    const p  = div.querySelector('p');
    const more = div.querySelector('.more');
    h3.setAttribute('data-i18n', id+'_t');
    h3.textContent = i18n[lang][id+'_t'];
    p.setAttribute('data-i18n', id+'_d');
    p.textContent = i18n[lang][id+'_d'];
    more.setAttribute('data-i18n', 'more_label');
    more.textContent = i18n[lang].more_label;
    h3.id = id + '-title';
    p.id = id + '-desc';
    div.setAttribute('role','button');
    div.setAttribute('tabindex','0');
    div.setAttribute('aria-labelledby', h3.id);
    div.setAttribute('aria-describedby', p.id);
    div.setAttribute('aria-haspopup','dialog');
    div.addEventListener('click', ()=>openSvc(id));
    div.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openSvc(id); }
    });
    list.appendChild(clone);
  });
}

function renderAiCards(){
  const grid = document.querySelector('.ai-grid');
  if(!grid) return;
  const tplCard = document.getElementById('tpl-ai-card');
  const tplFeat = document.getElementById('tpl-ai-card-feature');
  if(!tplCard || !tplFeat) return;
  aiCards.forEach(item => {
    const tpl = item.feature ? tplFeat : tplCard;
    const clone = tpl.content.cloneNode(true);
    const div = clone.querySelector('.ai-card');
    const h3 = div.querySelector('h3');
    const p  = div.querySelector('p');
    const more = div.querySelector('.more');
    h3.setAttribute('data-i18n', item.id+'_t');
    h3.textContent = i18n[lang][item.id+'_t'];
    p.setAttribute('data-i18n', item.id+'_d');
    p.textContent = i18n[lang][item.id+'_d'];
    more.setAttribute('data-i18n', 'more_label');
    more.textContent = i18n[lang].more_label;
    if(item.tint) div.classList.add('ai-card--tint');
    if(item.feature){
      const img = div.querySelector('img');
      if(img){
        img.src = item.img;
        img.alt = item.alt || '';
      }
    }
    h3.id = item.id + '-title';
    p.id = item.id + '-desc';
    div.setAttribute('role','button');
    div.setAttribute('tabindex','0');
    div.setAttribute('aria-labelledby', h3.id);
    div.setAttribute('aria-describedby', p.id);
    div.setAttribute('aria-haspopup','dialog');
    div.addEventListener('click', ()=>openSvc(item.id));
    div.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openSvc(item.id); }
    });
    grid.appendChild(clone);
  });
}

/* -------- init -------- */
document.addEventListener('DOMContentLoaded', ()=>{
  renderServices();
  renderAiCards();

  setLang(document.documentElement.lang || 'es');

  /* modal events */
  svcModal.addEventListener('keydown', e=>{
    if(e.key !== 'Tab') return;
    const f = svcModal.querySelectorAll('button, a[href]');
    const first = f[0], last = f[f.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
  document.getElementById('svcBackdrop').addEventListener('click', closeSvc);
  document.getElementById('svcClose').addEventListener('click', closeSvc);
  document.getElementById('svcCta').addEventListener('click', closeSvc);
  document.addEventListener('keydown', e=>{
    if(e.key !== 'Escape') return;
    if(svcCurrent){ closeSvc(); return; }
    if(chatPanel.classList.contains('open')){ toggleChat(false); document.getElementById('chatFab').focus(); return; }
    if(navLinks.classList.contains('open')){ closeMenu(); menuBtn.focus(); }
  });

  /* chat events */
  document.getElementById('chatFab').addEventListener('click', ()=>toggleChat(!chatPanel.classList.contains('open')));
  document.getElementById('chatClose').addEventListener('click', ()=>toggleChat(false));
  chatSend.addEventListener('click', sendChat);
  chatInput.addEventListener('keydown', e=>{ if(e.key==='Enter') sendChat(); });

  /* menu events */
  menuBtn.addEventListener('click', ()=>{
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click', closeMenu));

  initReveal();
});
