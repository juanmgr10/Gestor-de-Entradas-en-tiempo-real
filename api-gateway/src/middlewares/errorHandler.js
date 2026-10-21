const { AppError, UpstreamError } = require('../utils/errors');

const notFound = (req, res) => {
  res.status(404).json({ status: 404, message: 'Ruta no encontrada', details: [] });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    if (err instanceof UpstreamError && err.status >= 500) {
      console.error(`[upstream] ${err.service}: ${err.status} ${err.message}`);
    }
    return res.status(err.status).json({ status: err.status, message: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 400, message: 'Cuerpo de la petición mal formado', details: [] });
  }
  console.error('[error] No controlado:', err);
  return res.status(500).json({ status: 500, message: 'Error interno del servidor', details: [] });
};

module.exports = { notFound, errorHandler };
