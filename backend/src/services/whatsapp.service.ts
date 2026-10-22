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
    scheduledAt: string
    status: 'PENDING' | 'SENT' | 'CANCELLED' | 'FAILED'
    createdAt: string
}

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
                if (item.status === 'PENDING' && new Date(item.scheduledAt) <= now) {
                    const status = getSessionStatus(userId)
                    if (status.linked) {
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

                            await sendTextMessage(userId, item.phone, text)
                            item.status = 'SENT'
                            updated = true
                        } catch {
                            item.status = 'FAILED'
                            updated = true
                        }
                    }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const activeSockets = new Map<string, any>()
const connectingUsers = new Set<string>()

export interface SessionStatus {
    linked: boolean
    phone?: string
    /** Linked, socket still opening. */
    connecting?: boolean
    /** Not linked, a pairing attempt is in flight. */
    pairing?: boolean
}

function getSavedPhone(userId: string): string | null {
    try {
        const p = credsPath(userId)
        if (!fs.existsSync(p)) return null
        const content = fs.readFileSync(p, 'utf-8')
        const parsed = JSON.parse(content)
        // `requestPairingCode` writes `me` before the phone confirms, so `me`
        // alone doesn't mean linked. `account` is only set on pair-success.
        if (!parsed?.account) return null
        const meId = parsed?.me?.id
        if (meId) return meId.split(':')[0].split('@')[0]
    } catch { /* ignore */ }
    return null
}

/** Normalises user input to WhatsApp's E.164-without-plus format (PK default). */
export function normalizePairingPhone(raw: string): string | null {
    let digits = String(raw || '').replace(/\D/g, '')
    if (digits.startsWith('00')) digits = digits.slice(2)
    if (digits.startsWith('0')) digits = '92' + digits.slice(1)
    return digits.length >= 10 && digits.length <= 15 ? digits : null
}

// In-flight (not yet linked) pairing attempts, so a retry or a closed modal
// can tear the old socket down instead of leaving it reconnecting forever.
const pendingSessions = new Map<string, { id: number; cancel: () => void }>()
let nextSessionId = 1

/**
 * Cancels the user's in-flight pairing. Pass `sessionId` to cancel only that
 * attempt — a delayed cleanup must not kill a newer attempt that replaced it.
 */
export function cancelPendingSession(userId: string, sessionId?: number): void {
    const pending = pendingSessions.get(userId)
    if (!pending) return
    if (sessionId !== undefined && pending.id !== sessionId) return
    pending.cancel()
}

export function getPendingSessionId(userId: string): number | undefined {
    return pendingSessions.get(userId)?.id
}

/** Pairing sockets WhatsApp lets expire before we give up. */
const MAX_PAIRING_ATTEMPTS = 3
/**
 * Lifetime of each pairing ref. Baileys rotates 6 refs per socket, so 90s
 * keeps one socket — and the code shown to the user — valid for ~9 minutes.
 * The default (60s, then 20s) closed it after ~2.5 min, invalidating the code.
 */
const PAIRING_REF_TIMEOUT_MS = 90_000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const disconnectCode = (err: any): number => Number(err?.output?.statusCode ?? 0)

export function getSessionStatus(userId: string): SessionStatus {
    const sock = activeSockets.get(userId)
    if (sock) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const me = (sock as any).user ?? (sock as any).authState?.creds?.me
        return { linked: true, phone: me?.id?.split(':')[0] ?? me?.id }
    }
    const savedPhone = getSavedPhone(userId)
    if (savedPhone) {
        // Auto-connect socket in background if creds exist on disk and not already connecting
        if (!connectingUsers.has(userId)) {
            startSession(userId, () => {}, () => {}).catch(() => {})
        }
        // Paired, but the socket isn't open yet (just after pair-success, or
        // resuming after a server restart). Sending would fail until it is.
        return { linked: true, phone: savedPhone, connecting: true }
    }
    return { linked: false, pairing: pendingSessions.has(userId) }
}

