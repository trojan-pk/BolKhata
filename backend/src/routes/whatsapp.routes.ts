import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  waRemindSchema,
  waScheduleSchema,
  waHistoryParamsSchema,
  waScheduleIdParamsSchema,
} from '../validators';
import {
  linkQr,
  createTicket,
  getQr,
  refreshQr,
  getStatus,
  unlink,
  sendReminder,
  getChatHistory,
  createSchedule,
  getSchedules,
  deleteSchedule,
} from '../controllers/whatsapp.controller';

const router = Router()

// ─── authenticated JSON endpoints (identity from the Supabase JWT) ──────────

router.get('/status', authenticate, getStatus)
router.get('/qr', authenticate, getQr)
router.post('/qr/refresh', authenticate, refreshQr)
router.delete('/link', authenticate, unlink)
router.post('/remind', authenticate, validate({ body: waRemindSchema }), sendReminder)
router.post('/schedule', authenticate, validate({ body: waScheduleSchema }), createSchedule)
router.get('/schedule', authenticate, getSchedules)
router.delete(
    '/schedule/:scheduleId',
    authenticate,
    validate({ params: waScheduleIdParamsSchema }),
    deleteSchedule
)
router.get(
    '/history/:jid',
    authenticate,
    validate({ params: waHistoryParamsSchema }),
    getChatHistory
)

// ─── SSE pairing: ticket minted with auth header, spent on the stream ───────

// Single-use, 60s ticket for EventSource (which cannot send headers).
router.post('/link/ticket', authenticate, createTicket)

// SSE stream — browser EventSource opens this with the ticket to get QR images
router.get('/link/:userId', linkQr)

export default router
