const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createApiRouter } = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

/** Construye la app Express a partir de los controladores ya inyectados. */
function createApp({ controllers, corsOrigin, isReady }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '100kb' }));
  app.use(morgan('tiny', { skip: (req) => req.path === '/health' }));

  app.get('/health', (req, res) => {
    const up = isReady();
    res.status(up ? 200 : 503).json({ status: up ? 'UP' : 'DOWN', redis: up ? 'connected' : 'disconnected' });
  });

  app.use('/api', createApiRouter(controllers));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
