import { imageSync } from 'qr-image'
import fs from 'fs'
import path from 'path'

// ─── lazy ESM loader ─────────────────────────────────────────────────────────
// Baileys (ESM) cannot be statically imported from a CJS module under Node16.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getBaileys(): Promise<any> {
    return Function('return import("baileys")')()
}

// ─── paths ────────────────────────────────────────────────────────────────────

const sessionDir = (userId: string) => path.join(process.cwd(), 'wa', userId)
const credsPath  = (userId: string) => path.join(sessionDir(userId), 'creds.json')
const msgsPath   = (userId: string) => path.join(sessionDir(userId), 'messages.json')

function ensureDir(userId: string) {
    fs.mkdirSync(sessionDir(userId), { recursive: true })
}

// ─── message history (nel-whatsapp addMessage pattern) ────────────────────────

export interface StoredMessage {
    id: string
    jid: string
    text: string
    fromMe: boolean
    timestamp: number
}

type MessageStore = Record<string, StoredMessage[]>

function readMessages(userId: string): MessageStore {
    try { return JSON.parse(fs.readFileSync(msgsPath(userId), 'utf-8')) } catch { return {} }
}

function writeMessages(userId: string, store: MessageStore) {
    fs.writeFileSync(msgsPath(userId), JSON.stringify(store, null, 2))
}

export function addToHistory(userId: string, jid: string, msg: StoredMessage) {
    ensureDir(userId)
    const store = readMessages(userId)
    const msgs = store[jid] ?? []
    if (msgs.length >= 200) msgs.shift()   // same as nel-whatsapp addMessage
    msgs.push(msg)
    store[jid] = msgs
    writeMessages(userId, store)
}

export function getHistory(userId: string, jid: string): StoredMessage[] {
    return readMessages(userId)[jid] ?? []
}

// ─── scheduled reminders (file-backed) ────────────────────────────────────────

const schedulesPath = (userId: string) => path.join(sessionDir(userId), 'schedules.json')

export interface ScheduledReminder {
    id: string
    userId: string
    customerId: string
    customerName: string
    phone: string
    balance: number
    message?: string
    storeName?: string
    /** Dialling prefix used to build the JID (default '92' = Pakistan). */
    countryCode?: string
    scheduledAt: string
    status: 'PENDING' | 'SENT' | 'CANCELLED' | 'FAILED'
    createdAt: string
    /** Set when the reminder actually goes out. */
    sentAt?: string
    /** Failed delivery attempts; after MAX_ATTEMPTS the reminder is FAILED. */
    attempts?: number
}

/** Failed sends are retried with this spacing between attempts. */
const RETRY_DELAY_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 3

function readSchedules(userId: string): ScheduledReminder[] {
    try { return JSON.parse(fs.readFileSync(schedulesPath(userId), 'utf-8')) } catch { return [] }
}

function writeSchedules(userId: string, list: ScheduledReminder[]) {
    ensureDir(userId)
    fs.writeFileSync(schedulesPath(userId), JSON.stringify(list, null, 2))
}

export function addScheduledReminder(reminder: ScheduledReminder): ScheduledReminder {
    const list = readSchedules(reminder.userId)
    list.push(reminder)
    writeSchedules(reminder.userId, list)
    return reminder
}

export function getScheduledReminders(userId: string): ScheduledReminder[] {
    return readSchedules(userId)
}

export function cancelScheduledReminder(userId: string, scheduleId: string): boolean {
    const list = readSchedules(userId)
    const item = list.find((s) => s.id === scheduleId)
    if (!item) return false
    item.status = 'CANCELLED'
    writeSchedules(userId, list)
    return true
}

async function checkAndRunScheduledReminders() {
    try {
        const waDir = path.join(process.cwd(), 'wa')
        if (!fs.existsSync(waDir)) return
        const userDirs = fs.readdirSync(waDir)
        const now = new Date()

        for (const userId of userDirs) {
            const list = readSchedules(userId)
            let updated = false

            for (const item of list) {
                if (item.status !== 'PENDING' || new Date(item.scheduledAt) > now) continue

                const status = getSessionStatus(userId)
                if (!status.linked) continue

                const attempts = item.attempts ?? 0
                try {
                    const rawTemplate = item.message || (
                        `Hello {customer_name},\n\n` +
                        `This is a payment reminder from your shopkeeper at *{store_name}*.\n` +
                        `Your outstanding balance is *Rs {amount}*.\n\n` +
                        `Please arrange payment at your earliest convenience. Thank you! 🙏`
                    )
                    const text = rawTemplate
                        .replace(/{customer_name}/g, item.customerName)
                        .replace(/{amount}/g, item.balance.toLocaleString())
                        .replace(/{store_name}/g, item.storeName || 'BolKhata Store')

                    await sendTextMessage(userId, item.phone, text, item.countryCode)
                    item.status = 'SENT'
                    item.sentAt = new Date().toISOString()
                    updated = true
                } catch {
                    // Retry with backoff before giving up permanently.
                    item.attempts = attempts + 1
                    if (item.attempts >= MAX_ATTEMPTS) {
                        item.status = 'FAILED'
                    } else {
                        item.scheduledAt = new Date(now.getTime() + RETRY_DELAY_MS).toISOString()
                    }
                    updated = true
                }
            }

            if (updated) {
                writeSchedules(userId, list)
            }
        }
    } catch { /* ignore runner errors */ }
}

