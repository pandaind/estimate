import { createContext, useContext, useReducer, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

// ─── helpers ────────────────────────────────────────────────────────────────

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    const session      = raw ? JSON.parse(raw) : null;
    const userName     = localStorage.getItem(STORAGE_KEYS.USER_NAME)  || '';
    const rawId        = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const userId       = rawId ? parseInt(rawId, 10) : null;
    const isModerator  = localStorage.getItem(STORAGE_KEYS.IS_MODERATOR) === 'true';
    if (session && userName && userId) {
      return { session, userName, userId, isModerator };
    }
  } catch (_) {
    // corrupted storage — clear it
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
  return { session: null, userName: '', userId: null, isModerator: false };
};

const persistToStorage = (state) => {
  if (state.session && state.userName && state.userId) {
    localStorage.setItem(STORAGE_KEYS.SESSION,      JSON.stringify(state.session));
    localStorage.setItem(STORAGE_KEYS.USER_NAME,    state.userName);
    localStorage.setItem(STORAGE_KEYS.USER_ID,      String(state.userId));
    localStorage.setItem(STORAGE_KEYS.IS_MODERATOR, String(state.isModerator));
  } else {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
};

// ─── reducer ────────────────────────────────────────────────────────────────

const initialState = { session: null, userName: '', userId: null, isModerator: false };

function sessionReducer(state, action) {
  switch (action.type) {
    case 'SESSION_CREATED':
      return {
        ...state,
        session:     action.payload.session,
        userName:    action.payload.userName || 'Host',
        userId:      action.payload.userId   ?? action.payload.session.moderatorId,
        isModerator: true,
      };
    case 'SESSION_JOINED':
      return {
        ...state,
        session:     action.payload.session,
        userName:    action.payload.userName,
        userId:      action.payload.userId,
        isModerator: false,
      };
    case 'SESSION_LEFT':
      return { ...initialState };
    case 'SESSION_UPDATED':
      return { ...state, session: { ...state.session, ...action.payload } };
    default:
      return state;
  }
}

// ─── context ────────────────────────────────────────────────────────────────

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(sessionReducer, undefined, loadFromStorage);

  useEffect(() => {
    persistToStorage(state);
  }, [state]);

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Hook to read session state and dispatch session actions.
 * @returns {{ state: typeof initialState, dispatch: Function }}
 */
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
