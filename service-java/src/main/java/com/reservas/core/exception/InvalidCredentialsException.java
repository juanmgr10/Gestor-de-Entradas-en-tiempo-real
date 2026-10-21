package com.reservas.core.exception;

public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Usuario o contraseña incorrectos");
    }
}
