const { AppError } = require('../utils/errors');

/** Exige "Authorization: Bearer <jwt>" válido y deja el usuario en req.user. */
const requireAuth = (tokenService) => (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Debes iniciar sesión'));
  }
  try {
    req.user = tokenService.verify(token);
    return next();
  } catch {
    return next(new AppError(401, 'Sesión inválida o expirada'));
  }
};

/** Exige un rol concreto (usar después de requireAuth). */
const requireRole = (role) => (req, res, next) =>
  req.user?.role === role ? next() : next(new AppError(403, 'No tienes permisos para esta sección'));

module.exports = { requireAuth, requireRole };