// ─── start session (pairing code, or resume saved creds) ────────────────────

export type SendEvent = (event: string, data: unknown) => void

export async function startSession(
    userId: string,
    send: SendEvent,
    onComplete: (result: { success: boolean; phone?: string; error?: string }) => void,
    /** Digits only, e.g. 923001234567. Required to link a new device; omit to resume saved creds. */
    pairingPhone?: string
): Promise<void> {
    // If already active and connected, return immediately
    const existingSock = activeSockets.get(userId)
    if (existingSock) {
        const me = existingSock.user ?? existingSock.authState?.creds?.me
        const phone: string | undefined = me?.id?.split(':')[0] ?? me?.id
        send('connected', { phone })
        onComplete({ success: true, phone })
        return
    }

    if (pairingPhone) {
        // A fresh link request supersedes any half-finished attempt, and creds
        // left by an unconfirmed pairing would pin the old number.
        cancelPendingSession(userId)
        if (!getSavedPhone(userId)) {
            fs.rmSync(sessionDir(userId), { recursive: true, force: true })
        }
    }

    if (connectingUsers.has(userId)) {
        // Background resume already running — nothing to pair.
        onComplete({ success: false, error: 'A WhatsApp connection is already in progress' })
        return
    }

    connectingUsers.add(userId)
    let isFinished = false
    let pairingAttempts = 0
    let connectFailures = 0
    const sessionId = nextSessionId++
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentSock: any = null

    pendingSessions.set(userId, {
        id: sessionId,
        cancel: () => {
            isFinished = true
            connectingUsers.delete(userId)
            if (pendingSessions.get(userId)?.id === sessionId) pendingSessions.delete(userId)
            if (currentSock) {
                currentSock.ev.removeAllListeners('connection.update')
                try { currentSock.end(undefined) } catch { /* ignore */ }
            }
        },
    })
    const cancelSelf = () => cancelPendingSession(userId, sessionId)

    const {
        default: baileys,
        useMultiFileAuthState,
        fetchLatestBaileysVersion,
        makeCacheableSignalKeyStore,
        Browsers,
    } = await getBaileys()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const P = ((await Function('return import("pino")')()) as any).default
    const logger = P({ level: process.env.WA_LOG_LEVEL || 'silent' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function clearSocket(sock?: any) {
        isFinished = true
        connectingUsers.delete(userId)
        if (pendingSessions.get(userId)?.id === sessionId) pendingSessions.delete(userId)
        activeSockets.delete(userId)
        if (sock) {
            sock.ev.removeAllListeners('creds.update')
            try { await sock.logout() } catch { /* ignore */ }
            try { sock.end(undefined) } catch { /* ignore */ }
        }
    }

    // Loaded once per session and reused across reconnects. The 515 restart
    // that follows pair-success reconnects immediately, and re-reading
    // creds.json then could race the async write of the freshly paired creds.
    ensureDir(userId)
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir(userId))
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }))

    function scheduleReconnect(ms: number) {
        setTimeout(() => {
            if (isFinished) return
            connect().catch((err) => {
                connectFailures += 1
                if (connectFailures >= 5) {
                    cancelSelf()
                    const message = err instanceof Error ? err.message : String(err)
                    send('error', { error: `Could not reach WhatsApp: ${message}` })
                    onComplete({ success: false, error: message })
                    return
                }
                scheduleReconnect(Math.min(2000 * connectFailures, 10_000))
            })
        }, ms)
    }

    async function connect() {
        const sock = baileys({
            ...(version ? { version } : {}),
            logger,
            browser: Browsers.windows('Chrome'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            printQRInTerminal: false,
            qrTimeout: PAIRING_REF_TIMEOUT_MS,
            // Reminders only need to send. Skipping history sync and presence
            // keeps the first login after pairing fast.
            syncFullHistory: false,
            shouldSyncHistoryMessage: () => false,
            markOnlineOnConnect: false,
        })
        currentSock = sock
        connectFailures = 0
        let codeRequested = false

        sock.ev.on('creds.update', saveCreds)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr, isNewLogin }: any) => {
            if (isFinished) return
            // Baileys emits `qr` once the socket is ready for a new device —
            // that is the moment to ask for a pairing code instead
            // (see WhiskeySockets/Baileys Example/example.ts).
            if (qr && !sock.authState.creds.registered && !codeRequested) {
                codeRequested = true
                if (!pairingPhone) {
                    // Resuming saved creds that WhatsApp no longer accepts.
                    cancelSelf()
                    fs.rmSync(sessionDir(userId), { recursive: true, force: true })
                    send('error', { error: 'WhatsApp session expired. Link again with a pairing code.' })
                    onComplete({ success: false, error: 'Session expired' })
                    return
                }
                pairingAttempts += 1
                if (pairingAttempts > MAX_PAIRING_ATTEMPTS) {
                    cancelSelf()
                    send('error', { error: 'Pairing code expired. Request a new code to try again.' })
                    onComplete({ success: false, error: 'Pairing code expired' })
                    return
                }
                try {
                    const raw: string = await sock.requestPairingCode(pairingPhone)
                    const code = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw
                    send('pairing_code', { code, phone: pairingPhone })
                } catch (err) {
                    cancelSelf()
                    const message = err instanceof Error ? err.message : String(err)
                    send('error', { error: `Could not get a pairing code: ${message}` })
                    onComplete({ success: false, error: message })
                }
                return
            }
            // Phone accepted the code; WhatsApp now restarts the stream (515).
            if (isNewLogin) {
                send('status', { stage: 'paired' })
            }
            if (connection === 'open') {
                connectingUsers.delete(userId)
                if (pendingSessions.get(userId)?.id === sessionId) pendingSessions.delete(userId)
                const me = sock.user ?? sock.authState?.creds?.me
                const phone: string | undefined = me?.id?.split(':')[0] ?? me?.id
                activeSockets.set(userId, sock)
                send('connected', { phone })
                onComplete({ success: true, phone })
            }
            if (connection === 'close') {
                activeSockets.delete(userId)
                const code = disconnectCode(lastDisconnect?.error)

                // 401 loggedOut, 403 forbidden: credentials are dead.
                if (code === 401 || code === 403) {
                    await clearSocket(sock)
                    fs.rmSync(sessionDir(userId), { recursive: true, force: true })
                    send('error', { error: 'WhatsApp logged out' })
                    onComplete({ success: false, error: 'WhatsApp logged out' })
                    return
                }

                if (!isFinished) {
                    // 515 = restart required right after pairing: reconnect at
                    // once, the user is watching. Other drops get a short pause.
                    scheduleReconnect(code === 515 ? 0 : 3000)
                }
            }
        })

        // Track incoming messages in history. Only live ones: `append`
        // batches arrive by the hundred on first login and each write is sync.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sock.ev.on('messages.upsert', ({ messages, type }: any) => {
            if (type !== 'notify') return
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

    scheduleReconnect(0)
}

// ─── phone → WhatsApp JID ────────────────────────────────────────────────────

export const toWaJid = (phone: string): string =>
    phone.replace(/\D/g, '').replace(/^0/, '92') + '@s.whatsapp.net'

// ─── send a text message ─────────────────────────────────────────────────────

export async function sendTextMessage(userId: string, phone: string, text: string): Promise<void> {
    const sock = activeSockets.get(userId)
    if (!sock) throw new Error('WhatsApp session not active for this user')
    const jid = toWaJid(phone)
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
    cancelPendingSession(userId)
    const sock = activeSockets.get(userId)
    activeSockets.delete(userId)
    if (sock) {
        try { await sock.logout() } catch { /* ignore */ }
        try { sock.end(undefined) } catch { /* ignore */ }
    }
    fs.rmSync(sessionDir(userId), { recursive: true, force: true })
}
