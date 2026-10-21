const { z } = require('zod');

const id = z.coerce.number().int().positive();
const seatId = z.string().regex(/^[A-Z][1-9][0-9]?$/, 'formato de asiento inválido (ej. A1)');

const idParam = z.object({ id });

const username = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9._-]{3,30}$/, 'de 3 a 30 caracteres: letras, números, punto, guion o guion bajo');

const registerBody = z.object({
  name: z.string().trim().min(1).max(100),
  username,
  email: z.string().trim().email().max(150),
  password: z.string().min(8, 'la contraseña debe tener al menos 8 caracteres').max(72),
});

const loginBody = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const lockBody = z.object({ showtimeId: id, seatId });
const unlockParams = z.object({ showtimeId: id, seatId });

const purchaseBody = z.object({
  showtimeId: id,
  seatIds: z
    .array(seatId)
    .min(1)
    .max(10)
    .refine((ids) => new Set(ids).size === ids.length, 'asientos duplicados'),
  paymentMethod: z.enum(['CARD', 'CASH', 'TRANSFER']),
});

const ticketCodeParam = z.object({ code: z.string().uuid('código de boleto inválido') });

const moviesStatsQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) });
const dailyStatsQuery = z.object({ days: z.coerce.number().int().min(1).max(90).default(7) });

module.exports = {
  idParam,
  registerBody,
  loginBody,
  lockBody,
  unlockParams,
  purchaseBody,
  ticketCodeParam,
  moviesStatsQuery,
  dailyStatsQuery,
};
