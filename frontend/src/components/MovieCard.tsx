'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatDuration } from '@/lib/format';
import type { Movie } from '@/lib/types';

export function Poster({ movie, className = '' }: { movie: Movie; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!movie.posterUrl || failed) {
    return <div className={`poster poster--fallback ${className}`}>{movie.title.charAt(0)}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={movie.posterUrl}
      alt={`Póster de ${movie.title}`}
      className={`poster ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/movies/${movie.id}`} className="movie-card">
      <Poster movie={movie} />
      <div className="movie-card__body">
        <h3>{movie.title}</h3>
        <p className="muted">
          {movie.genre} · {formatDuration(movie.durationMinutes)} · <span className="nowrap">{movie.rating}</span>
        </p>
      </div>
    </Link>
  );
}
