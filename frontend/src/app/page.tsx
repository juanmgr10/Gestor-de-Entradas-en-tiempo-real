'use client';

import { MovieCard } from '@/components/MovieCard';
import { StateMessage } from '@/components/StateMessage';
import { useApi } from '@/hooks/useApi';
import { getMovies } from '@/lib/api';

export default function HomePage() {
  const { data: movies, error, loading, reload } = useApi(getMovies, []);

  return (
    <>
      <section className="page-head">
        <h1>Cartelera</h1>
        <p className="muted">Elige una película y reserva tus asientos en tiempo real.</p>
      </section>
      <StateMessage loading={loading} error={error} empty={movies?.length === 0} onRetry={reload} />
      {movies && (
        <div className="movie-grid">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </>
  );
}
