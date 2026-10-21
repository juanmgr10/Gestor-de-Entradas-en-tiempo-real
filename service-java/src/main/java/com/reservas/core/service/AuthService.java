package com.reservas.core.service;

import com.reservas.core.dto.LoginRequest;
import com.reservas.core.dto.RegisterRequest;
import com.reservas.core.dto.UserResponse;
import com.reservas.core.entity.User;
import com.reservas.core.exception.EmailAlreadyRegisteredException;
import com.reservas.core.exception.InvalidCredentialsException;
import com.reservas.core.exception.UsernameTakenException;
import com.reservas.core.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Registro y validación de credenciales (usuario + contraseña). El token de sesión (JWT)
 * lo emite el API Gateway a partir del usuario devuelto aquí.
 */
@Service
public class AuthService {

    /** Marca de la migración V3 para cuentas creadas antes de existir contraseñas. */
    private static final String NO_PASSWORD = "!";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    // Hash ficticio: iguala el tiempo de respuesta cuando el usuario no existe
    private final String dummyHash;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.dummyHash = passwordEncoder.encode("dummy-password");
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String username = request.username().trim().toLowerCase();
        String email = request.email().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);
        // Una cuenta previa sin contraseña se reclama al registrarse (conserva su historial)
        if (user.getId() != null && !NO_PASSWORD.equals(user.getPasswordHash())) {
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
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameIgnoreCase(request.username().trim()).orElse(null);
        String hash = user != null ? user.getPasswordHash() : dummyHash;
        boolean matches = passwordEncoder.matches(request.password(), hash);
        if (user == null || !matches) {
            throw new InvalidCredentialsException();
        }
        return UserResponse.from(user);
    }
}
