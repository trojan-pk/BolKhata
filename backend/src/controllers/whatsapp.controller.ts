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

// Stub user — same as rest of app for now
const USER_ID = '00000000-0000-0000-0000-000000000000'

// Helper: Express params can be string | string[] — always resolve to string
const param = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v)

// ─── GET /wa/link/:userId?phone=92XXXXXXXXXX — SSE: pairing_code | connected | error

export const linkQr = async (req: Request, res: Response): Promise<void> => {
    const userId = param(req.params.userId) ?? USER_ID

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

    // If already linked, immediately confirm
    const current = getSessionStatus(userId)
    if (current.linked) {
        send('connected', { phone: current.phone })
        res.end()
        return
    }

    const phone = normalizePairingPhone(String(req.query.phone ?? ''))
    if (!phone) {
        send('error', { error: 'Enter your WhatsApp number with country code, e.g. 923001234567' })
        res.end()
        return
    }

    let completed = false
    // Comment-only frames keep the stream from looking idle. iOS (NSURLSession)
    // drops a request after 60s without bytes, and typing a code into WhatsApp
    // takes longer than that.
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

// ─── GET /wa/status/:userId ───────────────────────────────────────────────────

export const getStatus = (req: Request, res: Response): void => {
    const userId = param(req.params.userId) ?? USER_ID
    res.json(getSessionStatus(userId))
}

// ─── DELETE /wa/link/:userId ─────────────────────────────────────────────────

export const unlink = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await removeSession(param(req.params.userId) ?? USER_ID)
        res.json({ success: true })
    } catch (err) {
        next(err)
    }
}

// ─── POST /wa/remind ─────────────────────────────────────────────────────────

export const sendReminder = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const {
            userId = USER_ID,
            customerId,
            phone: bodyPhone,
            name: bodyName,
            balance: bodyBalance,
            message: bodyMessage,
            storeName = 'BolKhata Store',
            kind = 'reminder',
        } = req.body as {
            userId?: string
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

        // Fallback to Supabase if details are missing
        if ((!phone || !name || balance === undefined) && customerId) {
            const { data: customer } = await supabase
                .from('customers')
                .select('*')
                .eq('id', customerId)
                .single()

            if (customer) {
                phone = phone || customer.phone
                name = name || customer.name
                balance = balance !== undefined ? balance : customer.balance
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
            .replace(/{amount}/g, (balance ?? 0).toLocaleString())
            .replace(/{store_name}/g, storeName)

        await sendTextMessage(userId, phone, text)

        // Try inserting into Supabase reminders table (ignore errors if customerId is mock/local ID)
        if (customerId && !isEntryAlert) {
            try {
                await supabase.from('reminders').insert({
                    customer_id: customerId,
                    amount_due: balance,
                    due_date: new Date().toISOString().split('T')[0],
                    status: 'SENT',
                })
            } catch { /* ignore non-UUID customerId errors */ }
        }

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
    const {
        userId = USER_ID,
        customerId,
        phone,
        name,
        balance,
        scheduledAt,
        message,
        storeName,
    } = req.body as {
        userId?: string
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
        status: 'PENDING',
        createdAt: new Date().toISOString(),
    })

    res.status(201).json({ success: true, schedule: item })
}

// ─── GET /wa/schedule/:userId — list schedules ───────────────────────────────

export const getSchedules = (req: Request, res: Response): void => {
    const userId = param(req.params.userId) ?? USER_ID
    const list = getScheduledReminders(userId)
    res.json(list)
}

// ─── DELETE /wa/schedule/:userId/:scheduleId — cancel a schedule ────────────

export const deleteSchedule = (req: Request, res: Response): void => {
    const userId = param(req.params.userId) ?? USER_ID
    const scheduleId = param(req.params.scheduleId)
    const success = cancelScheduledReminder(userId, scheduleId)
    if (!success) {
        res.status(404).json({ error: 'Scheduled reminder not found' })
        return
    }
    res.json({ success: true })
}

// ─── GET /wa/history/:userId/:jid ────────────────────────────────────────────

export const getChatHistory = (req: Request, res: Response): void => {
    const userId = param(req.params.userId) ?? USER_ID
    const jid = decodeURIComponent(param(req.params.jid))
    res.json(getHistory(userId, jid))
}
