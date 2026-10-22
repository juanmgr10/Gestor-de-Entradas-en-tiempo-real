import type {
  DailyStats,
  Lock,
  Movie,
  MovieStats,
  PaymentMethod,
  Purchase,
  PurchaseHistory,
  RegisterPending,
  SeatMap,
  Session,
  Showtime,
  StatsSummary,
  TicketVerification,
  User,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/** Error con el formato común de los servicios: {status, message, details}. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: string[] = [],
  ) {
    super(message);
  }
}

// Token de sesión y reacción ante un 401 (los configura AuthProvider)
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const sentToken = authToken;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(sentToken ? { Authorization: `Bearer ${sentToken}` } : {}),
        ...init?.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && sentToken) onUnauthorized?.(); // sesión expirada
    throw new ApiError(res.status, body?.message ?? 'Error inesperado', body?.details ?? []);
  }
  return body as T;
}

const post = <T>(path: string, data: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data) });

// Autenticación
export const login = (username: string, password: string) => post<Session>('/auth/login', { username, password });
export const register = (data: { name: string; username: string; email: string; password: string }) =>
  post<RegisterPending>('/auth/register', data);
export const verifyEmail = (username: string, code: string) =>
  post<Session>('/auth/verify-email', { username, code });
export const resendCode = (username: string) => post<void>('/auth/resend-code', { username });
export const getMe = () => request<User>('/auth/me');

// Catálogo (público)
export const getMovies = () => request<Movie[]>('/movies');
export const getMovie = (id: number) => request<Movie>(`/movies/${id}`);
export const getShowtimes = (movieId: number) => request<Showtime[]>(`/movies/${movieId}/showtimes`);
export const getSeatMap = (showtimeId: number) => request<SeatMap>(`/showtimes/${showtimeId}/seats`);

// Reserva y compra (el usuario sale del token)
export const lockSeat = (showtimeId: number, seatId: string) => post<Lock>('/locks', { showtimeId, seatId });
export const unlockSeat = (showtimeId: number, seatId: string) =>
  request<void>(`/locks/${showtimeId}/${seatId}`, { method: 'DELETE' });
export const purchase = (data: { showtimeId: number; seatIds: string[]; paymentMethod: PaymentMethod }) =>
  post<Purchase>('/purchases', data);

// Perfil
export const getMyPurchases = () => request<PurchaseHistory[]>('/me/purchases');

// Administración
export const getStatsSummary = () => request<StatsSummary>('/stats/summary');
export const getTopMovies = (limit = 10) => request<MovieStats[]>(`/stats/movies?limit=${limit}`);
export const getDailyStats = (days = 7) => request<DailyStats[]>(`/stats/daily?days=${days}`);
export const verifyTicket = (code: string) => request<TicketVerification>(`/tickets/${encodeURIComponent(code)}`);
