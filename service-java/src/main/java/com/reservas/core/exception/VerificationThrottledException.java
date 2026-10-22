package com.reservas.core.exception;

public class VerificationThrottledException extends RuntimeException {

    public VerificationThrottledException(String message) {
        super(message);
    }
}
