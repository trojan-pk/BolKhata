import { AVATAR_TINTS } from '../theme/colors';

/* ----------------------------------------------------------------- money -- */

/**
 * Groups digits the way the subcontinent reads them (1,20,000 not 120,000).
 * Falls back to a hand-rolled grouper if the runtime ships without full ICU.
 */
export function groupDigits(value: number): string {
  const n = Math.abs(Math.round(value));
  try {
    return n.toLocaleString('en-IN');
  } catch {
    const s = String(n);
    if (s.length <= 3) return s;
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
}

/** `Rs 12,500` — the canonical way an amount appears in the UI. */
export function formatMoney(value: number, currency = 'Rs'): string {
  const sign = Math.round(value) < 0 ? '− ' : '';
  return `${sign}${currency} ${groupDigits(value)}`;
}

/** Same, prefixed with an explicit direction sign. */
export function formatSigned(
  value: number,
  currency = 'Rs',
  sign: '+' | '-' | 'auto' = 'auto'
): string {
  const mark = sign === 'auto' ? (value < 0 ? '-' : '+') : sign;
  return `${mark} ${formatMoney(value, currency)}`;
}

/**
 * Shortens large figures for tight spots (chips, chart labels): 12.5K, 1.2 Cr.
 * Never used where the exact number matters.
 */
export function formatCompact(value: number, currency = 'Rs'): string {
  const n = Math.abs(value);
  if (n >= 10000000) return `${currency} ${trimZero(n / 10000000)} Cr`;
  if (n >= 100000) return `${currency} ${trimZero(n / 100000)} L`;
  if (n >= 1000) return `${currency} ${trimZero(n / 1000)}K`;
  return formatMoney(n, currency);
}

function trimZero(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '');
}

/* ------------------------------------------------------------------ dates -- */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function parseISO(iso?: string): Date | null {
  if (!iso) return null;
  const parts = iso.split('T')[0].split('-').map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Days between an ISO date and today. Positive = in the past. */
export function daysAgo(iso?: string): number | null {
  const d = parseISO(iso);
  if (!d) return null;
  const diff = startOfDay(new Date()) - startOfDay(d);
  return Math.round(diff / 86400000);
}

/** `Today`, `Yesterday`, `3 days ago`, then `12 Aug` / `12 Aug 2025`. */
export function formatRelativeDate(iso?: string): string {
  const d = parseISO(iso);
  if (!d) return 'Today';
  const days = daysAgo(iso) ?? 0;
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return `${days} days ago`;
  if (days < 0) return formatDate(iso);
  return formatDate(iso);
}

/** `12 Aug` for the current year, `12 Aug 2025` otherwise. */
export function formatDate(iso?: string): string {
  const d = parseISO(iso);
  if (!d) return '—';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return sameYear ? base : `${base} ${d.getFullYear()}`;
}

/** Day heading used above grouped ledger rows. */
export function formatDayHeading(iso?: string): string {
  const days = daysAgo(iso);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return formatDate(iso);
}

/** Groups any dated records into date-keyed buckets, newest bucket first. */
export function groupByDate<T extends { date?: string; createdAt?: number }>(
  items: T[]
): { key: string; label: string; items: T[] }[] {
  const buckets = new Map<string, T[]>();
  items.forEach((item) => {
    const key = (item.date || todayISO()).split('T')[0];
    const list = buckets.get(key);
    if (list) list.push(item);
    else buckets.set(key, [item]);
  });
  return Array.from(buckets.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, list]) => ({ key, label: formatDayHeading(key), items: list }));
}

/* --------------------------------------------------------------- identity -- */

/** Up to two initials, skipping honorifics and empty tokens. */
export function initialsOf(name: string): string {
  const words = (name || '')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !/^(mr|mrs|ms|dr|haji|malik)\.?$/i.test(w));
  if (words.length === 0) return (name || '?').trim().charAt(0).toUpperCase() || '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Stable tint per name, so a customer keeps the same avatar colour forever. */
export function tintFor(name: string): { bg: string; fg: string } {
  let hash = 0;
  const key = (name || '').toLowerCase();
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

/** Strips everything a dialer can't use. */
export function normalisePhone(mobile: string): string {
  return (mobile || '').replace(/[^\d+]/g, '');
}

/** `0300 1234567` for display; leaves already-formatted input alone. */
export function formatPhone(mobile: string): string {
  const digits = (mobile || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return mobile || '';
}

/* ----------------------------------------------------------------- misc -- */

export function pluralise(count: number, one: string, many?: string): string {
  return count === 1 ? one : many || `${one}s`;
}

/** Parses user-typed amounts: strips commas, spaces and stray currency marks. */
export function parseAmount(input: string): number {
  const cleaned = (input || '').replace(/[^\d.]/g, '');
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}
