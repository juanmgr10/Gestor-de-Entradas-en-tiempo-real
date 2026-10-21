'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { CheckoutPanel } from '@/components/CheckoutPanel';
import { PurchaseConfirmation } from '@/components/PurchaseConfirmation';
import { SeatGrid } from '@/components/SeatGrid';
import { StateMessage } from '@/components/StateMessage';
import { useToast } from '@/components/ToastProvider';
import { useSeatMap } from '@/hooks/useSeatMap';
import { ApiError, lockSeat, purchase, unlockSeat } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { PaymentMethod, Purchase, Seat } from '@/lib/types';

const MAX_SEATS = 10;

const errorMessage = (err: unknown) => (err instanceof ApiError ? err.message : 'Error inesperado');

export default function ShowtimePage({ params }: { params: { id: string } }) {
  const showtimeId = Number(params.id);
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const notify = useToast();
  const [busySeats, setBusySeats] = useState<Set<string>>(new Set());
  const [purchasing, setPurchasing] = useState(false);
  const [confirmation, setConfirmation] = useState<Purchase | null>(null);

  const onMyLockExpired = useCallback(
    (seatId: string) => notify(`Tu reserva de la butaca ${seatId} expiró`, 'error'),
    [notify],
  );
  const { showtime, seats, mySeats, loading, error, refresh, applyLock, applyRelease, applySold } = useSeatMap(
    showtimeId,
    user?.id ?? null,
    onMyLockExpired,
  );

  const loginUrl = `/login?next=${encodeURIComponent(pathname)}`;
  // Funciones pasadas (p. ej. abiertas desde el historial) solo se consultan
  const started = showtime ? new Date(showtime.startsAt).getTime() <= Date.now() : false;

  const setBusy = (seatId: string, busy: boolean) =>
    setBusySeats((prev) => {
      const next = new Set(prev);
      if (busy) next.add(seatId);
      else next.delete(seatId);
      return next;
    });

  // Clic en butaca: libre -> bloquear; propia -> liberar
  async function handleSeatClick(seat: Seat) {
    if (started) {
      notify('Esta función ya comenzó');
      return;
    }
    if (!user) {
      router.push(loginUrl);
      return;
    }
    const mine = seat.status === 'locked' && seat.lockedBy === user.id;
    if (!mine && mySeats.length >= MAX_SEATS) {
      notify(`Puedes reservar hasta ${MAX_SEATS} butacas por compra`);
      return;
    }

    setBusy(seat.seatId, true);
    try {
      if (mine) {
        await unlockSeat(showtimeId, seat.seatId);
        applyRelease(seat.seatId);
      } else {
        applyLock(await lockSeat(showtimeId, seat.seatId));
        setConfirmation(null);
      }
    } catch (err) {
      if (mine && err instanceof ApiError && err.status === 404) {
        applyRelease(seat.seatId); // el bloqueo ya había expirado
      } else {
        notify(errorMessage(err), 'error');
        refresh();
      }
    } finally {
      setBusy(seat.seatId, false);
    }
  }

  async function handlePurchase(paymentMethod: PaymentMethod) {
    setPurchasing(true);
    try {
      const result = await purchase({ showtimeId, seatIds: mySeats.map((s) => s.seatId), paymentMethod });
      applySold(result.tickets.map((t) => t.seatId));
      setConfirmation(result);
      notify('Compra confirmada', 'success');
    } catch (err) {
      notify(errorMessage(err), 'error');
      refresh();
    } finally {
      setPurchasing(false);
    }
  }

  if (!showtime) return <StateMessage loading={loading} error={error} onRetry={refresh} />;

  return (
    <>
      <Link href={`/movies/${showtime.movieId}`} className="back">
        ← {showtime.movieTitle}
      </Link>
      <section className="page-head">
        <h1>{showtime.movieTitle}</h1>
        <p className="muted">
          {formatDateTime(showtime.startsAt)} · {showtime.hall}
        </p>
      </section>

      <div className="booking">
        <SeatGrid
          seats={seats}
          rows={showtime.seatRows}
          columns={showtime.seatColumns}
          userId={user?.id ?? null}
          busySeats={busySeats}
          onSeatClick={handleSeatClick}
        />
        <div className="booking__side">
          {started && (
            <div className="panel">
              <h3>Función finalizada</h3>
              <p className="muted">Esta función ya comenzó; no se pueden reservar butacas.</p>
              <Link href={`/movies/${showtime.movieId}`} className="button button--ghost button--block">
                Ver próximas funciones
              </Link>
            </div>
          )}
          {!started && ready && !user && (
            <div className="panel">
              <h3>Reserva tus butacas</h3>
              <p className="muted">Inicia sesión para seleccionar butacas y comprar.</p>
              <Link href={loginUrl} className="button button--primary button--block">
                Iniciar sesión
              </Link>
            </div>
          )}
          {confirmation && <PurchaseConfirmation purchase={confirmation} onClose={() => setConfirmation(null)} />}
          {!started && user && !confirmation && (
            <CheckoutPanel showtime={showtime} mySeats={mySeats} purchasing={purchasing} onPurchase={handlePurchase} />
          )}
        </div>
      </div>
    </>
  );
}
