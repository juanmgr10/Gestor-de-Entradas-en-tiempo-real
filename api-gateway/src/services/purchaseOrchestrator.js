const { withRetry } = require('../utils/retry');

/**
 * Orquesta la compra entre servicios:
 * 1. Go verifica que el usuario aún posee los bloqueos.
 * 2. Java cobra y emite los boletos (transacción).
 * 3. Go marca los asientos como vendidos y publica seat.sold + purchase.confirmed.
 */
function createPurchaseOrchestrator({ catalogService, lockService }) {
  async function checkout({ userId, showtimeId, seatIds, paymentMethod }) {
    await lockService.verifyLocks({ showtimeId, userId, seatIds });

    const purchase = await catalogService.purchase({ userId, showtimeId, seatIds, paymentMethod });

    try {
      await withRetry(() => lockService.markSold(purchase), { label: 'markSold' });
    } catch (err) {
      // La venta ya es válida en Java; solo se pierde la notificación en vivo
      console.error(`[checkout] Venta ${purchase.paymentId} confirmada pero no marcada en Redis: ${err.message}`);
    }

    return purchase;
  }

  return { checkout };
}

module.exports = { createPurchaseOrchestrator };
