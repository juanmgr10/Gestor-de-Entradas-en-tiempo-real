package com.reservas.core.exception;

public class UsernameTakenException extends RuntimeException {

    public UsernameTakenException(String username) {
        super("El nombre de usuario " + username + " ya está en uso");
    }
}
