package com.reservas.core.exception;

public class EmailNotVerifiedException extends RuntimeException {

    public EmailNotVerifiedException() {
        super("Debes verificar tu correo antes de iniciar sesión");
    }
}
