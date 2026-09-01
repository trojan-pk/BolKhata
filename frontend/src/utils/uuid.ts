/**
 * UUID v4 generation without native-module dependencies.
 *
 * The cloud schema (and its zod validators) only accept UUID primary keys,
 * so every locally-created party, entry, or cashbook row needs one before it
 * can sync. Hermes and Node both ship `crypto.getRandomValues`; the
 * Math.random fallback only exists for exotic runtimes.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fillRandom(buf: Uint8Array): void {
  const g = globalThis as {
    crypto?: { getRandomValues?: (b: Uint8Array) => Uint8Array };
  };
  if (typeof g.crypto?.getRandomValues === 'function') {
    g.crypto.getRandomValues(buf);
    return;
  }
  for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
}

/** Random UUID v4 — the ID format the cloud schema expects. */
export function uuid(): string {
  const b = new Uint8Array(16);
  fillRandom(b);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

/** True when `value` is a well-formed UUID — used to detect legacy local ids. */
export function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID_RE.test(value);
}
