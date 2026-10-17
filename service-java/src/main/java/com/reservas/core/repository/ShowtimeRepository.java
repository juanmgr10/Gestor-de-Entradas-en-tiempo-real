package com.reservas.core.repository;

import com.reservas.core.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

    @Query("SELECT s FROM Showtime s JOIN FETCH s.movie WHERE s.movie.id = :movieId ORDER BY s.startsAt")
    List<Showtime> findByMovieIdWithMovie(Long movieId);

    @Query("SELECT s FROM Showtime s JOIN FETCH s.movie WHERE s.id = :id")
    Optional<Showtime> findByIdWithMovie(Long id);
}
