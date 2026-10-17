package com.reservas.core.dto;

import java.util.List;

public record SoldSeatsResponse(Long showtimeId, List<String> seatIds) {
}
