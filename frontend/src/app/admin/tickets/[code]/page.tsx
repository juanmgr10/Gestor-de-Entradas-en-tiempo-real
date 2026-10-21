'use client';

import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { useApi } from '@/hooks/useApi';
import { ApiError, verifyTicket } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

function TicketVerificationView({ code }: { code: string }) {
  const { data: ticket, error, loading } = useApi(
    () =>
      verifyTicket(code).catch((err) => {
        // 404 = boleto inexistente (QR falso o mal leído)
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
        throw err;
      }),
    [code],
  );

  if (loading) return <p className="muted">Verificando…</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className={`panel verify ${ticket ? 'verify--ok' : 'verify--fail'}`}>
      <div className="verify__status">
        <span className="verify__mark">{ticket ? '✓' : '✕'}</span>
        <div>
          <h2>{ticket ? 'Boleto válido' : 'Boleto no encontrado'}</h2>
          <code className="ticket__code">{code}</code>
        </div>
      </div>
      {ticket && (
        <dl className="verify__data">
          <div><dt>Película</dt><dd>{ticket.movieTitle}</dd></div>
          <div><dt>Función</dt><dd>{formatDateTime(ticket.startsAt)} · {ticket.hall}</dd></div>
          <div><dt>Butaca</dt><dd className="verify__seat">{ticket.seatId}</dd></div>
          <div><dt>Titular</dt><dd>{ticket.holderName} · {ticket.holderEmail}</dd></div>
          <div><dt>Compra</dt><dd>#{ticket.paymentId} · emitido {formatDateTime(ticket.issuedAt)}</dd></div>
        </dl>
      )}
    </div>
  );
}

export default function TicketVerificationPage({ params }: { params: { code: string } }) {
  return (
    <RequireAuth role="ADMIN">
      <Link href="/admin" className="back">
        ← Administración
      </Link>
      <TicketVerificationView code={decodeURIComponent(params.code)} />
    </RequireAuth>
  );
}
