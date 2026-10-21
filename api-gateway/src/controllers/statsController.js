function createStatsController({ analyticsService }) {
  return {
    summary: async (req, res) => res.json(await analyticsService.getSummary()),
    movies: async (req, res) => res.json(await analyticsService.getTopMovies(req.query.limit)),
    daily: async (req, res) => res.json(await analyticsService.getDaily(req.query.days)),
  };
}

module.exports = { createStatsController };
