const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPurchaseOrchestrator } = require('../src/services/purchaseOrchestrator');
const { UpstreamError } = require('../src/utils/errors');

const order = { userId: 7, showtimeId: 1, seatIds: ['A1'], paymentMethod: 'CARD' };
const purchase = { paymentId: 99, tickets: [{ seatId: 'A1' }] };

test('si el usuario ya no tiene los bloqueos, no cobra en Java', async () => {
  let charged = false;
  const orchestrator = createPurchaseOrchestrator({
    lockService: { verifyLocks: async () => { throw new UpstreamError('service-go', 409, 'faltan asientos', ['A1']); } },
    catalogService: { purchase: async () => { charged = true; } },
  });

  await assert.rejects(orchestrator.checkout(order), { status: 409 });
  assert.equal(charged, false);
});

test('compra completa: verifica, cobra y marca vendido', async () => {
  const calls = [];
  const orchestrator = createPurchaseOrchestrator({
    lockService: {
      verifyLocks: async () => calls.push('verify'),
      markSold: async (p) => calls.push(`sold:${p.paymentId}`),
    },
    catalogService: { purchase: async () => (calls.push('purchase'), purchase) },
  });

  assert.deepEqual(await orchestrator.checkout(order), purchase);
  assert.deepEqual(calls, ['verify', 'purchase', 'sold:99']);
});

test('markSold se reintenta y su fallo final no anula una venta ya cobrada', async () => {
  let attempts = 0;
  const orchestrator = createPurchaseOrchestrator({
    lockService: {
      verifyLocks: async () => {},
      markSold: async () => { attempts += 1; throw new Error('redis caído'); },
    },
    catalogService: { purchase: async () => purchase },
  });

  assert.deepEqual(await orchestrator.checkout(order), purchase);
  assert.equal(attempts, 3);
});
