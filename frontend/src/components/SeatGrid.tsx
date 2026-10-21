import type { Seat } from '@/lib/types';
import { SeatIcon } from './SeatIcon';

interface Props {
  seats: Seat[];
  rows: number;
  columns: number;
  userId: number | null;
  busySeats: Set<string>;
  onSeatClick: (seat: Seat) => void;
}

type SeatState = 'free' | 'mine' | 'locked' | 'sold';

const STATUS_LABEL: Record<SeatState, string> = {
  free: 'disponible',
  mine: 'tu selección',
  locked: 'reservada',
  sold: 'vendida',
};

const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function seatState(seat: Seat | undefined, userId: number | null): SeatState {
  if (!seat) return 'free';
  if (seat.status === 'locked') return seat.lockedBy === userId ? 'mine' : 'locked';
  return seat.status;
}

/**
 * Sala como tabla: filas identificadas por letra (A, B, C…) y columnas por número (1, 2, 3…).
 * Cada celda es una butaca; su identificador es fila + columna (ej. D7).
 */
export function SeatGrid({ seats, rows, columns, userId, busySeats, onSeatClick }: Props) {
  const bySeatId = new Map(seats.map((s) => [s.seatId, s]));
  const rowLetters = ROW_LETTERS.slice(0, rows).split('');
  const columnNumbers = Array.from({ length: columns }, (_, i) => i + 1);

  return (
    <div className="seat-map">
      <div className="screen">pantalla</div>

      <div className="hall" role="grid" aria-label="Mapa de butacas" style={{ ['--columns' as string]: columns }}>
        <div className="hall__row hall__row--header" role="row">
          <span className="hall__corner" />
          {columnNumbers.map((n) => (
            <span key={n} className="hall__col-label" role="columnheader">
              {n}
            </span>
          ))}
          <span className="hall__corner" />
        </div>

        {rowLetters.map((row) => (
          <div key={row} className="hall__row" role="row">
            <span className="hall__row-label" role="rowheader">
              {row}
            </span>
            {columnNumbers.map((col) => {
              const seatId = `${row}${col}`;
              const seat = bySeatId.get(seatId);
              const state = seatState(seat, userId);
              const busy = busySeats.has(seatId);
              const clickable = !!seat && (state === 'free' || state === 'mine') && !busy;
              return (
                <button
                  key={seatId}
                  type="button"
                  role="gridcell"
                  className={`seat seat--${state}${busy ? ' seat--busy' : ''}`}
                  disabled={!clickable}
                  onClick={() => seat && onSeatClick(seat)}
                  title={`Butaca ${seatId} · ${STATUS_LABEL[state]}`}
                  aria-label={`Butaca ${seatId}, ${STATUS_LABEL[state]}`}
                >
                  <SeatIcon className="seat__icon" />
                </button>
              );
            })}
            <span className="hall__row-label" aria-hidden="true">
              {row}
            </span>
          </div>
        ))}
      </div>

      <ul className="legend">
        {(Object.keys(STATUS_LABEL) as SeatState[]).map((state) => (
          <li key={state}>
            <span className={`legend__icon seat--${state}`}>
              <SeatIcon className="seat__icon" />
            </span>
            {STATUS_LABEL[state]}
          </li>
        ))}
      </ul>
    </div>
  );
}
