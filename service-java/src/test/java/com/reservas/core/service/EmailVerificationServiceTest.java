package com.reservas.core.service;

import com.reservas.core.entity.EmailVerificationCode;
import com.reservas.core.entity.User;
import com.reservas.core.exception.InvalidVerificationCodeException;
import com.reservas.core.exception.VerificationThrottledException;
import com.reservas.core.repository.EmailVerificationCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-22T12:00:00Z");

    @Mock EmailVerificationCodeRepository codeRepository;
    @Mock EmailService emailService;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private EmailVerificationService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new EmailVerificationService(codeRepository, encoder, emailService,
                Clock.fixed(NOW, ZoneOffset.UTC), Duration.ofMinutes(10), 5, Duration.ofSeconds(60));
        user = new User();
        user.setId(1L);
        user.setName("Ana");
        user.setEmail("ana@test.com");
    }

    private EmailVerificationCode code(String raw, int attempts, OffsetDateTime expiresAt, OffsetDateTime sentAt) {
        EmailVerificationCode c = new EmailVerificationCode();
        c.setUserId(1L);
        c.setCodeHash(encoder.encode(raw));
        c.setAttempts(attempts);
        c.setExpiresAt(expiresAt);
        c.setLastSentAt(sentAt);
        return c;
    }

    private OffsetDateTime now() {
        return OffsetDateTime.ofInstant(NOW, ZoneOffset.UTC);
    }

    @Test
    void emiteCodigoDeCuatroDigitosYGuardaSoloSuHash() {
        when(codeRepository.findById(1L)).thenReturn(Optional.empty());

        service.issueCode(user);

        ArgumentCaptor<String> sent = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendVerificationCode(eq("ana@test.com"), eq("Ana"), sent.capture(), eq(10L));
        ArgumentCaptor<EmailVerificationCode> saved = ArgumentCaptor.forClass(EmailVerificationCode.class);
        verify(codeRepository).save(saved.capture());
        assertThat(sent.getValue()).matches("\\d{4}");
        assertThat(saved.getValue().getCodeHash()).isNotEqualTo(sent.getValue());
        assertThat(encoder.matches(sent.getValue(), saved.getValue().getCodeHash())).isTrue();
        assertThat(saved.getValue().getExpiresAt()).isEqualTo(now().plusMinutes(10));
        assertThat(saved.getValue().getAttempts()).isZero();
    }

    @Test
    void rechazaReenvioAntesDeLaEspera() {
        when(codeRepository.findById(1L))
                .thenReturn(Optional.of(code("1234", 0, now().plusMinutes(9), now().minusSeconds(30))));

        assertThatThrownBy(() -> service.issueCode(user)).isInstanceOf(VerificationThrottledException.class);
        verifyNoInteractions(emailService);
    }

    @Test
    void codigoCorrectoVerificaElEmailYBorraElCodigo() {
        EmailVerificationCode entry = code("1234", 0, now().plusMinutes(5), now());
        when(codeRepository.findById(1L)).thenReturn(Optional.of(entry));

        service.verify(user, "1234");

        assertThat(user.isEmailVerified()).isTrue();
        verify(codeRepository).delete(entry);
    }

    @Test
    void codigoIncorrectoSumaUnIntento() {
        EmailVerificationCode entry = code("1234", 0, now().plusMinutes(5), now());
        when(codeRepository.findById(1L)).thenReturn(Optional.of(entry));

        assertThatThrownBy(() -> service.verify(user, "9999"))
                .isInstanceOf(InvalidVerificationCodeException.class)
                .hasMessageContaining("4 intentos");
        assertThat(entry.getAttempts()).isEqualTo(1);
        assertThat(user.isEmailVerified()).isFalse();
        verify(codeRepository).save(entry);
    }

    @Test
    void codigoVencidoSeRechaza() {
        when(codeRepository.findById(1L))
                .thenReturn(Optional.of(code("1234", 0, now().minusSeconds(1), now().minusMinutes(11))));

        assertThatThrownBy(() -> service.verify(user, "1234"))
                .isInstanceOf(InvalidVerificationCodeException.class)
                .hasMessageContaining("venció");
        assertThat(user.isEmailVerified()).isFalse();
    }

    @Test
    void agotarLosIntentosBloqueaAunConElCodigoCorrecto() {
        when(codeRepository.findById(1L)).thenReturn(Optional.of(code("1234", 5, now().plusMinutes(5), now())));

        assertThatThrownBy(() -> service.verify(user, "1234")).isInstanceOf(VerificationThrottledException.class);
        assertThat(user.isEmailVerified()).isFalse();
    }
}
