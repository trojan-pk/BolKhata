import { Request, Response, NextFunction } from 'express'
import { supabase } from '../services/supabase.service'
import {
    startSession,
    getSessionStatus,
    sendTextMessage,
    removeSession,
    getHistory,
    addScheduledReminder,
    getScheduledReminders,
    cancelScheduledReminder,
    cancelPendingSession,
    getPendingSessionId,
    normalizePairingPhone,
} from '../services/whatsapp.service'

/**
 * Every route here runs behind `authenticate`, and the WhatsApp session is
 * always the caller's own: the user id comes from the verified Supabase token,
 * never from the URL or body. (Previously any client could pass any userId.)
 */
const uid = (req: Request): string => req.user.id as string

// Helper: Express params can be string | string[] — always resolve to string
const param = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v)

const DEFAULT_TEMPLATE =
    `Hello {customer_name},\n\n` +
    `This is a payment reminder from your shopkeeper at *{store_name}*.\n` +
    `Your outstanding balance is *Rs {amount}*.\n\n` +
    `Please arrange payment at your earliest convenience. Thank you! 🙏`

// ─── GET /wa/link?phone=92XXXXXXXXXX — SSE: pairing_code | status | connected | error

export const linkQr = async (req: Request, res: Response): Promise<void> => {
    const userId = uid(req)

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

    const phone = normalizePairingPhone(String(req.query.phone ?? ''))
    if (!phone) {
        send('error', { error: 'Enter your WhatsApp number with country code, e.g. 923001234567' })
        res.end()
        return
    }

    const force = req.query.force === 'true' || req.query.force === '1'
    // `resume: false`: a status peek must not spawn the old session a moment
    // before startSession() tears it down for this new pairing.
    const current = await getSessionStatus(userId, { resume: false })

    // Only return connected early if already linked to this exact phone number and not forcing re-link
    if (current.linked && !force && current.phone === phone) {
        send('connected', { phone: current.phone })
        res.end()
        return
    }

    // startSession() below wipes any previous socket/credentials for a pairing
    // request. Doing it here too would race the fresh session it creates.

    let completed = false
    // Comment-only frames keep the stream from looking idle. Heroku's router
    // cuts responses idle for 55s and iOS drops requests after 60s without
    // bytes; typing a code into WhatsApp takes longer than that.
    const heartbeat = setInterval(() => {
        if (!res.writableEnded) res.write(': ping\n\n')
    }, 15_000)

    startSession(userId, send, () => {
        completed = true
        clearInterval(heartbeat)
        if (!res.writableEnded) res.end()
    }, phone).catch((err) => {
        completed = true
        clearInterval(heartbeat)
        send('error', { error: err instanceof Error ? err.message : 'Failed to start WhatsApp session' })
        if (!res.writableEnded) res.end()
    })

    // Client went away before linking. Keep the socket alive for a while: the
    // app may have dropped the stream while the user is still entering the
    // code, and falls back to polling /wa/status. Only this attempt is
    // cancelled — a newer one started meanwhile is left alone.
    // (`res`, not `req`: req 'close' fires as soon as a bodyless GET is read.)
    res.on('close', () => {
        clearInterval(heartbeat)
        if (completed) return
        const sessionId = getPendingSessionId(userId)
        if (sessionId === undefined) return
        setTimeout(() => cancelPendingSession(userId, sessionId), 5 * 60_000).unref()
    })
}

// ─── GET /wa/status ──────────────────────────────────────────────────────────

export const getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        res.json(await getSessionStatus(uid(req)))
    } catch (err) {
        next(err)
    }
}

// ─── DELETE /wa/link ─────────────────────────────────────────────────────────

export const unlink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await removeSession(uid(req))
        res.json({ success: true })
    } catch (err) {
        next(err)
    }
}

// ─── POST /wa/remind ─────────────────────────────────────────────────────────

