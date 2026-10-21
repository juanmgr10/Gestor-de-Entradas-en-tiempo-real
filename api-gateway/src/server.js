const http = require('http');
const { loadConfig } = require('./config/env');
const { createClient } = require('./services/httpClient');
const { createCatalogService } = require('./services/catalogService');
const { createLockService } = require('./services/lockService');
const { createAnalyticsService } = require('./services/analyticsService');
const { createSeatMapService } = require('./services/seatMapService');
const { createPurchaseOrchestrator } = require('./services/purchaseOrchestrator');
const { createMovieController } = require('./controllers/movieController');
const { createShowtimeController } = require('./controllers/showtimeController');
const { createUserController } = require('./controllers/userController');
const { createLockController } = require('./controllers/lockController');
const { createPurchaseController } = require('./controllers/purchaseController');
const { createStatsController } = require('./controllers/statsController');
const { initSocket } = require('./realtime/socketServer');
const { startSubscriber } = require('./realtime/redisSubscriber');
const { createApp } = require('./app');

const config = loadConfig();

// Composición de capas: clientes HTTP -> servicios -> controladores
const catalogService = createCatalogService(createClient('service-java', config.services.java, config.httpTimeoutMs));
const lockService = createLockService(createClient('service-go', config.services.go, config.httpTimeoutMs));
const analyticsService = createAnalyticsService(
  createClient('service-python', config.services.python, config.httpTimeoutMs),
);
const seatMapService = createSeatMapService({ catalogService, lockService });
const purchaseOrchestrator = createPurchaseOrchestrator({ catalogService, lockService });

const controllers = {
  movies: createMovieController({ catalogService }),
  showtimes: createShowtimeController({ catalogService, seatMapService }),
  users: createUserController({ catalogService }),
  locks: createLockController({ lockService }),
  purchases: createPurchaseController({ purchaseOrchestrator }),
  stats: createStatsController({ analyticsService }),
};

let subscriber;
const app = createApp({ controllers, corsOrigin: config.corsOrigin, isReady: () => subscriber?.isReady() ?? false });
const server = http.createServer(app);
const io = initSocket(server, config.corsOrigin);
subscriber = startSubscriber({ redisUrl: config.redisUrl, io, analyticsService });

server.listen(config.port, () => {
  console.log(`[gateway] Escuchando en :${config.port} (CORS: ${config.corsOrigin.join(', ')})`);
});

// Apagado ordenado: WebSockets -> Redis -> HTTP
async function shutdown(signal) {
  console.log(`[gateway] ${signal} recibido, cerrando...`);
  io.close();
  await subscriber.close().catch(() => {});
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
