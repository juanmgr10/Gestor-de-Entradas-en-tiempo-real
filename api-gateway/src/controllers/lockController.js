function createLockController({ lockService }) {
  return {
    async lock(req, res) {
      const { lock, created } = await lockService.lockSeat(req.body);
      res.status(created ? 201 : 200).json(lock);
    },
    async unlock(req, res) {
      await lockService.unlockSeat(req.params.showtimeId, req.params.seatId, req.query.userId);
      res.status(204).end();
    },
  };
}

module.exports = { createLockController };