export const sendReminder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = uid(req)
        const {
            customerId,
            phone: bodyPhone,
            name: bodyName,
            balance: bodyBalance,
            message: bodyMessage,
            storeName = 'BolKhata Store',
            kind = 'reminder',
        } = req.body as {
            customerId?: string
            phone?: string
            name?: string
            balance?: number
            message?: string
            storeName?: string
            /** `entry` = alert about one ledger entry; allowed at any balance. */
            kind?: 'reminder' | 'entry'
        }

        let phone = bodyPhone
        let name = bodyName
        let balance = bodyBalance

        // Fill gaps from the caller's own customer record. Scoped by user_id:
        // this client uses the service role, which bypasses RLS.
        if ((!phone || !name || balance === undefined) && customerId) {
            const { data: customer } = await supabase
                .from('customers')
                .select('name, phone, mobile, balance')
                .eq('id', customerId)
                .eq('user_id', userId)
                .maybeSingle()

            if (customer) {
                phone = phone || customer.phone || customer.mobile
                name = name || customer.name
                balance = balance !== undefined ? balance : Number(customer.balance)
            }
        }

        if (!phone) {
            res.status(400).json({ error: 'Customer phone number is required' })
            return
        }

        const isEntryAlert = kind === 'entry'

        if (isEntryAlert && !bodyMessage?.trim()) {
            res.status(400).json({ error: 'Entry alert message is required' })
            return
        }

        if (!isEntryAlert && (balance === undefined || balance <= 0)) {
            res.status(400).json({ error: 'No outstanding balance for this customer' })
            return
        }

        const status = await getSessionStatus(userId)
        if (!status.linked) {
            res.status(400).json({ error: 'WhatsApp session not active. Please link your account in Settings first.' })
            return
        }
        if (status.connecting) {
            res.status(503).json({ error: 'WhatsApp is reconnecting. Try again in a few seconds.' })
            return
        }

        const text = (bodyMessage || DEFAULT_TEMPLATE)
            .replace(/{customer_name}/g, name || 'Customer')
            .replace(/{amount}/g, (balance ?? 0).toLocaleString())
            .replace(/{store_name}/g, storeName)

        await sendTextMessage(userId, phone, text)

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

export const createSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { customerId, phone, name, balance, scheduledAt, message, storeName } = req.body as {
            customerId: string
            phone: string
            name: string
            balance: number
            scheduledAt: string
            message?: string
            storeName?: string
        }

        if (!customerId || !phone || !scheduledAt) {
            res.status(400).json({ error: 'customerId, phone, and scheduledAt are required' })
            return
        }
        if (Number.isNaN(new Date(scheduledAt).getTime())) {
            res.status(400).json({ error: 'scheduledAt must be a valid date' })
            return
        }

        const item = await addScheduledReminder({
            id: 'sch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            userId: uid(req),
            customerId,
            customerName: name || 'Customer',
            phone,
            balance: Number(balance) || 0,
            scheduledAt: new Date(scheduledAt).toISOString(),
            message,
            storeName,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
        })

        res.status(201).json({ success: true, schedule: item })
    } catch (err) {
        next(err)
    }
}

// ─── GET /wa/schedule — list schedules ───────────────────────────────────────

export const getSchedules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        res.json(await getScheduledReminders(uid(req)))
    } catch (err) {
        next(err)
    }
}

// ─── DELETE /wa/schedule/:scheduleId — cancel a schedule ────────────────────

export const deleteSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const success = await cancelScheduledReminder(uid(req), param(req.params.scheduleId))
        if (!success) {
            res.status(404).json({ error: 'Scheduled reminder not found' })
            return
        }
        res.json({ success: true })
    } catch (err) {
        next(err)
    }
}

// ─── GET /wa/history/:jid ────────────────────────────────────────────────────

export const getChatHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const jid = decodeURIComponent(param(req.params.jid))
        res.json(await getHistory(uid(req), jid))
    } catch (err) {
        next(err)
    }
}
