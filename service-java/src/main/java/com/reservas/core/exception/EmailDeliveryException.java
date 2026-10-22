package com.reservas.core.exception;

public class EmailDeliveryException extends RuntimeException {

    public EmailDeliveryException() {
        super("No se pudo enviar el correo de verificación, inténtalo más tarde");
    }
}
