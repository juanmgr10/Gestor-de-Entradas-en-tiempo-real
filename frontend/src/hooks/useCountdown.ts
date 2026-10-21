'use client';

import { useEffect, useState } from 'react';

const secondsUntil = (iso: string | null) =>
  iso ? Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000)) : 0;

/** Segundos restantes hasta expiresAt, actualizado cada segundo. */
export function useCountdown(expiresAt: string | null): number {
  const [seconds, setSeconds] = useState(() => secondsUntil(expiresAt));

  useEffect(() => {
    setSeconds(secondsUntil(expiresAt));
    if (!expiresAt) return;
    const timer = setInterval(() => setSeconds(secondsUntil(expiresAt)), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return seconds;
}
