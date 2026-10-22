-- Verificación del email con un código de 4 dígitos

ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Las cuentas existentes quedan verificadas; solo los registros nuevos pasan por el código
UPDATE users SET email_verified = TRUE;

-- Un único código vigente por usuario (se guarda su hash, nunca el código)
CREATE TABLE email_verification_codes (
    user_id      BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    code_hash    VARCHAR(100) NOT NULL,
    expires_at   TIMESTAMPTZ  NOT NULL,
    attempts     INT          NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMPTZ  NOT NULL
);
