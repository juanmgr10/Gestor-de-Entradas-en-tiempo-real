package com.reservas.core.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/** Resultado de la compra; incluye lo necesario para publicar el evento purchase.confirmed. */
public record PurchaseResponse(
        Long paymentId,
        Long userId,
        Long showtimeId,
        Long movieId,
        String movieTitle,
        BigDecimal amount,
        List<TicketResponse> tickets,
        OffsetDateTime purchasedAt
) {
}
