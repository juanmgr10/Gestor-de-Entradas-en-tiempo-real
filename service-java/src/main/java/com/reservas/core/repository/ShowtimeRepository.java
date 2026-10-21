package com.reservas.core.repository;

import com.reservas.core.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

    /** Funciones de la película que aún no comienzan. */
    @Query("""
            SELECT s FROM Showtime s JOIN FETCH s.movie
            WHERE s.movie.id = :movieId AND s.startsAt > :from
            ORDER BY s.startsAt
            """)
    List<Showtime> findUpcomingByMovieId(Long movieId, OffsetDateTime from);

    @Query("SELECT s FROM Showtime s JOIN FETCH s.movie WHERE s.id = :id")
    Optional<Showtime> findByIdWithMovie(Long id);

    boolean existsByHallAndStartsAt(String hall, OffsetDateTime startsAt);
}
