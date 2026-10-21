package com.reservas.core.repository;

import com.reservas.core.entity.ShowtimeSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ShowtimeScheduleRepository extends JpaRepository<ShowtimeSchedule, Long> {

    @Query("SELECT s FROM ShowtimeSchedule s JOIN FETCH s.movie WHERE s.active = true")
    List<ShowtimeSchedule> findActiveWithMovie();
}
