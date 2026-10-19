package com.reservas.core.exception;

import java.util.List;

public class SeatAlreadySoldException extends RuntimeException {

    private final List<String> seatIds;

    public SeatAlreadySoldException(List<String> seatIds) {
        super("Asientos ya vendidos: " + String.join(", ", seatIds));
        this.seatIds = seatIds;
    }

    public List<String> getSeatIds() {
        return seatIds;
    }
}
