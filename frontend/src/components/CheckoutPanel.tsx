'use client';

import { useState } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCountdown, formatMoney } from '@/lib/format';
import type { PaymentMethod, Seat, Showtime } from '@/lib/types';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
];

interface Props {
  showtime: Showtime;
  mySeats: Seat[];
  purchasing: boolean;
  onPurchase: (method: PaymentMethod) => void;
}

/** Resumen de la selección, tiempo restante del bloqueo y botón de compra. */
export function CheckoutPanel({ showtime, mySeats, purchasing, onPurchase }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('CARD');

  // El bloqueo que expira primero define el tiempo disponible para pagar
  const firstExpiry = mySeats.reduce<string | null>(
    (min, s) => (s.expiresAt && (!min || s.expiresAt < min) ? s.expiresAt : min),
    null,
  );
  const seconds = useCountdown(firstExpiry);
  const total = showtime.price * mySeats.length;

  return (
    <aside className="panel checkout">
      <h3>Tu selección</h3>
      {mySeats.length === 0 ? (
        <p className="muted">Elige uno o más asientos en el mapa.</p>
      ) : (
        <>
          <div className="chips">
            {mySeats.map((s) => (
              <span key={s.seatId} className="chip">
                {s.seatId}
              </span>
            ))}
          </div>
          <dl className="summary">
            <dt>Precio unitario</dt>
            <dd>{formatMoney(showtime.price)}</dd>
            <dt>Total</dt>
            <dd className="summary__total">{formatMoney(total)}</dd>
          </dl>
          <p className={`countdown${seconds <= 60 ? ' countdown--warning' : ''}`}>
            Reservado por {formatCountdown(seconds)}
          </p>
          <label className="field">
            <span>Método de pago</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      <button
        type="button"
        className="button button--primary button--block"
        disabled={mySeats.length === 0 || purchasing}
        onClick={() => onPurchase(method)}
      >
        {purchasing ? 'Procesando…' : 'Comprar'}
      </button>
    </aside>
  );
}
