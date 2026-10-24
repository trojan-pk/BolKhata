import { supabase } from './supabase.service'

/**
 * Baileys auth state backed by Supabase (tables in database/whatsapp.sql),
 * replacing `useMultiFileAuthState`. Heroku's filesystem is wiped on every
 * dyno restart, so linked-device logins must live in the database.
 *
 * Values are serialised with Baileys' BufferJSON so Buffers/Uint8Arrays
 * round-trip exactly as they do in the file store.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Baileys = any

/** PostgREST caps request size; first link writes ~812 pre-keys at once. */
const WRITE_CHUNK = 400
const READ_CHUNK = 200

/**
 * Per-user generation of the stored login. It is bumped whenever the state is
 * wiped. A socket captures the generation when it loads auth state; once the
 * generation moves on, its writes are dropped. Without this, a socket being
 * torn down (or an already-queued save) can write the old `registered` creds
 * back *after* the wipe — and /wa/status then reports the previous number as
 * linked again.
 */
const authGeneration = new Map<string, number>()
/** Last queued creds write per user, awaited before a wipe deletes the row. */
const credWrites = new Map<string, Promise<void>>()

const generationOf = (userId: string): number => authGeneration.get(userId) ?? 0

const chunk = <T>(arr: T[], size: number): T[][] => {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
}

export async function useSupabaseAuthState(userId: string, baileys: Baileys) {
    const { BufferJSON, initAuthCreds, proto } = baileys
    const generation = generationOf(userId)
    const isCurrent = () => generationOf(userId) === generation

    /** JSON-safe form for jsonb: Buffers become { type: 'Buffer', data: base64 }. */
    const encode = (value: unknown) => JSON.parse(JSON.stringify(value, BufferJSON.replacer))
    const decode = (value: unknown) => JSON.parse(JSON.stringify(value), BufferJSON.reviver)

    const { data: row, error: readErr } = await supabase
        .from('wa_auth_creds')
        .select('creds')
        .eq('user_id', userId)
        .maybeSingle()
    if (readErr) throw new Error(`Could not load WhatsApp session: ${readErr.message}`)

    const creds = row?.creds ? decode(row.creds) : initAuthCreds()

    // creds.update fires in bursts; serialise writes so an older snapshot can
    // never land after a newer one, and coalesce bursts into one upsert.
    let credsWrite: Promise<void> = Promise.resolve()
    let credsDirty = false
    const saveCreds = (): Promise<void> => {
        // This socket's login was wiped (unlink / change number). Never write
        // its old creds back over the new state.
        if (!isCurrent()) return Promise.resolve()
        credsDirty = true
        const write = credsWrite.then(async () => {
            if (!isCurrent() || !credsDirty) return
            credsDirty = false
            const meId: string | undefined = creds.me?.id
            const registered = !!creds.account
            const { error } = await supabase.from('wa_auth_creds').upsert({
                user_id: userId,
                creds: encode(creds),
                // Only a confirmed pairing (pair-success sets `account`) counts;
                // requestPairingCode writes `me` before the phone confirms.
                phone: registered && meId ? meId.split(':')[0].split('@')[0] : null,
                registered,
                updated_at: new Date().toISOString(),
            })
            if (error) console.error('[WA] saving creds failed:', error.message)
        })
        // Keep the chain alive after an unexpected encoding/DB error.
        credsWrite = write.catch((err) => {
            console.error('[WA] saving creds failed:', err instanceof Error ? err.message : String(err))
        })
        credWrites.set(userId, credsWrite)
        return credsWrite
    }

    const keys = {
        get: async (type: string, ids: string[]) => {
            const out: Record<string, unknown> = {}
            if (!isCurrent()) return out
            for (const part of chunk(ids, READ_CHUNK)) {
                const { data, error } = await supabase
                    .from('wa_auth_keys')
                    .select('key_id, value')
                    .eq('user_id', userId)
                    .eq('type', type)
                    .in('key_id', part)
                if (error) throw new Error(`Reading ${type} keys failed: ${error.message}`)
                for (const r of data ?? []) {
                    let value = decode(r.value)
                    if (type === 'app-state-sync-key' && value) {
                        value = proto.Message.AppStateSyncKeyData.fromObject(value)
                    }
                    out[r.key_id] = value
                }
            }
            return out
        },

        set: async (data: Record<string, Record<string, unknown>>) => {
            if (!isCurrent()) return
            const upserts: { user_id: string; type: string; key_id: string; value: unknown; updated_at: string }[] = []
            const deletes: Record<string, string[]> = {}
            const now = new Date().toISOString()

            for (const type in data) {
                for (const id in data[type]) {
                    const value = data[type][id]
                    if (value) {
                        upserts.push({ user_id: userId, type, key_id: id, value: encode(value), updated_at: now })
                    } else {
                        ;(deletes[type] ??= []).push(id)
                    }
                }
            }

            for (const part of chunk(upserts, WRITE_CHUNK)) {
                if (!isCurrent()) return
                const { error } = await supabase.from('wa_auth_keys').upsert(part)
                if (error) throw new Error(`Saving keys failed: ${error.message}`)
            }
            for (const type in deletes) {
                for (const part of chunk(deletes[type], READ_CHUNK)) {
                    if (!isCurrent()) return
                    const { error } = await supabase
                        .from('wa_auth_keys')
                        .delete()
                        .eq('user_id', userId)
                        .eq('type', type)
                        .in('key_id', part)
                    if (error) throw new Error(`Deleting keys failed: ${error.message}`)
                }
            }
        },
    }

    return { state: { creds, keys }, saveCreds }
}

/** Wipes a user's WhatsApp login (unlink, logged out, expired pairing). */
export async function clearSupabaseAuthState(userId: string): Promise<void> {
    // Invalidate every writer that loaded the old state first, then let any
    // already-running write finish, so it cannot recreate the row after the
    // delete below (the classic "old number comes back" race).
    authGeneration.set(userId, generationOf(userId) + 1)
    const pending = credWrites.get(userId)
    if (pending) {
        try {
            await pending
        } catch {
            // saveCreds already logged it.
        }
        if (credWrites.get(userId) === pending) credWrites.delete(userId)
    }

    const [a, b] = await Promise.all([
        supabase.from('wa_auth_keys').delete().eq('user_id', userId),
        supabase.from('wa_auth_creds').delete().eq('user_id', userId),
    ])
    if (a.error || b.error) {
        console.error('[WA] clearing auth state failed:', a.error?.message ?? b.error?.message)
    }
}

/** Phone of a confirmed pairing, or null if the user isn't linked. */
export async function getLinkedPhone(userId: string): Promise<string | null> {
    const { data } = await supabase
        .from('wa_auth_creds')
        .select('phone, registered')
        .eq('user_id', userId)
        .maybeSingle()
    return data?.registered && data.phone ? data.phone : null
}

/** Every user with a confirmed pairing — resumed on server boot. */
export async function listLinkedUsers(): Promise<{ userId: string; phone: string }[]> {
    const { data, error } = await supabase
        .from('wa_auth_creds')
        .select('user_id, phone')
        .eq('registered', true)
    if (error) {
        console.error('[WA] listing linked users failed:', error.message)
        return []
    }
    return (data ?? []).map((r) => ({ userId: r.user_id, phone: r.phone }))
}
