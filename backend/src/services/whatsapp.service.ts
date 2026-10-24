import { supabase } from './supabase.service'
import {
    clearSupabaseAuthState,
    getLinkedPhone,
    listLinkedUsers,
    useSupabaseAuthState,
} from './whatsappAuthStore'

/**
 * One Baileys socket per app user. Everything persistent — the linked-device
 * login, scheduled reminders, message history — lives in Supabase
 * (database/whatsapp.sql), because Heroku wipes the filesystem on every dyno
 * restart (at least daily). Only live sockets are kept in memory.
 *
 * Runs on a single dyno by design: two processes opening the same WhatsApp
 * session would knock each other offline.
 */

// ─── lazy ESM loader ─────────────────────────────────────────────────────────
// Baileys (ESM) cannot be statically imported from a CJS module under Node16.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getBaileys(): Promise<any> {
    return Function('return import("baileys")')()
}

// ─── message history ─────────────────────────────────────────────────────────

export interface StoredMessage {
    id: string
    jid: string
    text: string
    fromMe: boolean
    timestamp: number
}

const HISTORY_LIMIT = 200

export async function addToHistory(userId: string, jid: string, msg: StoredMessage): Promise<void> {
    const { error } = await supabase.from('wa_messages').upsert({
        user_id: userId,
        jid,
        id: msg.id,
        text: msg.text,
        from_me: msg.fromMe,
        ts: msg.timestamp,
    })
    if (error) console.error('[WA] saving message failed:', error.message)
}

export async function getHistory(userId: string, jid: string): Promise<StoredMessage[]> {
    const { data, error } = await supabase
        .from('wa_messages')
        .select('id, jid, text, from_me, ts')
        .eq('user_id', userId)
        .eq('jid', jid)
        .order('ts', { ascending: false })
        .limit(HISTORY_LIMIT)
    if (error) throw new Error(error.message)
    // Oldest first, as the file store returned it.
    return (data ?? [])
        .map((r) => ({ id: r.id, jid: r.jid, text: r.text, fromMe: r.from_me, timestamp: Number(r.ts) }))
        .reverse()
}

// ─── scheduled reminders ─────────────────────────────────────────────────────

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
    error?: string | null
    sentAt?: string | null
    createdAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowToReminder = (r: any): ScheduledReminder => ({
    id: r.id,
    userId: r.user_id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    phone: r.phone,
    balance: Number(r.balance),
    message: r.message ?? undefined,
    storeName: r.store_name ?? undefined,
    scheduledAt: r.scheduled_at,
    status: r.status,
    error: r.error,
    sentAt: r.sent_at,
    createdAt: r.created_at,
})

export async function addScheduledReminder(reminder: ScheduledReminder): Promise<ScheduledReminder> {
    const { data, error } = await supabase
        .from('wa_schedules')
        .insert({
            id: reminder.id,
            user_id: reminder.userId,
            customer_id: reminder.customerId,
            customer_name: reminder.customerName,
            phone: reminder.phone,
            balance: reminder.balance ?? 0,
            message: reminder.message ?? null,
            store_name: reminder.storeName ?? null,
            scheduled_at: reminder.scheduledAt,
            status: 'PENDING',
        })
        .select()
        .single()
    if (error) throw new Error(error.message)
    return rowToReminder(data)
}

export async function getScheduledReminders(userId: string): Promise<ScheduledReminder[]> {
    const { data, error } = await supabase
        .from('wa_schedules')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: true })
        .limit(500)
    if (error) throw new Error(error.message)
    return (data ?? []).map(rowToReminder)
}

export async function cancelScheduledReminder(userId: string, scheduleId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('wa_schedules')
        .update({ status: 'CANCELLED' })
        .eq('user_id', userId)
        .eq('id', scheduleId)
        .eq('status', 'PENDING')
        .select('id')
    if (error) throw new Error(error.message)
    return (data?.length ?? 0) > 0
}

const DEFAULT_TEMPLATE =
    `Hello {customer_name},\n\n` +
    `This is a payment reminder from your shopkeeper at *{store_name}*.\n` +
    `Your outstanding balance is *Rs {amount}*.\n\n` +
    `Please arrange payment at your earliest convenience. Thank you! 🙏`

/** Give up on a reminder whose sender stays unlinked this long past its time. */
const UNLINKED_GRACE_MS = 24 * 60 * 60 * 1000

let schedulerBusy = false

