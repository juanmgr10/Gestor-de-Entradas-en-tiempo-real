const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSeatMapService } = require('../src/services/seatMapService');

test('arma la grilla completa con prioridad vendido > bloqueado > libre', async () => {
  const service = createSeatMapService({
    catalogService: {
      getShowtime: async () => ({ id: 1, seatRows: 2, seatColumns: 3 }),
      getSoldSeats: async () => ({ seatIds: ['A1', 'B3'] }),
    },
    lockService: {
      getLocks: async () => ({
        locks: [
          { seatId: 'A1', userId: 5, expiresAt: 'x' }, // vendido gana al bloqueo
          { seatId: 'A2', userId: 7, expiresAt: '2026-10-21T18:00:00Z' },
        ],
      }),
    },
  });

  const { seats } = await service.buildSeatMap(1);
  const byId = Object.fromEntries(seats.map((s) => [s.seatId, s]));

  assert.deepEqual(seats.map((s) => s.seatId), ['A1', 'A2', 'A3', 'B1', 'B2', 'B3']);
  assert.equal(byId.A1.status, 'sold');
  assert.deepEqual(byId.A2, { seatId: 'A2', status: 'locked', lockedBy: 7, expiresAt: '2026-10-21T18:00:00Z' });
  assert.equal(byId.A3.status, 'free');
  assert.equal(byId.B3.status, 'sold');
});
