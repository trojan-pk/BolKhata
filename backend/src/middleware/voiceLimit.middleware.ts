import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.service';
import { AuthUser } from './auth.middleware';

/**
 * Daily voice-processing quota.
 *
 * Bypass rules:
 *  - `DEVELOPER_EMAILS` env var (comma-separated) — no hardcoded defaults.
 *  - `*@bolkhata.com` staff accounts.
 *  - `app_metadata.role = 'admin'` — app_metadata is read-only for users,
 *    unlike user_metadata, which anyone can edit on their own profile.
 *
 * Usage counting prefers the `increment_voice_usage` Postgres function so the
 * counter survives restarts and works across instances; if the database is
 * unreachable it falls back to an in-memory counter (fail-open) so a Supabase
 * blip can't take voice entry down entirely.
 */

const envDevEmails = (process.env.DEVELOPER_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const DEVELOPER_EMAILS = new Set(envDevEmails);

const DAILY_LIMIT = Number(process.env.DAILY_VOICE_LIMIT) || 50;

/** In-memory fallback only — authoritative counting lives in Postgres. */
const memoryUsage: Record<string, { date: string; count: number }> = {};

function isPrivileged(user: AuthUser): boolean {
  const email = (user.email || '').toLowerCase().trim();
  return (
    DEVELOPER_EMAILS.has(email) ||
    email.endsWith('@bolkhata.com') ||
    user.app_metadata?.role === 'admin'
  );
}

async function checkAndIncrement(userId: string): Promise<{ allowed: boolean; count: number }> {
  try {
    const { data, error } = await supabase.rpc('increment_voice_usage', {
      p_user_id: userId,
      p_limit: DAILY_LIMIT,
    });

    if (!error && data && typeof data.allowed === 'boolean') {
      return { allowed: data.allowed, count: data.count };
    }
    console.warn(
      '[VoiceLimit] RPC failed, using in-memory counter:',
      error?.message || 'unexpected response'
    );
  } catch (e) {
    console.warn('[VoiceLimit] RPC exception, using in-memory counter:', e);
  }

  const today = new Date().toISOString().split('T')[0];
  if (!memoryUsage[userId] || memoryUsage[userId].date !== today) {
    memoryUsage[userId] = { date: today, count: 0 };
  }
  memoryUsage[userId].count += 1;
  return { allowed: memoryUsage[userId].count <= DAILY_LIMIT, count: memoryUsage[userId].count };
}

export const voiceLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user || !user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found in request.' });
      return;
    }

    if (isPrivileged(user)) {
      next();
      return;
    }

    const { allowed, count } = await checkAndIncrement(user.id);

    if (!allowed) {
      res.status(429).json({
        error: 'Daily voice limit reached.',
        details: `You have used all ${DAILY_LIMIT} of your daily voice processing requests (${count} attempts). Please try again tomorrow.`,
      });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
};
