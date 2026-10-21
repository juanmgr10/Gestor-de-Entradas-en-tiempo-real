package com.reservas.core.dto;

import com.reservas.core.entity.Ticket;

import java.time.OffsetDateTime;

/** Datos de un boleto al escanear su QR. */
public record TicketVerificationResponse(
        String code,
        String seatId,
        Long showtimeId,
        String movieTitle,
        String hall,
        OffsetDateTime startsAt,
        String holderName,
        String holderEmail,
        Long paymentId,
        OffsetDateTime issuedAt
) {
    public static TicketVerificationResponse from(Ticket t) {
        return new TicketVerificationResponse(
                t.getCode(), t.getSeatId(), t.getShowtime().getId(), t.getShowtime().getMovie().getTitle(),
                t.getShowtime().getHall(), t.getShowtime().getStartsAt(), t.getUser().getName(),
                t.getUser().getEmail(), t.getPayment().getId(), t.getIssuedAt());
    }
}
