import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/AuthProvider';
import { Header } from '@/components/Header';
import { ToastProvider } from '@/components/ToastProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'butaca · reservas en vivo',
  description: 'Reserva de entradas de cine en tiempo real',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main className="container main">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