setInterval(checkAndRunScheduledReminders, 30000)

// ─── active socket registry ───────────────────────────────────────────────────

// ─── active socket & listener registry ────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const activeSockets = new Map<string, any>()

/**
 * Users whose socket is currently connecting. Guards against overlapping
 * `startSession` calls.
 */
const connectingSessions = new Set<string>()

export type SendEvent = (event: string, data: unknown) => void

/** Active SSE listener callbacks for each user. */
const sessionListeners = new Map<string, Set<SendEvent>>()

/** Cached latest base64 QR code image for each connecting user. */
const latestQr = new Map<string, string>()

export interface SessionStatus { linked: boolean; phone?: string }

function getSavedPhone(userId: string): string | null {
    try {
        const p = credsPath(userId)
        if (!fs.existsSync(p)) return null
        const content = fs.readFileSync(p, 'utf-8')
        const parsed = JSON.parse(content)
        const meId = parsed?.me?.id
        if (meId) return meId.split(':')[0]
    } catch { /* ignore */ }
    return null
}

export function getSessionStatus(userId: string): SessionStatus {
    const sock = activeSockets.get(userId)
    if (sock) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const me = (sock as any).user ?? (sock as any).authState?.creds?.me
        return { linked: true, phone: me?.id?.split(':')[0] ?? me?.id }
    }
    const savedPhone = getSavedPhone(userId)
    if (savedPhone) {
        // Auto-connect socket in background if creds exist on disk — but only
        // if nothing is already connecting/connected for this user.
        if (!connectingSessions.has(userId)) {
            startSession(userId, () => {}, () => {}).catch(() => {})
        }
        return { linked: true, phone: savedPhone }
    }
    return { linked: false }
}

export function getLatestQr(userId: string): { status: 'linked' | 'connecting' | 'idle'; qr: string | null; phone?: string } {
    const session = getSessionStatus(userId)
    if (session.linked) {
        return { status: 'linked', qr: null, phone: session.phone }
    }
    const qr = latestQr.get(userId) ?? null
    if (qr) {
        return { status: 'connecting', qr }
    }
    if (!connectingSessions.has(userId) && !activeSockets.has(userId)) {
        startSession(userId, () => {}, () => {}).catch(() => {})
    }
    return { status: 'connecting', qr: null }
}

export function addListener(userId: string, send: SendEvent) {
    let set = sessionListeners.get(userId)
    if (!set) {
        set = new Set<SendEvent>()
        sessionListeners.set(userId, set)
    }
    set.add(send)
}

export function removeListener(userId: string, send: SendEvent) {
    const set = sessionListeners.get(userId)
    if (set) {
        set.delete(send)
        if (set.size === 0) sessionListeners.delete(userId)
    }
}

function broadcast(userId: string, event: string, data: unknown) {
    const set = sessionListeners.get(userId)
    if (set) {
        for (const send of Array.from(set)) {
            try { send(event, data) } catch { /* ignore closed stream */ }
        }
    }
}

// ─── start session (QR only) ──────────────────────────────────────────────────

