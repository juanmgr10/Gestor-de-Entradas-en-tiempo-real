const { Router } = require('express');
const { asyncHandler: h } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');
const s = require('../validation/schemas');

/** Rutas públicas bajo /api. */
function createApiRouter(c) {
  const router = Router();

  // Catálogo (service-java)
  router.get('/movies', h(c.movies.list));
  router.get('/movies/:id', validate(s.idParam, 'params'), h(c.movies.getById));
  router.get('/movies/:id/showtimes', validate(s.idParam, 'params'), h(c.movies.getShowtimes));
  router.get('/showtimes/:id', validate(s.idParam, 'params'), h(c.showtimes.getById));
  router.post('/users', validate(s.userBody), h(c.users.register));

  // Mapa de asientos (service-java + service-go)
  router.get('/showtimes/:id/seats', validate(s.idParam, 'params'), h(c.showtimes.getSeatMap));

  // Bloqueos (service-go)
  router.post('/locks', validate(s.lockBody), h(c.locks.lock));
  router.delete(
    '/locks/:showtimeId/:seatId',
    validate(s.unlockParams, 'params'),
    validate(s.unlockQuery, 'query'),
    h(c.locks.unlock),
  );

  // Compra orquestada (go -> java -> go)
  router.post('/purchases', validate(s.purchaseBody), h(c.purchases.create));

  // Analíticas (service-python)
  router.get('/stats/summary', h(c.stats.summary));
  router.get('/stats/movies', validate(s.moviesStatsQuery, 'query'), h(c.stats.movies));
  router.get('/stats/daily', validate(s.dailyStatsQuery, 'query'), h(c.stats.daily));

  return router;
}

module.exports = { createApiRouter };
