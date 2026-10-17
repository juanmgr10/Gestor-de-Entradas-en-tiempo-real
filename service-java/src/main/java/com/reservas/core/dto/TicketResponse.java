package com.reservas.core.dto;

import com.reservas.core.entity.Ticket;

public record TicketResponse(Long id, String code, String seatId) {

    public static TicketResponse from(Ticket t) {
        return new TicketResponse(t.getId(), t.getCode(), t.getSeatId());
    }
}
