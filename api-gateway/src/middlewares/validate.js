const { AppError } = require('../utils/errors');

/** Valida req[source] con un esquema zod y lo reemplaza por los datos ya convertidos. */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => `${i.path.join('.') || source}: ${i.message}`);
    return next(new AppError(400, 'Datos de entrada inválidos', details));
  }
  req[source] = result.data;
  return next();
};

module.exports = { validate };
