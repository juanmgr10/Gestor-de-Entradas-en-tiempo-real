'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { DailyBars, StatsCards, TopMoviesTable } from '@/components/Stats';
import { StateMessage } from '@/components/StateMessage';
import { useApi } from '@/hooks/useApi';
import { getDailyStats, getStatsSummary, getTopMovies } from '@/lib/api';

const REFRESH_MS = 10_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function TicketLookup() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Acepta el código o la URL completa leída del QR
    const value = code.trim().split('/').pop() ?? '';
    if (!UUID.test(value)) {
      setError('Código de boleto inválido');
      return;
    }
    router.push(`/admin/tickets/${value}`);
  }

  return (
    <form className="panel lookup" onSubmit={handleSubmit}>
      <h3>Verificar boleto</h3>
      <p className="muted small">Pega el código del boleto o la URL leída del QR.</p>
      <div className="lookup__row">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        <button type="submit" className="button button--primary">
          Verificar
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}

function AdminDashboard() {
  const { data, error, loading, reload } = useApi(
    () => Promise.all([getStatsSummary(), getTopMovies(10), getDailyStats(7)]),
    [],
  );

  // Las ventas llegan de forma asíncrona (evento purchase.confirmed): refresco periódico
  useEffect(() => {
    const timer = setInterval(reload, REFRESH_MS);
    return () => clearInterval(timer);
  }, [reload]);

  return (
    <>
      <section className="page-head">
        <span className="label">Administración</span>
        <h1>Panel de ventas</h1>
        <p className="muted">Ventas confirmadas. Se actualiza cada 10 segundos.</p>
      </section>
      {!data && <StateMessage loading={loading} error={error} onRetry={reload} />}
      {data && (
        <>
          <StatsCards summary={data[0]} />
          <div className="stats-grid">
            <section className="panel">
              <h3>Películas más vendidas</h3>
              <StateMessage empty={data[1].length === 0} emptyText="Aún no hay ventas." />
              {data[1].length > 0 && <TopMoviesTable movies={data[1]} />}
            </section>
            <section className="panel">
              <h3>Últimos 7 días</h3>
              <StateMessage empty={data[2].length === 0} emptyText="Aún no hay ventas." />
              {data[2].length > 0 && <DailyBars days={data[2]} />}
            </section>
          </div>
        </>
      )}
      <div className="section">
        <TicketLookup />
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth role="ADMIN">
      <AdminDashboard />
    </RequireAuth>
  );
}
