package com.reservas.core.repository;

import com.reservas.core.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("SELECT t.seatId FROM Ticket t WHERE t.showtime.id = :showtimeId ORDER BY t.seatId")
    List<String> findSeatIdsByShowtimeId(Long showtimeId);

    @Query("SELECT t.seatId FROM Ticket t WHERE t.showtime.id = :showtimeId AND t.seatId IN :seatIds")
    List<String> findSoldAmong(Long showtimeId, Collection<String> seatIds);
}
