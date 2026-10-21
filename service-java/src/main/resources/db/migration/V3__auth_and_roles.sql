-- Autenticación: contraseña (hash BCrypt) y rol por usuario

ALTER TABLE users ADD COLUMN password_hash VARCHAR(100);
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Usuarios previos sin contraseña quedan sin poder iniciar sesión ('!' nunca coincide con un hash)
UPDATE users SET password_hash = '!' WHERE password_hash IS NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN'));

-- Consultas del historial de compras por usuario
CREATE INDEX idx_tickets_user ON tickets (user_id);
CREATE INDEX idx_payments_user ON payments (user_id);
