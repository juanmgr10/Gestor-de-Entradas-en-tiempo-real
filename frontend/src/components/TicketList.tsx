import type { Ticket } from '@/lib/types';
import { TicketQr } from './TicketQr';

/** Boletos con su QR: prueba de compra que se presenta en la entrada. */
export function TicketList({ tickets }: { tickets: Ticket[] }) {
  return (
    <ul className="tickets">
      {tickets.map((t) => (
        <li key={t.id} className="ticket">
          <TicketQr code={t.code} />
          <div className="ticket__info">
            <span className="muted small">Butaca</span>
            <span className="ticket__seat">{t.seatId}</span>
            <code className="ticket__code">{t.code}</code>
          </div>
        </li>
      ))}
    </ul>
  );
}
