/** Cliente del core transaccional (service-java). */
function createCatalogService(http) {
  return {
    getMovies: async () => (await http.get('/movies')).data,
    getMovie: async (id) => (await http.get(`/movies/${id}`)).data,
    getShowtimes: async (movieId) => (await http.get(`/movies/${movieId}/showtimes`)).data,
    getShowtime: async (id) => (await http.get(`/showtimes/${id}`)).data,
    getSoldSeats: async (showtimeId) => (await http.get(`/showtimes/${showtimeId}/sold-seats`)).data,

    register: async ({ name, username, email, password }) =>
      (await http.post('/auth/register', { name, username, email, password })).data,
    login: async ({ username, password }) => (await http.post('/auth/login', { username, password })).data,
    getUser: async (id) => (await http.get(`/users/${id}`)).data,
    getUserPurchases: async (id) => (await http.get(`/users/${id}/purchases`)).data,
    getTicket: async (code) => (await http.get(`/tickets/${encodeURIComponent(code)}`)).data,

    purchase: async ({ userId, showtimeId, seatIds, paymentMethod }) =>
      (await http.post('/purchases', { userId, showtimeId, seatIds, paymentMethod })).data,
  };
}

module.exports = { createCatalogService };
