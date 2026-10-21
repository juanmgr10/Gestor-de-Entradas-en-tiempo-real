const dateTime = new Intl.DateTimeFormat('es', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const dayMonth = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export const formatMoney = (value: number) => `$${value.toFixed(2)}`;
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDay = (isoDate: string) => dayMonth.format(new Date(`${isoDate}T00:00:00Z`));
export const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)} h ${minutes % 60} min`;

export const formatCountdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
