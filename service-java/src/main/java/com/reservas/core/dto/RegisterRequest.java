package com.reservas.core.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank
        @Pattern(regexp = "^[a-zA-Z0-9._-]{3,30}$",
                message = "de 3 a 30 caracteres: letras, números, punto, guion o guion bajo")
        String username,
        @NotBlank @Email @Size(max = 150) String email,
        // BCrypt solo considera los primeros 72 bytes
        @NotBlank @Size(min = 8, max = 72) String password
) {
}
