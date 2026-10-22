import { Router } from 'express'
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

// SSE stream — pairing code for "Link with phone number" (?phone=92XXXXXXXXXX)
router.get('/link/:userId', linkQr)

// Linked status
router.get('/status/:userId', getStatus)

// Unlink + wipe session folder
router.delete('/link/:userId', unlink)

// Send payment reminder text via linked WA account
router.post('/remind', sendReminder)

// Schedule a reminder
router.post('/schedule', createSchedule)
router.get('/schedule/:userId', getSchedules)
router.delete('/schedule/:userId/:scheduleId', deleteSchedule)

// Stored message history for a JID
router.get('/history/:userId/:jid', getChatHistory)

export default router
