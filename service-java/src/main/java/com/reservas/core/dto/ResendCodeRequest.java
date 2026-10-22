package com.reservas.core.dto;

import jakarta.validation.constraints.NotBlank;

public record ResendCodeRequest(@NotBlank String username) {
}
