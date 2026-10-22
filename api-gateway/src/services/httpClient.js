const axios = require('axios');
const { UpstreamError } = require('../utils/errors');

/**
 * Cliente HTTP hacia un microservicio. Normaliza los errores a UpstreamError
 * con el formato común {status, message, details}.
 */
function createClient(serviceName, baseURL, timeout) {
  const client = axios.create({ baseURL, timeout });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const { status, data } = error.response;
        const message = data?.message || `Error en ${serviceName}`;
        const details = Array.isArray(data?.details) ? data.details : [];
        return Promise.reject(new UpstreamError(serviceName, status, message, details));
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return Promise.reject(new UpstreamError(serviceName, 504, 'El servidor tardó demasiado en responder. Inténtalo de nuevo'));
      }
      return Promise.reject(new UpstreamError(serviceName, 502, 'El servicio no está disponible en este momento. Inténtalo más tarde'));
    },
  );

  return client;
}

module.exports = { createClient };
