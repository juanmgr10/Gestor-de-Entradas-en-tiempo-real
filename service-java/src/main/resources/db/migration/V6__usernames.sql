-- Inicio de sesión por nombre de usuario

ALTER TABLE users ADD COLUMN username VARCHAR(30);

-- Usuarios existentes: la parte local de su email, limpia y en minúsculas
UPDATE users
SET username = left(lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9._-]', '', 'g')), 24);

-- Si queda muy corto o repetido, se le agrega el id para hacerlo único
UPDATE users u
SET username = u.username || u.id
WHERE length(u.username) < 3
   OR EXISTS (SELECT 1 FROM users o WHERE o.username = u.username AND o.id < u.id);

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT chk_users_username CHECK (username ~ '^[a-z0-9._-]{3,30}$');
CREATE UNIQUE INDEX uq_users_username ON users (username);
