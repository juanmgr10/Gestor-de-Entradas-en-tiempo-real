package com.reservas.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyEmailRequest(
        @NotBlank String username,
        @NotBlank @Pattern(regexp = "^\\d{4}$", message = "debe tener 4 dígitos") String code
) {
}
