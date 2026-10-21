/** Cliente del core transaccional (service-java). */
function createCatalogService(http) {
  return {
    getMovies: async () => (await http.get('/movies')).data,
    getMovie: async (id) => (await http.get(`/movies/${id}`)).data,
    getShowtimes: async (movieId) => (await http.get(`/movies/${movieId}/showtimes`)).data,
    getShowtime: async (id) => (await http.get(`/showtimes/${id}`)).data,
    getSoldSeats: async (showtimeId) => (await http.get(`/showtimes/${showtimeId}/sold-seats`)).data,
    registerUser: async ({ name, email }) => (await http.post('/users', { name, email })).data,
    purchase: async ({ userId, showtimeId, seatIds, paymentMethod }) =>
      (await http.post('/purchases', { userId, showtimeId, seatIds, paymentMethod })).data,
  };
}

module.exports = { createCatalogService };
