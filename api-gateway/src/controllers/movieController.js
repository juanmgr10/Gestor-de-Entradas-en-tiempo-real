function createMovieController({ catalogService }) {
  return {
    list: async (req, res) => res.json(await catalogService.getMovies()),
    getById: async (req, res) => res.json(await catalogService.getMovie(req.params.id)),
    getShowtimes: async (req, res) => res.json(await catalogService.getShowtimes(req.params.id)),
  };
}

module.exports = { createMovieController };