export async function startSession(
    userId: string,
    send?: SendEvent,
    onComplete?: (result: { success: boolean; phone?: string; error?: string }) => void,
    forceRestart = false
): Promise<void> {
    if (send) {
        addListener(userId, send)
    }

    // If already linked, immediately emit connected
    const current = getSessionStatus(userId)
    if (current.linked) {
        if (send) send('connected', { phone: current.phone })
        if (onComplete) onComplete({ success: true, phone: current.phone })
        return
    }

    // If not linked and we already have a cached QR, emit it to this listener
    if (!forceRestart && latestQr.has(userId)) {
        const cached = latestQr.get(userId)
        if (cached && send) send('qr', { qr: cached })
    }

    // If already connecting and not force restart, the listener is registered and will receive events
    if (!forceRestart && (activeSockets.has(userId) || connectingSessions.has(userId))) {
        return
    }

    if (forceRestart) {
        latestQr.delete(userId)
        const oldSock = activeSockets.get(userId)
        activeSockets.delete(userId)
        connectingSessions.delete(userId)
        if (oldSock) {
            try { await oldSock.logout() } catch { /* ignore */ }
            try { oldSock.end(undefined) } catch { /* ignore */ }
        }
        // Wipe unauthenticated credentials
        if (!getSavedPhone(userId)) {
            fs.rmSync(sessionDir(userId), { recursive: true, force: true })
        }
    }

    let isFinished = false
    connectingSessions.add(userId)

    const {
        default: baileys,
        useMultiFileAuthState,
        fetchLatestBaileysVersion,
        Browsers,
        delay,
    } = await getBaileys()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const P = ((await Function('return import("pino")')()) as any).default
    const { Boom } = await Function('return import("@hapi/boom")')()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function clearSocket(sock?: any) {
        isFinished = true
        latestQr.delete(userId)
        connectingSessions.delete(userId)
        activeSockets.delete(userId)
        if (sock) {
            sock.ev.removeAllListeners('creds.update')
            try { await sock.logout() } catch { /* ignore */ }
            try { sock.end(undefined) } catch { /* ignore */ }
        }
    }

    async function connect() {
        ensureDir(userId)
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir(userId))
        const { version } = await fetchLatestBaileysVersion()

        const sock = baileys({
            version,
            logger: P({ level: 'silent' }),
            browser: Browsers.windows('Chrome'),
            auth: state,
            printQRInTerminal: false
        })

        sock.ev.on('creds.update', saveCreds)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }: any) => {
            if (isFinished) return
            if (qr) {
                const qrBase64 = imageSync(qr).toString('base64')
                latestQr.set(userId, qrBase64)
                broadcast(userId, 'qr', { qr: qrBase64 })
            }
            if (connection === 'open') {
                latestQr.delete(userId)
                const me = sock.user ?? sock.authState?.creds?.me
                const phone: string | undefined = me?.id?.split(':')[0] ?? me?.id
                connectingSessions.delete(userId)
                activeSockets.set(userId, sock)
                broadcast(userId, 'connected', { phone })
                if (onComplete) onComplete({ success: true, phone })
            }
            if (connection === 'close') {
                const code: number = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output?.statusCode
                    : 0
                if ([401, 403, 428].includes(code)) {
                    await clearSocket(sock)
                    broadcast(userId, 'error', { error: 'Session expired or logged out' })
                    if (onComplete) onComplete({ success: false, error: 'Session expired' })
                    return
                }
                if (!isFinished) { await delay(3000); connect() }
            }
        })

        // Track incoming messages in history
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sock.ev.on('messages.upsert', ({ messages }: any) => {
            for (const msg of messages) {
                const jid: string | undefined = msg.key?.remoteJid
                if (!jid) continue
                const text: string =
                    msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
                if (!text) continue
                addToHistory(userId, jid, {
                    id: msg.key?.id ?? String(Date.now()),
                    jid, text,
                    fromMe: msg.key?.fromMe ?? false,
                    timestamp: Number(msg.messageTimestamp) || Math.floor(Date.now() / 1000),
                })
            }
        })
    }

    connect().catch((e) => {
        console.warn('[WhatsApp] connect failed:', e)
        connectingSessions.delete(userId)
    })
}

export async function restartSession(userId: string): Promise<void> {
    await startSession(userId, undefined, undefined, true)
}

// ─── phone → WhatsApp JID ────────────────────────────────────────────────────

/**
 * Normalizes a local or international number to a WhatsApp JID.
 * '03001234567' / '3001234567' / '+923001234567' all map to the same JID
 * when countryCode is '92'.
 */
export const toWaJid = (phone: string, countryCode = '92'): string => {
    let digits = phone.replace(/\D/g, '')

    if (digits.startsWith('00')) digits = digits.slice(2)          // international prefix
    if (digits.startsWith('0')) digits = countryCode + digits.slice(1) // trunk prefix (0300…)
    else if (!digits.startsWith(countryCode) && digits.length <= 10) {
        digits = countryCode + digits                               // bare local number
    }
    return digits + '@s.whatsapp.net'
}

// ─── send a text message ─────────────────────────────────────────────────────

export async function sendTextMessage(
    userId: string,
    phone: string,
    text: string,
    countryCode = '92'
): Promise<void> {
    const sock = activeSockets.get(userId)
    if (!sock) throw new Error('WhatsApp session not active for this user')
    const jid = toWaJid(phone, countryCode)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sent: any = await sock.sendMessage(jid, { text })
    addToHistory(userId, jid, {
        id: sent?.key?.id ?? String(Date.now()),
        jid, text, fromMe: true,
        timestamp: Math.floor(Date.now() / 1000),
    })
}

// ─── remove session ───────────────────────────────────────────────────────────

export async function removeSession(userId: string): Promise<void> {
    const sock = activeSockets.get(userId)
    activeSockets.delete(userId)
    connectingSessions.delete(userId)
    if (sock) {
        try { await sock.logout() } catch { /* ignore */ }
        try { sock.end(undefined) } catch { /* ignore */ }
    }
    fs.rmSync(sessionDir(userId), { recursive: true, force: true })
}
