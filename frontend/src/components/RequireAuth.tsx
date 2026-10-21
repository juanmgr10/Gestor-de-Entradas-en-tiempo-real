'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import type { Role } from '@/lib/types';
import { useAuth } from './AuthProvider';

/**
 * Protege una página: sin sesión redirige al login (o al inicio si el usuario acaba de cerrar sesión);
 * con rol insuficiente muestra aviso.
 */
export function RequireAuth({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, ready, logoutReason } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready || user) return;
    router.replace(logoutReason === 'manual' ? '/' : `/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, logoutReason, router, pathname]);

  if (!ready || !user) return <p className="muted">Cargando…</p>;
  if (role && user.role !== role) {
    return (
      <div className="panel narrow">
        <h3>Acceso restringido</h3>
        <p className="muted">Esta sección es solo para administradores.</p>
      </div>
    );
  }
  return <>{children}</>;
}
