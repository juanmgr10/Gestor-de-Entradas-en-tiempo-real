package com.reservas.core.service;

import com.reservas.core.dto.LoginRequest;
import com.reservas.core.dto.RegisterRequest;
import com.reservas.core.dto.UserResponse;
import com.reservas.core.entity.User;
import com.reservas.core.exception.EmailAlreadyRegisteredException;
import com.reservas.core.exception.EmailNotVerifiedException;
import com.reservas.core.exception.InvalidCredentialsException;
import com.reservas.core.exception.InvalidVerificationCodeException;
import com.reservas.core.exception.UsernameTakenException;
import com.reservas.core.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Registro, verificación del email y validación de credenciales (usuario + contraseña).
 * El token de sesión (JWT) lo emite el API Gateway a partir del usuario devuelto aquí,
 * y solo cuando el email está verificado.
 */
@Service
public class AuthService {

    /** Marca de la migración V3 para cuentas creadas antes de existir contraseñas. */
    private static final String NO_PASSWORD = "!";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService verificationService;
    // Hash ficticio: iguala el tiempo de respuesta cuando el usuario no existe
    private final String dummyHash;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       EmailVerificationService verificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.verificationService = verificationService;
        this.dummyHash = passwordEncoder.encode("dummy-password");
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String username = request.username().trim().toLowerCase();
        String email = request.email().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);
        // Se puede reutilizar una cuenta previa sin contraseña (conserva su historial) o una
        // que nunca verificó su email; en ambos casos hay que demostrar que el email es suyo
        boolean reusable = NO_PASSWORD.equals(user.getPasswordHash()) || !user.isEmailVerified();
        if (user.getId() != null && !reusable) {
            throw new EmailAlreadyRegisteredException(email);
        }
        userRepository.findByUsernameIgnoreCase(username)
                .filter(other -> !other.getId().equals(user.getId()))
                .ifPresent(other -> {
                    throw new UsernameTakenException(username);
                });

        user.setName(request.name().trim());
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEmailVerified(false);
        User saved = userRepository.save(user);
        verificationService.issueCode(saved);
        return UserResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameIgnoreCase(request.username().trim()).orElse(null);
        String hash = user != null ? user.getPasswordHash() : dummyHash;
        boolean matches = passwordEncoder.matches(request.password(), hash);
        if (user == null || !matches) {
            throw new InvalidCredentialsException();
        }
        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException();
        }
        return UserResponse.from(user);
    }

    // El intento fallido debe quedar guardado aunque se responda con error
    @Transactional(noRollbackFor = InvalidVerificationCodeException.class)
    public UserResponse verifyEmail(String username, String code) {
        User user = userRepository.findByUsernameIgnoreCase(username.trim())
                .orElseThrow(() -> new InvalidVerificationCodeException("No hay un código vigente, pide uno nuevo"));
        if (!user.isEmailVerified()) {
            verificationService.verify(user, code);
        }
        return UserResponse.from(user);
    }

    /** No revela si el usuario existe: si no existe o ya está verificado, no hace nada. */
    @Transactional
    public void resendCode(String username) {
        userRepository.findByUsernameIgnoreCase(username.trim())
                .filter(user -> !user.isEmailVerified())
                .ifPresent(verificationService::issueCode);
    }
}
