const Redis = require('ioredis');
const { roomFor } = require('./socketServer');
const { withRetry } = require('../utils/retry');

// Canal Redis -> evento WebSocket emitido a la sala de la función
const SEAT_EVENTS = {
  'seat.locked': 'seat:locked',
  'seat.released': 'seat:released',
  'seat.sold': 'seat:sold',
};
const PURCHASE_CONFIRMED = 'purchase.confirmed';

/**
 * Suscriptor Redis Pub/Sub (conexión dedicada, solo lectura de eventos):
 * - eventos de asientos -> WebSocket a los clientes de la función
 * - purchase.confirmed  -> HTTP a service-python (idempotente)
 */
function startSubscriber({ redisUrl, io, analyticsService }) {
  const client = new Redis(redisUrl, { maxRetriesPerRequest: null });

  function handleMessage(channel, raw) {
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      console.warn(`[redis] Mensaje inválido en ${channel}: ${raw}`);
      return;
    }

    const wsEvent = SEAT_EVENTS[channel];
    if (wsEvent) {
      io.to(roomFor(payload.showtimeId)).emit(wsEvent, payload);
      return;
    }
    if (channel === PURCHASE_CONFIRMED) {
      withRetry(() => analyticsService.recordPurchase(payload), { label: 'recordPurchase' }).catch((err) =>
        console.error(`[redis] No se pudo registrar la compra ${payload.paymentId} en analíticas: ${err.message}`),
      );
    }
  }

  client.on('message', handleMessage);
  client.on('ready', () => console.log('[redis] Suscriptor conectado'));
  client.on('error', (err) => console.error(`[redis] ${err.message}`));

  client.subscribe(...Object.keys(SEAT_EVENTS), PURCHASE_CONFIRMED).catch((err) => {
    console.error(`[redis] Error al suscribirse: ${err.message}`);
  });

  return {
    isReady: () => client.status === 'ready',
    close: () => client.quit(),
  };
}

module.exports = { startSubscriber };
