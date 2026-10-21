const jwt = require('jsonwebtoken');

/** Emite y valida los JWT de sesión (HS256). */
function createTokenService({ secret, expiresIn }) {
  return {
    sign(user) {
      return jwt.sign({ name: user.name, username: user.username, email: user.email, role: user.role }, secret, {
        subject: String(user.id),
        expiresIn,
        algorithm: 'HS256',
      });
    },
    /** Devuelve { id, name, username, email, role } o lanza si el token es inválido o expiró. */
    verify(token) {
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
      return {
        id: Number(payload.sub),
        name: payload.name,
        username: payload.username,
        email: payload.email,
        role: payload.role,
      };
    },
  };
}

module.exports = { createTokenService };
