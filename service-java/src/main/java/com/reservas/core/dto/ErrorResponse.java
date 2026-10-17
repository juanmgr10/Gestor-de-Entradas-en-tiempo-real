package com.reservas.core.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record ErrorResponse(int status, String error, String message, List<String> details, OffsetDateTime timestamp) {

    public static ErrorResponse of(int status, String error, String message, List<String> details) {
        return new ErrorResponse(status, error, message, details, OffsetDateTime.now());
    }
}
