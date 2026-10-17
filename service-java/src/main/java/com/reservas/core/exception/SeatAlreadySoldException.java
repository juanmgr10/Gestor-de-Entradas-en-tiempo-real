package com.reservas.core.exception;

import lombok.Getter;

import java.util.List;

@Getter
public class SeatAlreadySoldException extends RuntimeException {

    private final List<String> seatIds;

    public SeatAlreadySoldException(List<String> seatIds) {
        super("Asientos ya vendidos: " + String.join(", ", seatIds));
        this.seatIds = seatIds;
    }
}
