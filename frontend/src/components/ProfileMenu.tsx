'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';
import { LogoutIcon, ProfileIcon } from './Icons';

/** Ícono de perfil con menú desplegable: acceso al perfil y, debajo, cerrar sesión. */
export function ProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Se cierra al navegar, al hacer clic fuera o con Escape
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  function handleLogout() {
    setOpen(false);
    logout();
    router.push('/');
  }

  return (
    <div className="profile-menu" ref={ref}>
      <button
        type="button"
        className={`avatar${open || pathname.startsWith('/perfil') ? ' avatar--active' : ''}`}
        aria-label="Menú de perfil"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <ProfileIcon className="avatar__icon" />
      </button>

      {open && (
        <div className="menu" role="menu">
          <div className="menu__head">
            <strong>{user.name}</strong>
            <span className="muted small">@{user.username}</span>
          </div>
          <Link href="/perfil" role="menuitem" className="menu__item">
            <ProfileIcon className="menu__icon" />
            Mi perfil
          </Link>
          <div className="menu__divider" role="separator" />
          <button type="button" role="menuitem" className="menu__item menu__item--danger" onClick={handleLogout}>
            <LogoutIcon className="menu__icon" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
