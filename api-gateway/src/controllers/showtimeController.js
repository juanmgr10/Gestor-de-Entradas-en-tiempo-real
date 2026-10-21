function createShowtimeController({ catalogService, seatMapService }) {
  return {
    getById: async (req, res) => res.json(await catalogService.getShowtime(req.params.id)),
    getSeatMap: async (req, res) => res.json(await seatMapService.buildSeatMap(req.params.id)),
  };
}

module.exports = { createShowtimeController };
