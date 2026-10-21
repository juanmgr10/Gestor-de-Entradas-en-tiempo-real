const { z } = require('zod');

const id = z.coerce.number().int().positive();
const seatId = z.string().regex(/^[A-Z][1-9][0-9]?$/, 'formato de asiento inválido (ej. A1)');

const idParam = z.object({ id });

const lockBody = z.object({
  showtimeId: id,
  seatId,
  userId: id,
});

const unlockParams = z.object({ showtimeId: id, seatId });
const unlockQuery = z.object({ userId: id });

const userBody = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(150),
});

const purchaseBody = z.object({
  userId: id,
  showtimeId: id,
  seatIds: z
    .array(seatId)
    .min(1)
    .max(10)
    .refine((ids) => new Set(ids).size === ids.length, 'asientos duplicados'),
  paymentMethod: z.enum(['CARD', 'CASH', 'TRANSFER']),
});

const moviesStatsQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) });
const dailyStatsQuery = z.object({ days: z.coerce.number().int().min(1).max(90).default(7) });

module.exports = {
  idParam,
  lockBody,
  unlockParams,
  unlockQuery,
  userBody,
  purchaseBody,
  moviesStatsQuery,
  dailyStatsQuery,
};
