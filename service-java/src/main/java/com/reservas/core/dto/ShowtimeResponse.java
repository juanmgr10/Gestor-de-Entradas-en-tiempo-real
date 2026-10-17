package com.reservas.core.dto;

import com.reservas.core.entity.Showtime;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ShowtimeResponse(
        Long id,
        Long movieId,
        String movieTitle,
        String hall,
        OffsetDateTime startsAt,
        BigDecimal price,
        Integer seatRows,
        Integer seatColumns
) {
    public static ShowtimeResponse from(Showtime s) {
        return new ShowtimeResponse(s.getId(), s.getMovie().getId(), s.getMovie().getTitle(),
                s.getHall(), s.getStartsAt(), s.getPrice(), s.getSeatRows(), s.getSeatColumns());
    }
}
