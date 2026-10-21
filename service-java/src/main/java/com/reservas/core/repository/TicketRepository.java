package com.reservas.core.repository;

import com.reservas.core.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("SELECT t.seatId FROM Ticket t WHERE t.showtime.id = :showtimeId ORDER BY t.seatId")
    List<String> findSeatIdsByShowtimeId(Long showtimeId);

    @Query("SELECT t.seatId FROM Ticket t WHERE t.showtime.id = :showtimeId AND t.seatId IN :seatIds")
    List<String> findSoldAmong(Long showtimeId, Collection<String> seatIds);

    /** Boletos del usuario con pago, función y película (una sola consulta). */
    @Query("""
            SELECT t FROM Ticket t
            JOIN FETCH t.payment p
            JOIN FETCH t.showtime s
            JOIN FETCH s.movie
            WHERE t.user.id = :userId
            ORDER BY p.createdAt DESC, t.seatId
            """)
    List<Ticket> findHistoryByUserId(Long userId);

    @Query("""
            SELECT t FROM Ticket t
            JOIN FETCH t.user
            JOIN FETCH t.payment
            JOIN FETCH t.showtime s
            JOIN FETCH s.movie
            WHERE t.code = :code
            """)
    Optional<Ticket> findByCodeWithDetails(String code);
}
