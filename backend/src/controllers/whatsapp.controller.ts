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
} from '../services/whatsapp.service'

// Stub user — same as rest of app for now
const USER_ID = '00000000-0000-0000-0000-000000000000'

// Helper: Express params can be string | string[] — always resolve to string
const param = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v)

// ─── GET /wa/link/:userId — SSE stream: qr | connected | error ───────────────

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

    startSession(userId, send, () => {
        if (!res.writableEnded) res.end()
    })

    req.on('close', () => {
        if (!res.writableEnded) res.end()
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
        } = req.body as {
            userId?: string
            customerId?: string
            phone?: string
            name?: string
            balance?: number
            message?: string
            storeName?: string
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

        await sendTextMessage(userId, phone, text)

        // Try inserting into Supabase reminders table (ignore errors if customerId is mock/local ID)
        if (customerId) {
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
