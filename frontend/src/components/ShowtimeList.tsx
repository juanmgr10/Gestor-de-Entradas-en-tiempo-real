'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatMoney } from '@/lib/format';
import type { Showtime } from '@/lib/types';

const weekday = new Intl.DateTimeFormat('es', { weekday: 'short' });
const month = new Intl.DateTimeFormat('es', { month: 'short' });
const time = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', hour12: false });

// Clave del día en la zona horaria del navegador (YYYY-MM-DD)
const dayKey = (date: Date) => date.toLocaleDateString('en-CA');
const clean = (text: string) => text.replace('.', '');
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

interface Day {
  key: string;
  date: Date;
  showtimes: Showtime[];
}

function dayLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (dayKey(date) === dayKey(today)) return 'Hoy';
  if (dayKey(date) === dayKey(tomorrow)) return 'Mañana';
  return capitalize(clean(weekday.format(date)));
}

/** Selector de funciones: cuadros de día arriba y, debajo, las horas de inicio del día elegido. */
export function ShowtimeList({ showtimes }: { showtimes: Showtime[] }) {
  const days = useMemo<Day[]>(() => {
    const byDay = new Map<string, Day>();
    for (const showtime of showtimes) {
      const date = new Date(showtime.startsAt);
      const key = dayKey(date);
      if (!byDay.has(key)) byDay.set(key, { key, date, showtimes: [] });
      byDay.get(key)!.showtimes.push(showtime);
    }
    return [...byDay.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [showtimes]);

  const [selected, setSelected] = useState<string | null>(null);
  const active = days.find((d) => d.key === selected) ?? days[0];

  if (!active) return null;

  return (
    <div className="schedule">
      <div className="days" role="tablist" aria-label="Días con funciones">
        {days.map((day) => {
          const isActive = day.key === active.key;
          return (
            <button
              key={day.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`day${isActive ? ' day--active' : ''}`}
              onClick={() => setSelected(day.key)}
            >
              <span className="day__weekday">{dayLabel(day.date)}</span>
              <span className="day__number">{day.date.getDate()}</span>
              <span className="day__month">{clean(month.format(day.date))}</span>
            </button>
          );
        })}
      </div>

      <div className="times" role="tabpanel">
        {active.showtimes.map((s) => {
          const start = time.format(new Date(s.startsAt));
          return (
            <Link
              key={s.id}
              href={`/showtimes/${s.id}`}
              className="time"
              title={`${s.hall} · ${formatMoney(s.price)}`}
              aria-label={`Función a las ${start}, ${s.hall}, ${formatMoney(s.price)}`}
            >
              {start}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
