import { randomUUID } from 'crypto'
import { Request, Response, NextFunction } from 'express'
import { supabase } from '../services/supabase.service'
import {
    startSession,
    getSessionStatus,
    getLatestQr,
    restartSession,
    removeListener,
    sendTextMessage,
    removeSession,
    getHistory,
    addScheduledReminder,
    getScheduledReminders,
    cancelScheduledReminder,
} from '../services/whatsapp.service'
import { requireUserId } from '../middleware/auth.middleware'

/**
 * WhatsApp automation endpoints.
 *
 * Identity always comes from the verified Supabase JWT (`req.user.id`) —
 * never from the URL or body — so one merchant can't reach another's session,
 * history, or reminders.
 *
 * The pairing flow supports both:
 * 1. REST polling via `GET /wa/qr` and `POST /wa/qr/refresh` (authenticated).
 * 2. Real-time SSE streaming via single-use ticket `POST /wa/link/ticket`
 *    followed by `GET /wa/link/:userId?ticket=…`.
 */

const TICKET_TTL_MS = 60_000

const linkTickets = new Map<string, { userId: string; expiresAt: number }>()

function createLinkTicket(userId: string): string {
    const ticket = randomUUID()
    linkTickets.set(ticket, { userId, expiresAt: Date.now() + TICKET_TTL_MS })
    // Opportunistic sweep of expired tickets.
    const now = Date.now()
    for (const [t, v] of linkTickets) if (v.expiresAt < now) linkTickets.delete(t)
    return ticket
}

/** Consumes a ticket if valid for the given user; single-use by design. */
function consumeLinkTicket(ticket: string | undefined, userId: string): boolean {
    if (!ticket) return false
    const entry = linkTickets.get(ticket)
    linkTickets.delete(ticket)
    return !!entry && entry.userId === userId && entry.expiresAt > Date.now()
}

// Helper: Express params can be string | string[] — always resolve to string
const param = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v)

// ─── GET /wa/qr — get latest QR code or connection status (authenticated) ───

export const getQr = (req: Request, res: Response): void => {
    const userId = req.user?.id
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }
    res.json(getLatestQr(userId))
}

// ─── POST /wa/qr/refresh — wipe stale state and restart pairing fresh ───────

export const refreshQr = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = requireUserId(req, res)
        if (!userId) return
        await restartSession(userId)
        res.json({ success: true, status: 'connecting' })
    } catch (err) {
        next(err)
    }
}

// ─── POST /wa/link/ticket — mint a one-time SSE pairing ticket ────────────────

export const createTicket = (req: Request, res: Response): void => {
    const userId = req.user?.id
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }
    const ticket = createLinkTicket(userId)
    res.status(201).json({ ticket, userId, expiresInMs: TICKET_TTL_MS })
}

// ─── GET /wa/link/:userId?ticket=… — SSE stream: qr | connected | error ───────

export const linkQr = async (req: Request, res: Response): Promise<void> => {
    const userId = param(req.params.userId)
    const ticket = param((req.query.ticket as string | string[]) ?? '')

    // The URL user must match the authenticated ticket holder.
    if (!consumeLinkTicket(ticket, userId)) {
        res.status(401).json({ error: 'Invalid or expired pairing ticket' })
        return
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const send = (event: string, data: unknown) => {
        if (res.writableEnded) return
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    // Heartbeat so proxies (Railway et al.) don't reap an idle stream while
    // the shopkeeper walks to their phone to scan.
    const heartbeat = setInterval(() => {
        if (!res.writableEnded) res.write(`: ping\n\n`)
    }, 15_000)

    const finish = () => {
        clearInterval(heartbeat)
        removeListener(userId, send)
        if (!res.writableEnded) res.end()
    }

    // If already linked, immediately confirm
    const current = getSessionStatus(userId)
    if (current.linked) {
        send('connected', { phone: current.phone })
        finish()
        return
    }

    req.on('close', () => {
        clearInterval(heartbeat)
        removeListener(userId, send)
        if (!res.writableEnded) res.end()
    })

    await startSession(userId, send, finish)
}

// ─── GET /wa/status — connection state for the calling user ──────────────────

export const getStatus = (req: Request, res: Response): void => {
    const userId = req.user?.id
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }
    res.json(getSessionStatus(userId))
}

// ─── DELETE /wa/link — unlink and wipe the calling user's session ────────────

export const unlink = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = requireUserId(req, res)
        if (!userId) return
        await removeSession(userId)
        res.json({ success: true })
    } catch (err) {
        next(err)
    }
}

