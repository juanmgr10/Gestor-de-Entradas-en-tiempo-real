const REQUIRED = ['JAVA_SERVICE_URL', 'GO_SERVICE_URL', 'PYTHON_SERVICE_URL', 'REDIS_URL', 'JWT_SECRET'];

/** Lee y valida la configuración; detiene el proceso si falta algo obligatorio. */
function loadConfig(env = process.env) {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    console.error(`[config] Faltan variables de entorno: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (env.JWT_SECRET.length < 32) {
    console.error('[config] JWT_SECRET debe tener al menos 32 caracteres');
    process.exit(1);
  }

  return {
    port: Number(env.PORT || 4000),
    corsOrigin: (env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim()),
    httpTimeoutMs: Number(env.HTTP_TIMEOUT_MS || 5000),
    services: {
      java: env.JAVA_SERVICE_URL,
      go: env.GO_SERVICE_URL,
      python: env.PYTHON_SERVICE_URL,
    },
    redisUrl: env.REDIS_URL,
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN || '8h',
    },
  };
}

module.exports = { loadConfig };
