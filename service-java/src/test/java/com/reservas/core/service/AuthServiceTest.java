package com.reservas.core.service;

import com.reservas.core.dto.LoginRequest;
import com.reservas.core.dto.RegisterRequest;
import com.reservas.core.dto.UserResponse;
import com.reservas.core.entity.User;
import com.reservas.core.exception.EmailAlreadyRegisteredException;
import com.reservas.core.exception.EmailNotVerifiedException;
import com.reservas.core.exception.InvalidCredentialsException;
import com.reservas.core.exception.UsernameTakenException;
import com.reservas.core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock EmailVerificationService verificationService;

    // Coste bajo para que los tests sean rápidos
    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, encoder, verificationService);
    }

    private User existing(long id, String username, String rawPassword) {
        User u = new User();
        u.setId(id);
        u.setName("Ana");
        u.setUsername(username);
        u.setEmail(username + "@test.com");
        u.setPasswordHash(rawPassword == null ? "!" : encoder.encode(rawPassword));
        u.setEmailVerified(true);
        return u;
    }

    @Test
    void registroNormalizaUsuarioYGuardaHashDeLaContrasena() {
        when(userRepository.findByEmailIgnoreCase("ana@test.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("ana.r")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse user = authService.register(new RegisterRequest("Ana", "Ana.R", "ANA@test.com", "secreta123"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(user.username()).isEqualTo("ana.r");
        assertThat(user.email()).isEqualTo("ana@test.com");
        assertThat(user.role()).isEqualTo(User.Role.USER);
        assertThat(saved.getValue().getPasswordHash()).isNotEqualTo("secreta123");
        assertThat(encoder.matches("secreta123", saved.getValue().getPasswordHash())).isTrue();
        assertThat(user.emailVerified()).isFalse();
        verify(verificationService).issueCode(saved.getValue());
    }

    @Test
    void registroReutilizaCuentaQueNuncaVerificoSuEmail() {
        User pending = existing(7, "ana", "vieja1234");
        pending.setEmailVerified(false);
        when(userRepository.findByEmailIgnoreCase("ana@test.com")).thenReturn(Optional.of(pending));
        when(userRepository.findByUsernameIgnoreCase("ana2")).thenReturn(Optional.empty());
        when(userRepository.save(pending)).thenReturn(pending);

        UserResponse user = authService.register(new RegisterRequest("Ana", "ana2", "ana@test.com", "nueva1234"));

        assertThat(user.id()).isEqualTo(7L);
        assertThat(user.username()).isEqualTo("ana2");
        assertThat(encoder.matches("nueva1234", pending.getPasswordHash())).isTrue();
        verify(verificationService).issueCode(pending);
    }

    @Test
    void registroRechazaUsuarioEnUso() {
        when(userRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("ana")).thenReturn(Optional.of(existing(1, "ana", "x")));

        assertThatThrownBy(() -> authService.register(new RegisterRequest("Ana", "ana", "otra@test.com", "secreta123")))
                .isInstanceOf(UsernameTakenException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void registroRechazaEmailDeCuentaActiva() {
        when(userRepository.findByEmailIgnoreCase("ana@test.com")).thenReturn(Optional.of(existing(1, "ana", "x")));

        assertThatThrownBy(() -> authService.register(new RegisterRequest("Ana", "nueva", "ana@test.com", "secreta123")))
                .isInstanceOf(EmailAlreadyRegisteredException.class);
    }

    @Test
    void registroReclamaCuentaAntiguaSinContrasena() {
        User legacy = existing(5, "ana", null);
        when(userRepository.findByEmailIgnoreCase("ana@test.com")).thenReturn(Optional.of(legacy));
        when(userRepository.findByUsernameIgnoreCase("ana")).thenReturn(Optional.of(legacy));
        when(userRepository.save(legacy)).thenReturn(legacy);

        UserResponse user = authService.register(new RegisterRequest("Ana", "ana", "ana@test.com", "secreta123"));

        assertThat(user.id()).isEqualTo(5L);
        assertThat(encoder.matches("secreta123", legacy.getPasswordHash())).isTrue();
        // Reclamar una cuenta antigua exige demostrar que el email es suyo
        assertThat(legacy.isEmailVerified()).isFalse();
        verify(verificationService).issueCode(legacy);
    }

    @Test
    void loginConCredencialesCorrectas() {
        when(userRepository.findByUsernameIgnoreCase("ana")).thenReturn(Optional.of(existing(1, "ana", "secreta123")));

        assertThat(authService.login(new LoginRequest("ana", "secreta123")).username()).isEqualTo("ana");
    }

    @Test
    void loginRechazaEmailSinVerificar() {
        User pending = existing(1, "ana", "secreta123");
        pending.setEmailVerified(false);
        when(userRepository.findByUsernameIgnoreCase("ana")).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> authService.login(new LoginRequest("ana", "secreta123")))
                .isInstanceOf(EmailNotVerifiedException.class);
    }

    @Test
    void reenvioSoloEmiteCodigoSiFaltaVerificar() {
        User pending = existing(1, "ana", "x");
        pending.setEmailVerified(false);
        when(userRepository.findByUsernameIgnoreCase("ana")).thenReturn(Optional.of(pending));
        when(userRepository.findByUsernameIgnoreCase("luis")).thenReturn(Optional.of(existing(2, "luis", "x")));
        when(userRepository.findByUsernameIgnoreCase("nadie")).thenReturn(Optional.empty());

        authService.resendCode("ana");
        authService.resendCode("luis");
        authService.resendCode("nadie");

        verify(verificationService).issueCode(pending);
        verifyNoMoreInteractions(verificationService);
    }

    @Test
    void loginRechazaContrasenaIncorrectaYUsuarioInexistente() {
        when(userRepository.findByUsernameIgnoreCase("ana")).thenReturn(Optional.of(existing(1, "ana", "secreta123")));
        when(userRepository.findByUsernameIgnoreCase("nadie")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ana", "mala")))
                .isInstanceOf(InvalidCredentialsException.class);
        assertThatThrownBy(() -> authService.login(new LoginRequest("nadie", "secreta123")))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}
