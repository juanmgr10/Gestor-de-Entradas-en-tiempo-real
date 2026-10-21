// El usuario siempre sale del token, nunca del cuerpo de la petición
function createLockController({ lockService }) {
  return {
    async lock(req, res) {
      const { lock, created } = await lockService.lockSeat({ ...req.body, userId: req.user.id });
      res.status(created ? 201 : 200).json(lock);
    },
    async unlock(req, res) {
      await lockService.unlockSeat(req.params.showtimeId, req.params.seatId, req.user.id);
      res.status(204).end();
    },
  };
}

module.exports = { createLockController };
