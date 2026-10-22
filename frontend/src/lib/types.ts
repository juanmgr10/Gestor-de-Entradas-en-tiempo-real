export interface Movie {
  id: number;
  title: string;
  synopsis: string | null;
  genre: string;
  rating: string;
  durationMinutes: number;
  posterUrl: string | null;
}

export interface Showtime {
  id: number;
  movieId: number;
  movieTitle: string;
  hall: string;
  startsAt: string;
  price: number;
  seatRows: number;
  seatColumns: number;
}

export type SeatStatus = 'free' | 'locked' | 'sold';

export interface Seat {
  seatId: string;
  status: SeatStatus;
  lockedBy: number | null;
  expiresAt: string | null;
}

export interface SeatMap {
  showtime: Showtime;
  seats: Seat[];
}

export interface Lock {
  showtimeId: number;
  seatId: string;
  userId: number;
  expiresAt: string;
}

export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
}

export interface Session {
  token: string;
  user: User;
}

/** Respuesta del registro: la sesión empieza al verificar el código enviado por email. */
export interface RegisterPending {
  verificationRequired: true;
  user: { username: string; email: string };
}

export interface Ticket {
  id: number;
  code: string;
  seatId: string;
}

export type PaymentMethod = 'CARD' | 'CASH' | 'TRANSFER';

export interface Purchase {
  paymentId: number;
  userId: number;
  showtimeId: number;
  movieId: number;
  movieTitle: string;
  amount: number;
  tickets: Ticket[];
  purchasedAt: string;
}

export interface PurchaseHistory {
  paymentId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  purchasedAt: string;
  movieId: number;
  movieTitle: string;
  posterUrl: string | null;
  showtimeId: number;
  hall: string;
  startsAt: string;
  tickets: Ticket[];
}

export interface TicketVerification {
  code: string;
  seatId: string;
  showtimeId: number;
  movieTitle: string;
  hall: string;
  startsAt: string;
  holderName: string;
  holderEmail: string;
  paymentId: number;
  issuedAt: string;
}

export interface StatsSummary {
  totalRevenue: number;
  ticketsSold: number;
  purchases: number;
  uniqueCustomers: number;
  averageTicketPrice: number;
  lastPurchaseAt: string | null;
}

export interface MovieStats {
  movieId: number;
  movieTitle: string;
  ticketsSold: number;
  purchases: number;
  revenue: number;
}

export interface DailyStats {
  day: string;
  ticketsSold: number;
  revenue: number;
}

// Eventos WebSocket emitidos por el gateway
export type SeatLockedEvent = Lock;

export interface SeatReleasedEvent {
  showtimeId: number;
  seatId: string;
  reason: 'cancelled' | 'expired';
}

export interface SeatSoldEvent {
  showtimeId: number;
  seatIds: string[];
}
