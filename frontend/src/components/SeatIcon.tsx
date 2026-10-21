/** Ícono de butaca (respaldo, asiento, apoyabrazos y patas). Toma el color de currentColor. */
export function SeatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <rect x="5" y="2.5" width="14" height="11" rx="3" fill="currentColor" />
      <rect x="4" y="12" width="16" height="5" rx="2" fill="currentColor" />
      <rect x="1.5" y="9" width="3.5" height="9" rx="1.6" fill="currentColor" opacity="0.85" />
      <rect x="19" y="9" width="3.5" height="9" rx="1.6" fill="currentColor" opacity="0.85" />
      <rect x="6" y="17" width="2.2" height="4.5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="15.8" y="17" width="2.2" height="4.5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="7.5" y="5" width="9" height="1.6" rx="0.8" fill="#fff" opacity="0.35" />
    </svg>
  );
}
