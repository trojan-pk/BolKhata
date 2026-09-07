/**
 * Supabase auth error translation.
 *
 * Supabase surfaces failures as free-text `message` plus an optional stable
 * `code`. Toasting the raw message is what produced the dead ends this module
 * exists to remove: "Email not confirmed" told the user nothing about what to do
 * next, and a signup against an existing address reported success.
 *
 * Every failure is classified into a `kind` the screen can branch on, so the UI
 * decides the next step rather than the user having to guess.
 */

import type { AuthError } from '@supabase/supabase-js';
import { COPY } from '../i18n/copy';

const C = COPY.onboarding.auth;

export type AuthFailureKind =
  /** Address exists but was never verified. Offer resend + retry. */
  | 'unconfirmed'
  /** Signup against an address that already has an account. Send them to login. */
  | 'exists'
  /** Wrong email/password pair. */
  | 'credentials'
  /** Malformed or rejected email address. */
  | 'email'
  /** Password rejected by the server's policy. */
  | 'password'
  /** Too many attempts — includes a cooldown hint when the server gives one. */
  | 'rateLimit'
  /** Provider is not switched on in the Supabase project. */
  | 'providerDisabled'
  /** User closed the OAuth sheet. Not an error worth shouting about. */
  | 'cancelled'
  /** Offline / DNS / TLS. */
  | 'network'
  | 'unknown';

export interface AuthFailure {
  kind: AuthFailureKind;
  /** Plain, actionable, already localised through `COPY`. */
  message: string;
}

/** Seconds the server asked us to wait, parsed out of its rate-limit message. */
export const parseRetryAfter = (raw: string): number | null => {
  const match = /(\d+)\s*second/i.exec(raw);
  return match ? Number(match[1]) : null;
};

/**
 * Classifies anything thrown by the Supabase auth client.
 *
 * Matching leads with the stable `code` field and only falls back to substring
 * checks on `message`, which Supabase is free to reword between releases.
 */
export const describeAuthError = (err: unknown): AuthFailure => {
  const error = err as Partial<AuthError> & { code?: string; status?: number };
  const code = (error?.code || '').toLowerCase();
  const raw = error?.message || '';
  const text = raw.toLowerCase();

  if (code === 'email_not_confirmed' || text.includes('email not confirmed')) {
    return { kind: 'unconfirmed', message: C.notConfirmed };
  }

  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    text.includes('already registered') ||
    text.includes('already been registered') ||
    text.includes('user already exists')
  ) {
    return { kind: 'exists', message: C.accountExists };
  }

  if (code === 'invalid_credentials' || text.includes('invalid login credentials')) {
    return { kind: 'credentials', message: C.badCredentials };
  }

  if (
    code === 'validation_failed' ||
    code === 'email_address_invalid' ||
    text.includes('invalid email') ||
    text.includes('unable to validate email')
  ) {
    return { kind: 'email', message: C.invalidEmail };
  }

  if (code === 'weak_password' || text.includes('password should be')) {
    return { kind: 'password', message: raw || C.shortPassword };
  }

  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    error?.status === 429 ||
    text.includes('rate limit') ||
    text.includes('too many requests')
  ) {
    const wait = parseRetryAfter(raw);
    return {
      kind: 'rateLimit',
      message: wait ? C.rateLimitedFor(wait) : C.rateLimited,
    };
  }

  if (
    code === 'provider_disabled' ||
    text.includes('not enabled') ||
    text.includes('provider is not enabled') ||
    text.includes('unsupported provider')
  ) {
    return { kind: 'providerDisabled', message: C.googleDisabled };
  }

  if (
    text.includes('network') ||
    text.includes('failed to fetch') ||
    text.includes('load failed') ||
    text.includes('timeout')
  ) {
    return { kind: 'network', message: C.offline };
  }

  return { kind: 'unknown', message: raw || C.failed };
};

/**
 * A signup that Supabase accepted but which actually hit an existing account.
 *
 * With email confirmations on, Supabase deliberately does **not** error here —
 * that would let anyone enumerate registered addresses. It returns a stub user
 * with an empty `identities` array instead, which is the only signal available.
 */
export const isExistingAccountSignup = (user: {
  identities?: unknown[] | null;
} | null): boolean => !!user && Array.isArray(user.identities) && user.identities.length === 0;

/** Cheap client-side gate so obvious typos never reach the network. */
export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
