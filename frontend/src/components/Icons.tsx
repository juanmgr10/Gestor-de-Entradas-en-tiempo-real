/** Íconos de interfaz en línea; toman el color de currentColor. */
export function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <circle cx="12" cy="8.5" r="4" fill="currentColor" />
      <path d="M4 20.5c0-4.1 3.6-7 8-7s8 2.9 8 7v.5H4v-.5z" fill="currentColor" />
    </svg>
  );
}

export function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 16l-4-4 4-4" />
      <path d="M6 12h10" />
    </svg>
  );
}
