import { Request, Response, NextFunction } from 'express';

const DEFAULT_DEV_EMAILS = [
  'talhairfan1947@gmail.com',
  'test@bolkhata.com',
  'admin@bolkhata.com',
  'dev@bolkhata.com',
];

const envDevEmails = process.env.DEVELOPER_EMAILS
  ? process.env.DEVELOPER_EMAILS.split(',').map((e) => e.trim().toLowerCase())
  : [];

const DEVELOPER_EMAILS = new Set([...DEFAULT_DEV_EMAILS, ...envDevEmails]);

const DAILY_LIMIT = Number(process.env.DAILY_VOICE_LIMIT) || 50;

// In-memory store: { [userId]: { date: string, count: number } }
const usageCache: Record<string, { date: string; count: number }> = {};

export const voiceLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;

  if (!user || !user.id) {
    res.status(401).json({ error: 'Unauthorized: User not found in request.' });
    return;
  }

  const userEmail = (user.email || '').toLowerCase().trim();

  // Developer / Admin Unlimited Bypass
  if (
    DEVELOPER_EMAILS.has(userEmail) ||
    userEmail.endsWith('@bolkhata.com') ||
    user.user_metadata?.is_developer === true ||
    user.app_metadata?.is_developer === true ||
    user.app_metadata?.role === 'admin'
  ) {
    return next();
  }

  const userId = user.id;
  const today = new Date().toISOString().split('T')[0];

  // Initialize or reset cache for the user if it's a new day
  if (!usageCache[userId] || usageCache[userId].date !== today) {
    usageCache[userId] = { date: today, count: 0 };
  }

  // Check limit
  if (usageCache[userId].count >= DAILY_LIMIT) {
    res.status(429).json({ 
      error: 'Daily voice limit reached.',
      details: `You have used all ${DAILY_LIMIT} of your daily voice processing requests. Please try again tomorrow.`
    });
    return;
  }

  // Increment and proceed
  usageCache[userId].count += 1;
  next();
};
