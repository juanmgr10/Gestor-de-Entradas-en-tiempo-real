'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, getSeatMap } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { Lock, Seat, SeatLockedEvent, SeatReleasedEvent, SeatSoldEvent, Showtime } from '@/lib/types';

/**
 * Estado en vivo del mapa de asientos de una función:
 * carga inicial por HTTP + actualizaciones por WebSocket (sala showtime:{id}).
 */
export function useSeatMap(showtimeId: number, userId: number | null, onMyLockExpired?: (seatId: string) => void) {
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs para que los listeners del socket lean siempre el valor actual
  const userRef = useRef(userId);
  const seatsRef = useRef(seats);
  const expiredRef = useRef(onMyLockExpired);
  userRef.current = userId;
  seatsRef.current = seats;
  expiredRef.current = onMyLockExpired;

  const updateSeats = useCallback((ids: string[], patch: (seat: Seat) => Seat) => {
    const set = new Set(ids);
    setSeats((prev) => prev.map((s) => (set.has(s.seatId) ? patch(s) : s)));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const map = await getSeatMap(showtimeId);
      setShowtime(map.showtime);
      setSeats(map.seats);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el mapa de asientos');
    } finally {
      setLoading(false);
    }
  }, [showtimeId]);

  // Actualizaciones locales inmediatas tras una acción propia (el evento WS llega después y es idempotente)
  const applyLock = useCallback(
    (lock: Lock) =>
      updateSeats([lock.seatId], (s) => ({ ...s, status: 'locked', lockedBy: lock.userId, expiresAt: lock.expiresAt })),
    [updateSeats],
  );
  const applyRelease = useCallback(
    (seatId: string) =>
      updateSeats([seatId], (s) => (s.status === 'sold' ? s : { ...s, status: 'free', lockedBy: null, expiresAt: null })),
    [updateSeats],
  );
  const applySold = useCallback(
    (seatIds: string[]) =>
      updateSeats(seatIds, (s) => ({ ...s, status: 'sold', lockedBy: null, expiresAt: null })),
    [updateSeats],
  );

  useEffect(() => {
    const socket = getSocket();
    const join = () => socket.emit('showtime:join', { showtimeId });

    const onConnect = () => {
      join();
      refresh(); // tras reconectar se pudieron perder eventos
    };
    const onLocked = (e: SeatLockedEvent) => applyLock(e);
    const onSold = (e: SeatSoldEvent) => applySold(e.seatIds);
    const onReleased = (e: SeatReleasedEvent) => {
      const seat = seatsRef.current.find((s) => s.seatId === e.seatId);
      if (e.reason === 'expired' && seat?.status === 'locked' && seat.lockedBy === userRef.current) {
        expiredRef.current?.(e.seatId);
      }
      applyRelease(e.seatId);
    };

    refresh();
    if (socket.connected) join();
    socket.on('connect', onConnect);
    socket.on('seat:locked', onLocked);
    socket.on('seat:released', onReleased);
    socket.on('seat:sold', onSold);

    return () => {
      socket.emit('showtime:leave', { showtimeId });
      socket.off('connect', onConnect);
      socket.off('seat:locked', onLocked);
      socket.off('seat:released', onReleased);
      socket.off('seat:sold', onSold);
    };
  }, [showtimeId, refresh, applyLock, applyRelease, applySold]);

  const mySeats = useMemo(
    () => seats.filter((s) => s.status === 'locked' && userId !== null && s.lockedBy === userId),
    [seats, userId],
  );

  return { showtime, seats, mySeats, loading, error, refresh, applyLock, applyRelease, applySold };
}
