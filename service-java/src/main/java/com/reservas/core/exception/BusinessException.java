package com.reservas.core.exception;

/** Violación de una regla de negocio (datos válidos sintácticamente pero inconsistentes). */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
