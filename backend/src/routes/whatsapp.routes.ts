import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
    linkQr,
    getStatus,
    unlink,
    sendReminder,
    getChatHistory,
    createSchedule,
    getSchedules,
    deleteSchedule,
} from '../controllers/whatsapp.controller'

const router = Router()

// Every route acts on the signed-in user's own WhatsApp session; the user id
// comes from the Supabase bearer token, so it is no longer part of the path.
router.use(authenticate)

// SSE stream — pairing code for "Link with phone number" (?phone=92XXXXXXXXXX)
router.get('/link', linkQr)

// Linked status
router.get('/status', getStatus)

// Unlink + delete the stored session
router.delete('/link', unlink)

// Send payment reminder / entry alert via the linked WA account
router.post('/remind', sendReminder)

// Scheduled reminders
router.post('/schedule', createSchedule)
router.get('/schedule', getSchedules)
router.delete('/schedule/:scheduleId', deleteSchedule)

// Stored message history for a JID
router.get('/history/:jid', getChatHistory)

export default router
