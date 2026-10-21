interface Props {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
}

/** Estado de carga, error o vacío; no renderiza nada si hay datos. */
export function StateMessage({ loading, error, empty, emptyText = 'No hay datos todavía.', onRetry }: Props) {
  if (loading) return <p className="muted">Cargando…</p>;
  if (error)
    return (
      <div className="state state--error">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="button button--ghost" onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    );
  if (empty) return <p className="muted">{emptyText}</p>;
  return null;
}
