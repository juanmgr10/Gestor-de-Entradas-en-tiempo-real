import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import type { Purchase } from '@/lib/types';
import { TicketList } from './TicketList';

export function PurchaseConfirmation({ purchase, onClose }: { purchase: Purchase; onClose: () => void }) {
  const count = purchase.tickets.length;
  return (
    <div className="panel confirmation">
      <h3>¡Compra confirmada!</h3>
      <p className="muted">
        {purchase.movieTitle} · {count} {count === 1 ? 'boleto' : 'boletos'} · {formatMoney(purchase.amount)}
      </p>
      <p className="small muted">Presenta el código QR de cada boleto en la entrada.</p>
      <TicketList tickets={purchase.tickets} />
      <div className="actions">
        <button type="button" className="button button--ghost" onClick={onClose}>
          Seguir comprando
        </button>
        <Link href="/perfil" className="button button--ghost">
          Mis compras
        </Link>
      </div>
    </div>
  );
}
