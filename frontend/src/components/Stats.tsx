import { formatDateTime, formatDay, formatMoney } from '@/lib/format';
import type { DailyStats, MovieStats, StatsSummary } from '@/lib/types';

export function StatsCards({ summary }: { summary: StatsSummary }) {
  const cards = [
    { label: 'Ingresos', value: formatMoney(summary.totalRevenue) },
    { label: 'Boletos vendidos', value: summary.ticketsSold },
    { label: 'Compras', value: summary.purchases },
    { label: 'Clientes únicos', value: summary.uniqueCustomers },
    { label: 'Precio promedio', value: formatMoney(summary.averageTicketPrice) },
  ];
  return (
    <>
      <div className="stat-cards">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <span className="muted">{c.label}</span>
            <strong>{c.value}</strong>
          </div>
        ))}
      </div>
      <p className="muted small">
        Última compra: {summary.lastPurchaseAt ? formatDateTime(summary.lastPurchaseAt) : '—'}
      </p>
    </>
  );
}

export function TopMoviesTable({ movies }: { movies: MovieStats[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Película</th>
          <th className="num">Boletos</th>
          <th className="num">Compras</th>
          <th className="num">Ingresos</th>
        </tr>
      </thead>
      <tbody>
        {movies.map((m) => (
          <tr key={m.movieId}>
            <td>{m.movieTitle}</td>
            <td className="num">{m.ticketsSold}</td>
            <td className="num">{m.purchases}</td>
            <td className="num">{formatMoney(m.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Barras horizontales simples con CSS: ingresos por día. */
export function DailyBars({ days }: { days: DailyStats[] }) {
  const max = Math.max(...days.map((d) => d.revenue), 1);
  return (
    <ul className="bars">
      {days.map((d) => (
        <li key={d.day} className="bar">
          <span className="bar__label">{formatDay(d.day)}</span>
          <span className="bar__track">
            <span className="bar__fill" style={{ width: `${(d.revenue / max) * 100}%` }} />
          </span>
          <span className="bar__value">
            {formatMoney(d.revenue)}{' '}
            <span className="muted">
              · {d.ticketsSold} {d.ticketsSold === 1 ? 'boleto' : 'boletos'}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
