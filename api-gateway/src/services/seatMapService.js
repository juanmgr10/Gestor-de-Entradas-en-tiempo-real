const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Construye el mapa de asientos de una función combinando:
 * vendidos (service-java, fuente de verdad) + bloqueos vigentes (service-go).
 * Prioridad de estado: sold > locked > free.
 */
function createSeatMapService({ catalogService, lockService }) {
  async function buildSeatMap(showtimeId) {
    const [showtime, sold, locks] = await Promise.all([
      catalogService.getShowtime(showtimeId),
      catalogService.getSoldSeats(showtimeId),
      lockService.getLocks(showtimeId),
    ]);

    const soldSet = new Set(sold.seatIds);
    const lockBySeat = new Map(locks.locks.map((l) => [l.seatId, l]));

    const seats = [];
    for (let r = 0; r < showtime.seatRows; r += 1) {
      for (let c = 1; c <= showtime.seatColumns; c += 1) {
        const seatId = `${ROW_LETTERS[r]}${c}`;
        const lock = lockBySeat.get(seatId);
        if (soldSet.has(seatId)) {
          seats.push({ seatId, status: 'sold', lockedBy: null, expiresAt: null });
        } else if (lock) {
          seats.push({ seatId, status: 'locked', lockedBy: lock.userId, expiresAt: lock.expiresAt });
        } else {
          seats.push({ seatId, status: 'free', lockedBy: null, expiresAt: null });
        }
      }
    }

    return { showtime, seats };
  }

  return { buildSeatMap };
}

module.exports = { createSeatMapService };
