'use client';

import Link from 'next/link';
import { Poster } from '@/components/MovieCard';
import { ShowtimeList } from '@/components/ShowtimeList';
import { StateMessage } from '@/components/StateMessage';
import { useApi } from '@/hooks/useApi';
import { getMovie, getShowtimes } from '@/lib/api';
import { formatDuration } from '@/lib/format';

export default function MoviePage({ params }: { params: { id: string } }) {
  const movieId = Number(params.id);
  const { data, error, loading, reload } = useApi(
    () => Promise.all([getMovie(movieId), getShowtimes(movieId)]),
    [movieId],
  );

  if (!data) return <StateMessage loading={loading} error={error} onRetry={reload} />;
  const [movie, showtimes] = data;

  return (
    <>
      <Link href="/" className="back">
        ← Cartelera
      </Link>
      <section className="movie-detail">
        <Poster movie={movie} className="poster--large" />
        <div className="movie-detail__info">
          <h1>{movie.title}</h1>
          <p className="muted">
            {movie.genre} · {formatDuration(movie.durationMinutes)} · {movie.rating}
          </p>
          {movie.synopsis && <p>{movie.synopsis}</p>}
          <h2>Funciones</h2>
          <StateMessage empty={showtimes.length === 0} emptyText="No hay funciones programadas." />
          <ShowtimeList showtimes={showtimes} />
        </div>
      </section>
    </>
  );
}
