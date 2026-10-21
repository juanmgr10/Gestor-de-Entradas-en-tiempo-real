'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Poster } from '@/components/MovieCard';
import { RequireAuth } from '@/components/RequireAuth';
import { StateMessage } from '@/components/StateMessage';
import { TicketList } from '@/components/TicketList';
import { useApi } from '@/hooks/useApi';
import { getMyPurchases } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import type { PurchaseHistory } from '@/lib/types';

const METHOD_LABEL = { CARD: 'Tarjeta', CASH: 'Efectivo', TRANSFER: 'Transferencia' } as const;
const memberSince = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' });

function PurchaseCard({ purchase }: { purchase: PurchaseHistory }) {
  const [open, setOpen] = useState(false);
  const count = purchase.tickets.length;

  return (
    <article className="purchase">
      <div className="purchase__main">
        <Poster
          movie={{
            id: purchase.movieId,
            title: purchase.movieTitle,
            posterUrl: purchase.posterUrl,
            synopsis: null,
            genre: '',
            rating: '',
            durationMinutes: 0,
          }}
          className="poster--thumb"
        />
        <div className="purchase__info">
          <h3>{purchase.movieTitle}</h3>
          <p className="muted small">
            Función: {formatDateTime(purchase.startsAt)} · {purchase.hall}
          </p>
          <div className="chips">
            {purchase.tickets.map((t) => (
              <span key={t.id} className="chip">
                {t.seatId}
              </span>
            ))}
          </div>
          <dl className="purchase__meta">
            <div>
              <dt>Total</dt>
              <dd>{formatMoney(purchase.amount)}</dd>
            </div>
            <div>
              <dt>Pago</dt>
              <dd>{METHOD_LABEL[purchase.paymentMethod]}</dd>
            </div>
            <div>
              <dt>Comprado</dt>
              <dd>{formatDateTime(purchase.purchasedAt)}</dd>
            </div>
            <div>
              <dt>N.º de compra</dt>
              <dd>#{purchase.paymentId}</dd>
            </div>
          </dl>
        </div>
        <button type="button" className="button button--ghost button--small" onClick={() => setOpen((o) => !o)}>
          {open ? 'Ocultar boletos' : `Ver ${count === 1 ? 'boleto' : `${count} boletos`}`}
        </button>
      </div>
      {open && <TicketList tickets={purchase.tickets} />}
    </article>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  const { data: purchases, error, loading, reload } = useApi(getMyPurchases, []);
  if (!user) return null;

  const totalTickets = purchases?.reduce((n, p) => n + p.tickets.length, 0) ?? 0;

  return (
    <>
      <section className="page-head">
        <span className="label">Perfil</span>
        <h1>{user.name}</h1>
      </section>

      <section className="panel profile">
        <dl className="profile__data">
          <div>
            <dt>Usuario</dt>
            <dd>@{user.username}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Tipo de cuenta</dt>
            <dd>{user.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</dd>
          </div>
          <div>
            <dt>Miembro desde</dt>
            <dd className="capitalize-first">{memberSince.format(new Date(user.createdAt))}</dd>
          </div>
          <div>
            <dt>Boletos comprados</dt>
            <dd>{totalTickets}</dd>
          </div>
        </dl>
      </section>

      <section className="section">
        <h2>Información de compra</h2>
        <StateMessage
          loading={loading}
          error={error}
          empty={purchases?.length === 0}
          emptyText="Aún no has realizado compras."
          onRetry={reload}
        />
        <div className="purchases">
          {purchases?.map((p) => <PurchaseCard key={p.paymentId} purchase={p} />)}
        </div>
      </section>
    </>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
