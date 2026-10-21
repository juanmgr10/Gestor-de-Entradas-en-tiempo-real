package com.reservas.core.exception;

public class EmailAlreadyRegisteredException extends RuntimeException {

    public EmailAlreadyRegisteredException(String email) {
        super("Ya existe una cuenta con el email " + email);
    }
}
