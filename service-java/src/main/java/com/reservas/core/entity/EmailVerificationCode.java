package com.reservas.core.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

/** Código de verificación vigente de un usuario. Solo se guarda su hash. */
@Entity
@Table(name = "email_verification_codes")
public class EmailVerificationCode {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "code_hash", nullable = false, length = 100)
    private String codeHash;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "last_sent_at", nullable = false)
    private OffsetDateTime lastSentAt;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCodeHash() {
        return codeHash;
    }

    public void setCodeHash(String codeHash) {
        this.codeHash = codeHash;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public OffsetDateTime getLastSentAt() {
        return lastSentAt;
    }

    public void setLastSentAt(OffsetDateTime lastSentAt) {
        this.lastSentAt = lastSentAt;
    }
}
