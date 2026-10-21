const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ejecuta fn con reintentos y backoff lineal. Solo para operaciones idempotentes.
 * Lanza el último error si se agotan los intentos.
 */
async function withRetry(fn, { attempts = 3, baseDelayMs = 200, label = 'operación' } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`[retry] ${label} falló (intento ${attempt}/${attempts}): ${err.message}`);
      if (attempt < attempts) await sleep(baseDelayMs * attempt);
    }
  }
  throw lastError;
}

module.exports = { withRetry };
