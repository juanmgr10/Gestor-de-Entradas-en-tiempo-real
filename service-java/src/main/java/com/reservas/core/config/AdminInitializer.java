package com.reservas.core.config;

import com.reservas.core.entity.User;
import com.reservas.core.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crea o actualiza el administrador definido por variables de entorno.
 * Las variables son la fuente de verdad: si cambia la contraseña en .env, se actualiza al iniciar.
 */
@Component
public class AdminInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String name;
    private final String username;
    private final String email;
    private final String password;

    public AdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                            @Value("${app.admin.name}") String name,
                            @Value("${app.admin.username}") String username,
                            @Value("${app.admin.email}") String email,
                            @Value("${app.admin.password}") String password) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.name = name;
        this.username = username.trim().toLowerCase();
        this.email = email.trim().toLowerCase();
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (username.isBlank() || email.isBlank() || password.isBlank()) {
            log.warn("ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD no definidos: no se crea administrador");
            return;
        }
        User admin = userRepository.findByUsernameIgnoreCase(username)
                .or(() -> userRepository.findByEmailIgnoreCase(email))
                .orElseGet(() -> {
                    User u = new User();
                    u.setName(name);
                    u.setEmail(email);
                    return u;
                });
        admin.setUsername(username);
        admin.setRole(User.Role.ADMIN);
        admin.setEmailVerified(true);
        if (admin.getPasswordHash() == null || !passwordEncoder.matches(password, admin.getPasswordHash())) {
            admin.setPasswordHash(passwordEncoder.encode(password));
        }
        userRepository.save(admin);
        log.info("Administrador disponible: usuario '{}'", username);
    }
}
