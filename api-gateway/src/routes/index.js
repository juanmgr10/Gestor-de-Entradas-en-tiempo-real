const { Router } = require('express');
const { asyncHandler: h } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const { requireAuth, requireRole } = require('../middlewares/auth');
const s = require('../validation/schemas');

/** Rutas públicas bajo /api. */
function createApiRouter(c, tokenService) {
  const router = Router();
  const auth = requireAuth(tokenService);
  const admin = [auth, requireRole('ADMIN')];

  // Autenticación
  router.post('/auth/register', validate(s.registerBody), h(c.auth.register));
  router.post('/auth/login', validate(s.loginBody), h(c.auth.login));
  router.get('/auth/me', auth, h(c.auth.me));

  // Catálogo y mapa de asientos (públicos)
  router.get('/movies', h(c.movies.list));
  router.get('/movies/:id', validate(s.idParam, 'params'), h(c.movies.getById));
  router.get('/movies/:id/showtimes', validate(s.idParam, 'params'), h(c.movies.getShowtimes));
  router.get('/showtimes/:id', validate(s.idParam, 'params'), h(c.showtimes.getById));
  router.get('/showtimes/:id/seats', validate(s.idParam, 'params'), h(c.showtimes.getSeatMap));

  // Reserva y compra (usuario autenticado)
  router.post('/locks', auth, validate(s.lockBody), h(c.locks.lock));
  router.delete('/locks/:showtimeId/:seatId', auth, validate(s.unlockParams, 'params'), h(c.locks.unlock));
  router.post('/purchases', auth, validate(s.purchaseBody), h(c.purchases.create));

  // Perfil
  router.get('/me/purchases', auth, h(c.profile.purchases));

  // Administración
  router.get('/stats/summary', ...admin, h(c.stats.summary));
  router.get('/stats/movies', ...admin, validate(s.moviesStatsQuery, 'query'), h(c.stats.movies));
  router.get('/stats/daily', ...admin, validate(s.dailyStatsQuery, 'query'), h(c.stats.daily));
  router.get('/tickets/:code', ...admin, validate(s.ticketCodeParam, 'params'), h(c.tickets.verify));

  return router;
}

module.exports = { createApiRouter };
