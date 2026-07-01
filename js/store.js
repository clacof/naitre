/* store.js — estado inmutable y unidireccional (estilo Redux, funcional)
 *
 * - createState: estado inicial puro.
 * - transition: reductor puro (state, action) -> state. Nunca muta.
 * - createStore: única fábrica con estado encapsulado. Expone getState y
 *   dispatch; tras cada acción llama al efecto `onChange(state, prev)`.
 */

export const createState = () => ({
  lang: 'es',
  svc:  { current: null, returnFocus: null },
  chat: { history: [], opened: false, busy: false },
  form: { status: 'idle' }, // idle | sending | sent | error
});

export const transition = (state, action) => {
  switch (action.type) {
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
    case 'SET_FORM_STATUS':
      return { ...state, form: { ...state.form, status: action.status } };
    default:
      return state;
  }
};

export const createStore = (onChange = () => {}) => {
  let state = createState();
  const getState = () => state;
  const dispatch = action => {
    const prev = state;
    state = transition(state, action);
    onChange(state, prev);
    return state;
  };
  return { getState, dispatch };
};
