/** Error de negocio o validación generado por el propio gateway. */
class AppError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Error devuelto por un microservicio; se reenvía al cliente con el mismo status. */
class UpstreamError extends AppError {
  constructor(service, status, message, details = []) {
    super(status, message, details);
    this.service = service;
  }
}

module.exports = { AppError, UpstreamError };
