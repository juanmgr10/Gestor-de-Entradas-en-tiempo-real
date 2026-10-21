/** Cliente del motor de analíticas (service-python). */
function createAnalyticsService(http) {
  return {
    recordPurchase: async (event) => (await http.post('/events/purchase-confirmed', event)).data,
    getSummary: async () => (await http.get('/stats/summary')).data,
    getTopMovies: async (limit) => (await http.get('/stats/movies', { params: { limit } })).data,
    getDaily: async (days) => (await http.get('/stats/daily', { params: { days } })).data,
  };
}

module.exports = { createAnalyticsService };
