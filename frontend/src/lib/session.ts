import type { Session } from './types';

const KEY = 'reservas.session';

// localStorage puede no estar disponible (modo privado); nunca debe romper la app
export function loadSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null): void {
  try {
    if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* sin persistencia: la sesión vive solo en memoria */
  }
}
