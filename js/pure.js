/* pure.js — helpers puros (sin efectos, sin DOM): entrada -> salida */

export const svcPrefix = id => (id.startsWith('ai') ? 'ai_label' : 'serv_label');

export const makeChatMsg = (role, content) => ({ role, content });

export const chatSubject = (name, lang) =>
  (lang === 'en' ? 'New project: ' : 'Nuevo proyecto: ') + name;
