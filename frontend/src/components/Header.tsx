'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { ProfileMenu } from './ProfileMenu';

export function Header() {
  const pathname = usePathname();
  const { user, ready } = useAuth();

  const links = [
    { href: '/', label: 'Cartelera', show: true },
    { href: '/admin', label: 'Administración', show: user?.role === 'ADMIN' },
  ].filter((l) => l.show);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="header">
      <div className="container header__inner">
        <Link href="/" className="brand">
          butaca<span className="brand__dot">.</span>
        </Link>
        <nav className="nav">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`nav__link${isActive(link.href) ? ' nav__link--active' : ''}`}>
              {link.label}
            </Link>
          ))}
        </nav>
        {ready &&
          (user ? (
            <ProfileMenu />
          ) : (
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="button button--ghost button--small">
              Iniciar sesión
            </Link>
          ))}
      </div>
    </header>
  );
}
