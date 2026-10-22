package com.reservas.core.service;

import com.reservas.core.entity.EmailVerificationCode;
import com.reservas.core.entity.User;
import com.reservas.core.exception.InvalidVerificationCodeException;
import com.reservas.core.exception.VerificationThrottledException;
import com.reservas.core.repository.EmailVerificationCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;

/**
 * Códigos de 4 dígitos para verificar el email. Cada usuario tiene un único código vigente:
 * vence a los pocos minutos, admite un número limitado de intentos y no se puede
 * reenviar hasta que pase un tiempo mínimo.
 */
@Service
public class EmailVerificationService {

    private final EmailVerificationCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final Clock clock;
    private final Duration ttl;
    private final int maxAttempts;
    private final Duration resendCooldown;
    private final SecureRandom random = new SecureRandom();

    @Autowired
    public EmailVerificationService(EmailVerificationCodeRepository codeRepository,
                                    PasswordEncoder passwordEncoder,
                                    EmailService emailService,
                                    @Value("${app.verification.ttl-minutes:10}") long ttlMinutes,
                                    @Value("${app.verification.max-attempts:5}") int maxAttempts,
                                    @Value("${app.verification.resend-cooldown-seconds:60}") long cooldownSeconds) {
        this(codeRepository, passwordEncoder, emailService, Clock.systemUTC(),
                Duration.ofMinutes(ttlMinutes), maxAttempts, Duration.ofSeconds(cooldownSeconds));
    }

    EmailVerificationService(EmailVerificationCodeRepository codeRepository, PasswordEncoder passwordEncoder,
                             EmailService emailService, Clock clock, Duration ttl, int maxAttempts,
                             Duration resendCooldown) {
        this.codeRepository = codeRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.clock = clock;
        this.ttl = ttl;
        this.maxAttempts = maxAttempts;
        this.resendCooldown = resendCooldown;
    }

    /** Genera un código nuevo (reemplaza al anterior) y lo envía al email del usuario. */
    public void issueCode(User user) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        EmailVerificationCode entry = codeRepository.findById(user.getId()).orElseGet(EmailVerificationCode::new);
        if (entry.getLastSentAt() != null && now.isBefore(entry.getLastSentAt().plus(resendCooldown))) {
            long wait = Duration.between(now, entry.getLastSentAt().plus(resendCooldown)).toSeconds() + 1;
            throw new VerificationThrottledException("Espera " + wait + " segundos para pedir otro código");
        }
        String code = "%04d".formatted(random.nextInt(10_000));
        entry.setUserId(user.getId());
        entry.setCodeHash(passwordEncoder.encode(code));
        entry.setExpiresAt(now.plus(ttl));
        entry.setAttempts(0);
        entry.setLastSentAt(now);
        codeRepository.save(entry);
        emailService.sendVerificationCode(user.getEmail(), user.getName(), code, ttl.toMinutes());
    }

    /**
     * Valida el código y marca el email como verificado. Un intento fallido queda registrado,
     * por eso quien llame no debe revertir la transacción ante {@link InvalidVerificationCodeException}.
     */
    public void verify(User user, String code) {
        EmailVerificationCode entry = codeRepository.findById(user.getId())
                .orElseThrow(() -> new InvalidVerificationCodeException("No hay un código vigente, pide uno nuevo"));
        if (OffsetDateTime.now(clock).isAfter(entry.getExpiresAt())) {
            throw new InvalidVerificationCodeException("El código venció, pide uno nuevo");
        }
        if (entry.getAttempts() >= maxAttempts) {
            throw new VerificationThrottledException("Demasiados intentos, pide un código nuevo");
        }
        if (!passwordEncoder.matches(code, entry.getCodeHash())) {
            entry.setAttempts(entry.getAttempts() + 1);
            codeRepository.save(entry);
            int left = maxAttempts - entry.getAttempts();
            throw new InvalidVerificationCodeException(left > 0
                    ? "Código incorrecto. Te quedan " + left + (left == 1 ? " intento" : " intentos")
                    : "Código incorrecto. Pide un código nuevo");
        }
        user.setEmailVerified(true);
        codeRepository.delete(entry);
    }
}
