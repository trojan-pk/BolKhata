import { z } from 'zod';

/**
 * Zod request schemas for every mutating endpoint.
 *
 * Routes apply these via `validate({ body: ..., params: ... })` so controllers
 * can trust the shape of `req.body` / `req.params` without re-checking.
 */

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{7,20}$/, 'Phone must be 7–20 digits (optional leading +)');

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

/* ------------------------------------------------------------------ shared -- */

export const idParamsSchema = z.object({
  id: z.uuid('Route param :id must be a UUID'),
});

export const transactionTypeSchema = z.enum(['gave', 'got']);

/* --------------------------------------------------------------- customers -- */

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: phoneSchema.optional(),
  address: z.string().trim().max(300).optional(),
  type: z.enum(['customer', 'supplier']).default('customer'),
  /** Opening balance as a real ledger entry (positive = they owe you). */
  openingBalance: z.coerce.number().optional(),
});

export const updateCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: phoneSchema.optional(),
    address: z.string().trim().max(300).optional(),
    type: z.enum(['customer', 'supplier']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

/* ------------------------------------------------------------ transactions -- */

export const createTransactionSchema = z.object({
  customer_id: z.uuid(),
  type: transactionTypeSchema,
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  note: z.string().trim().max(500).optional(),
  payment_mode: z.string().trim().max(30).default('cash'),
  date: isoDateSchema.optional(),
  source: z.enum(['manual', 'voice']).default('manual'),
});

export const updateTransactionSchema = z
  .object({
    type: transactionTypeSchema.optional(),
    amount: z.coerce.number().positive('Amount must be greater than 0').optional(),
    note: z.string().trim().max(500).optional(),
    payment_mode: z.string().trim().max(30).optional(),
    date: isoDateSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export const listTransactionsQuerySchema = z.object({
  customer_id: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

/* ---------------------------------------------------------------- WhatsApp -- */

export const waRemindSchema = z.object({
  customerId: z.uuid().optional(),
  phone: phoneSchema.optional(),
  name: z.string().trim().max(120).optional(),
  balance: z.coerce.number().optional(),
  message: z.string().max(2000).optional(),
  storeName: z.string().trim().max(120).optional(),
  /** Dialling prefix for local numbers — defaults to Pakistan (92). */
  countryCode: z.string().regex(/^\d{1,4}$/).default('92'),
});

export const waScheduleSchema = z.object({
  customerId: z.uuid().optional(),
  phone: phoneSchema,
  name: z.string().trim().max(120).optional(),
  balance: z.coerce.number(),
  scheduledAt: z.iso.datetime({ offset: true }),
  message: z.string().max(2000).optional(),
  storeName: z.string().trim().max(120).optional(),
  countryCode: z.string().regex(/^\d{1,4}$/).default('92'),
});

export const waHistoryParamsSchema = z.object({
  jid: z.string().min(3).max(120),
});

export const waScheduleIdParamsSchema = z.object({
  scheduleId: z.string().min(3).max(60),
});

/* ------------------------------------------------------------------- voice -- */

export const voiceTtsSchema = z.object({
  text: z.string().trim().min(1).max(2500),
  voiceId: z.string().trim().max(60).optional(),
});
