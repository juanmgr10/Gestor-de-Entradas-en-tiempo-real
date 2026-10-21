/** Cliente del motor de concurrencia (service-go). */
function createLockService(http) {
  return {
    /** Retorna { lock, created }: created=false si el usuario ya tenía el bloqueo. */
    async lockSeat({ showtimeId, seatId, userId }) {
      const res = await http.post('/locks', { showtimeId, seatId, userId });
      return { lock: res.data, created: res.status === 201 };
    },
    async unlockSeat(showtimeId, seatId, userId) {
      await http.delete(`/locks/${showtimeId}/${seatId}`, { params: { userId } });
    },
    getLocks: async (showtimeId) => (await http.get(`/locks/${showtimeId}`)).data,
    async verifyLocks({ showtimeId, userId, seatIds }) {
      await http.post('/locks/verify', { showtimeId, userId, seatIds });
    },
    async markSold(purchase) {
      await http.post('/seats/sold', purchase);
    },
  };
}

module.exports = { createLockService };