async function checkAndRunScheduledReminders() {
    if (schedulerBusy) return // a slow send must not overlap the next tick
    schedulerBusy = true
    try {
        const { data, error } = await supabase
            .from('wa_schedules')
            .select('*')
            .eq('status', 'PENDING')
            .lte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(50)
        if (error) {
            console.error('[WA] scheduler query failed:', error.message)
            return
        }

        for (const item of (data ?? []).map(rowToReminder)) {
            const finish = (status: 'SENT' | 'FAILED', err?: string) =>
                supabase
                    .from('wa_schedules')
                    .update({
                        status,
                        error: err ?? null,
                        sent_at: status === 'SENT' ? new Date().toISOString() : null,
                    })
                    .eq('id', item.id)
                    .eq('status', 'PENDING') // cancelled meanwhile → leave it

            if (!activeSockets.has(item.userId)) {
                // Socket not open (dyno just restarted, or reconnecting): keep
                // the reminder pending and retry next tick. Only fail it once
                // the user has clearly been unlinked for a long time.
                const linked = await getLinkedPhone(item.userId)
                if (linked) {
                    void ensureSessionRunning(item.userId)
                } else if (Date.now() - new Date(item.scheduledAt).getTime() > UNLINKED_GRACE_MS) {
                    await finish('FAILED', 'WhatsApp is not linked')
                }
                continue
            }

            try {
                const text = (item.message || DEFAULT_TEMPLATE)
                    .replace(/{customer_name}/g, item.customerName)
                    .replace(/{amount}/g, item.balance.toLocaleString())
                    .replace(/{store_name}/g, item.storeName || 'BolKhata Store')
                await sendTextMessage(item.userId, item.phone, text)
                await finish('SENT')
            } catch (err) {
                await finish('FAILED', err instanceof Error ? err.message : String(err))
            }
        }
    } catch (err) {
        console.error('[WA] scheduler error:', err)
    } finally {
        schedulerBusy = false
    }
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

/** Normalises user input to WhatsApp's E.164-without-plus format (PK default). */
export function normalizePairingPhone(raw: string): string | null {
    let digits = String(raw || '').replace(/\D/g, '')
    if (digits.startsWith('00')) digits = digits.slice(2)
    if (digits.startsWith('0')) digits = '92' + digits.slice(1)
    return digits.length >= 10 && digits.length <= 15 ? digits : null
}

// In-flight (not yet linked) pairing attempts, so a retry or a closed modal
// can tear the old socket down instead of leaving it reconnecting forever.
const pendingSessions = new Map<string, { id: number; cancel: () => void; pairing: boolean }>()
/** Users whose stored login is being torn down; status checks must not revive it. */
const wipingUsers = new Set<string>()
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const socketPhone = (sock: any): string | undefined => {
    const me = sock?.user ?? sock?.authState?.creds?.me
    return me?.id?.split(':')[0]?.split('@')[0]
}

/** Opens the saved session in the background if it isn't already. */
function ensureSessionRunning(userId: string): void {
    // Never resume the previous login while it is being wiped, or while the
    // user is actively pairing a new number.
    if (wipingUsers.has(userId) || pendingSessions.get(userId)?.pairing) return
    if (activeSockets.has(userId) || connectingUsers.has(userId)) return
    startSession(userId, () => {}, () => {}).catch((err) =>
        console.error(`[WA] resume failed for ${userId}:`, err)
    )
}

export async function getSessionStatus(
    userId: string,
    opts: { resume?: boolean } = {}
): Promise<SessionStatus> {
    // A pairing owns the account until it finishes. Never fall back to the
    // previous credentials while it is in flight: that made the UI show the
    // old number as linked again right after requesting a new code.
    if (pendingSessions.get(userId)?.pairing) return { linked: false, pairing: true }
    if (wipingUsers.has(userId)) return { linked: false }

    const sock = activeSockets.get(userId)
    if (sock) return { linked: true, phone: socketPhone(sock) }

    const savedPhone = await getLinkedPhone(userId)
    if (savedPhone) {
        if (opts.resume !== false) ensureSessionRunning(userId)
        // Paired, but the socket isn't open yet (just after pair-success, or
        // resuming after a dyno restart). Sending would fail until it is.
        return { linked: true, phone: savedPhone, connecting: true }
    }
    return { linked: false, pairing: pendingSessions.has(userId) }
}

/**
 * Reconnects every linked user after a dyno (re)start, so scheduled reminders
 * keep going without anyone opening the app. Staggered to avoid a burst of
 * logins from one IP.
 */
export async function resumeAllSessions(): Promise<void> {
    const users = await listLinkedUsers()
    if (users.length) console.log(`📱 [WA] Resuming ${users.length} linked WhatsApp session(s)…`)
    for (const { userId } of users) {
        ensureSessionRunning(userId)
        await new Promise((r) => setTimeout(r, 1500))
    }
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
    if (pairingPhone) {
        // A fresh pairing request for a phone supersedes any existing session or credentials
        // so Baileys starts clean in an unregistered state and requests a fresh pairing code.
        await removeSession(userId)
    } else {
        // Resuming existing credentials: if already active and connected, return immediately
        const existingSock = activeSockets.get(userId)
        if (existingSock) {
            const phone = socketPhone(existingSock)
            send('connected', { phone })
            onComplete({ success: true, phone })
            return
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
        pairing: !!pairingPhone,
        cancel: () => {
            isFinished = true
            connectingUsers.delete(userId)
            if (pendingSessions.get(userId)?.id === sessionId) pendingSessions.delete(userId)
            if (currentSock) {
                currentSock.ev.removeAllListeners('connection.update')
                // A cancelled pairing must not save its half-written creds.
                currentSock.ev.removeAllListeners('creds.update')
                try { currentSock.end(undefined) } catch { /* ignore */ }
            }
        },
    })
    const cancelSelf = () => cancelPendingSession(userId, sessionId)

    const fail = (error: string, userMessage = error) => {
        cancelSelf()
        send('error', { error: userMessage })
        onComplete({ success: false, error })
    }

    let baileysModule
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let state: any
    let saveCreds: () => Promise<void>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let logger: any
    let version: number[] | undefined
    try {
        baileysModule = await getBaileys()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const P = ((await Function('return import("pino")')()) as any).default
        logger = P({ level: process.env.WA_LOG_LEVEL || 'silent' })
        // Loaded once per session and reused across reconnects. The 515
        // restart that follows pair-success reconnects immediately; reloading
        // then could race the write of the freshly paired creds.
        ;({ state, saveCreds } = await useSupabaseAuthState(userId, baileysModule))
        ;({ version } = await baileysModule.fetchLatestBaileysVersion().catch(() => ({ version: undefined })))
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        fail(message, `Could not start WhatsApp: ${message}`)
        return
    }
    const { default: baileys, makeCacheableSignalKeyStore, Browsers } = baileysModule

    function scheduleReconnect(ms: number) {
        setTimeout(() => {
            if (isFinished) return
            connect().catch((err) => {
                connectFailures += 1
                if (connectFailures >= 5) {
                    const message = err instanceof Error ? err.message : String(err)
                    fail(message, `Could not reach WhatsApp: ${message}`)
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
                // In-memory cache in front of Supabase: signal key reads
                // happen on every message, so this avoids a DB round trip each.
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
                    fail('Session expired', 'WhatsApp session expired. Link again with a pairing code.')
                    sock.ev.removeAllListeners('creds.update')
                    await clearSupabaseAuthState(userId)
                    return
                }
                pairingAttempts += 1
                if (pairingAttempts > MAX_PAIRING_ATTEMPTS) {
                    fail('Pairing code expired', 'Pairing code expired. Request a new code to try again.')
                    return
                }
                try {
                    const raw: string = await sock.requestPairingCode(pairingPhone)
                    const code = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw
                    send('pairing_code', { code, phone: pairingPhone })
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err)
                    fail(message, `Could not get a pairing code: ${message}`)
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
                const phone = socketPhone(sock)
                activeSockets.set(userId, sock)
                // Make sure the registered flag/phone are persisted before we
                // report success, so /wa/status agrees immediately.
                await saveCreds()
                send('connected', { phone })
                onComplete({ success: true, phone })
            }
            if (connection === 'close') {
                activeSockets.delete(userId)
                const code = disconnectCode(lastDisconnect?.error)

                // 401 loggedOut (user removed the device), 403 forbidden:
                // credentials are dead.
                if (code === 401 || code === 403) {
                    isFinished = true
                    connectingUsers.delete(userId)
                    if (pendingSessions.get(userId)?.id === sessionId) pendingSessions.delete(userId)
                    sock.ev.removeAllListeners('creds.update')
                    try { sock.end(undefined) } catch { /* ignore */ }
                    await clearSupabaseAuthState(userId)
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
        // batches arrive by the hundred on first login.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sock.ev.on('messages.upsert', ({ messages, type }: any) => {
            if (type !== 'notify') return
            for (const msg of messages) {
                const jid: string | undefined = msg.key?.remoteJid
                if (!jid) continue
                const text: string =
                    msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
                if (!text) continue
                void addToHistory(userId, jid, {
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
    await addToHistory(userId, jid, {
        id: sent?.key?.id ?? String(Date.now()),
        jid, text, fromMe: true,
        timestamp: Math.floor(Date.now() / 1000),
    })
}

// ─── remove session ───────────────────────────────────────────────────────────

export async function removeSession(userId: string): Promise<void> {
    wipingUsers.add(userId)
    try {
        cancelPendingSession(userId)
        const sock = activeSockets.get(userId)
        activeSockets.delete(userId)
        connectingUsers.delete(userId)
        if (sock) {
            sock.ev.removeAllListeners('connection.update')
            // Drop the creds listener *before* logout: a dying socket must
            // never save its old registered creds back over the wipe.
            sock.ev.removeAllListeners('creds.update')
            try { await sock.logout() } catch { /* ignore */ }
            try { sock.end(undefined) } catch { /* ignore */ }
        }
        await clearSupabaseAuthState(userId)
    } finally {
        wipingUsers.delete(userId)
    }
}