// ─── POST /wa/remind — one-tap reminder for the calling user ─────────────────

export const sendReminder = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = requireUserId(req, res)
        if (!userId) return

        const {
            customerId,
            phone: bodyPhone,
            name: bodyName,
            balance: bodyBalance,
            message: bodyMessage,
            storeName = 'BolKhata Store',
            countryCode = '92',
        } = req.body

        let phone = bodyPhone
        let name = bodyName
        let balance = bodyBalance

        // Fallback to Supabase if details are missing — scoped to this user.
        if ((!phone || !name || balance === undefined) && customerId) {
            const { data: customer } = await supabase
                .from('customers')
                .select('name, phone, balance')
                .eq('id', customerId)
                .eq('user_id', userId)
                .single()

            if (customer) {
                phone = phone || customer.phone
                name = name || customer.name
                balance = balance !== undefined ? balance : Number(customer.balance)
            }
        }

        if (!phone) {
            res.status(400).json({ error: 'Customer phone number is required' })
            return
        }

        if (balance === undefined || balance <= 0) {
            res.status(400).json({ error: 'No outstanding balance for this customer' })
            return
        }

        const status = getSessionStatus(userId)
        if (!status.linked) {
            res.status(400).json({ error: 'WhatsApp session not active. Please link your account in Settings first.' })
            return
        }

        const customerName = name || 'Customer'
        const rawTemplate = bodyMessage || (
            `Hello {customer_name},\n\n` +
            `This is a payment reminder from your shopkeeper at *{store_name}*.\n` +
            `Your outstanding balance is *Rs {amount}*.\n\n` +
            `Please arrange payment at your earliest convenience. Thank you! 🙏`
        )

        const text = rawTemplate
            .replace(/{customer_name}/g, customerName)
            .replace(/{amount}/g, balance.toLocaleString())
            .replace(/{store_name}/g, storeName)

        await sendTextMessage(userId, phone, text, countryCode)

        res.json({
            success: true,
            phone,
            message: text,
            sentAt: new Date().toISOString(),
        })
    } catch (err) {
        next(err)
    }
}

// ─── POST /wa/schedule — schedule a reminder ─────────────────────────────────

export const createSchedule = (req: Request, res: Response): void => {
    const userId = req.user?.id
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    const {
        customerId,
        phone,
        name,
        balance,
        scheduledAt,
        message,
        storeName,
        countryCode,
    } = req.body

    if (!customerId || !phone || !scheduledAt) {
        res.status(400).json({ error: 'customerId, phone, and scheduledAt are required' })
        return
    }

    const item = addScheduledReminder({
        id: 'sch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        userId,
        customerId,
        customerName: name || 'Customer',
        phone,
        balance,
        scheduledAt,
        message,
        storeName,
        countryCode,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        attempts: 0,
    })

    res.status(201).json({ success: true, schedule: item })
}

// ─── GET /wa/schedule — list the calling user's schedules ─────────────────────

export const getSchedules = (req: Request, res: Response): void => {
    const userId = req.user?.id
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }
    res.json(getScheduledReminders(userId))
}

// ─── DELETE /wa/schedule/:scheduleId — cancel a schedule ─────────────────────

export const deleteSchedule = (req: Request, res: Response): void => {
    const userId = req.user?.id
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }
    const scheduleId = param(req.params.scheduleId)
    const success = cancelScheduledReminder(userId, scheduleId)
    if (!success) {
        res.status(404).json({ error: 'Scheduled reminder not found' })
        return
    }
    res.json({ success: true })
}

// ─── GET /wa/history/:jid — chat history for the calling user ────────────────

export const getChatHistory = (req: Request, res: Response): void => {
    const userId = req.user?.id
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }
    const jid = decodeURIComponent(param(req.params.jid))
    res.json(getHistory(userId, jid))
}
