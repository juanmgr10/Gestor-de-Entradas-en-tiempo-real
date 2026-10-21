package com.reservas.core.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/** Una compra del usuario (un pago) con la función y sus boletos. */
public record PurchaseHistoryResponse(
        Long paymentId,
        BigDecimal amount,
        String paymentMethod,
        OffsetDateTime purchasedAt,
        Long movieId,
        String movieTitle,
        String posterUrl,
        Long showtimeId,
        String hall,
        OffsetDateTime startsAt,
        List<TicketResponse> tickets
) {
}
