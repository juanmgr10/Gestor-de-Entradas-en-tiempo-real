package com.reservas.core.service;

import com.reservas.core.exception.EmailDeliveryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Envío de correos por SMTP. Sin credenciales (MAIL_USERNAME vacío) no envía nada y
 * escribe el código en el log, para poder probar el sistema sin configurar Gmail.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String username;
    private final String from;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:}") String username,
                        @Value("${app.mail.from:}") String from) {
        this.mailSender = mailSender;
        this.username = username;
        this.from = from.isBlank() ? username : from;
    }

    public void sendVerificationCode(String to, String name, String code, long ttlMinutes) {
        if (username.isBlank()) {
            log.warn("SMTP sin configurar: código de verificación para {} = {}", to, code);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("Tu código de verificación: " + code);
        message.setText("""
                Hola %s:

                Tu código de verificación es: %s

                Vence en %d minutos. Si no creaste una cuenta, ignora este correo.
                """.formatted(name, code, ttlMinutes));
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("No se pudo enviar el correo de verificación a {}", to, ex);
            throw new EmailDeliveryException();
        }
    }
}
