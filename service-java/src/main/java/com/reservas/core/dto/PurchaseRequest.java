package com.reservas.core.dto;

import com.reservas.core.entity.Payment;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PurchaseRequest(
        @NotNull Long userId,
        @NotNull Long showtimeId,
        @NotEmpty @Size(max = 10)
        List<@NotNull @Pattern(regexp = "^[A-Z][1-9][0-9]?$", message = "formato de asiento inválido (ej. A1)") String> seatIds,
        @NotNull Payment.Method paymentMethod
) {
}
