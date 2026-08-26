import { Request, Response, NextFunction } from 'express';

const DEVELOPER_EMAIL = 'test@bolkhata.com';
const DAILY_LIMIT = Number(process.env.DAILY_VOICE_LIMIT) || 50;

// In-memory store: { [userId]: { date: string, count: number } }
const usageCache: Record<string, { date: string; count: number }> = {};

export const voiceLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;

  if (!user || !user.id) {
    res.status(401).json({ error: 'Unauthorized: User not found in request.' });
    return;
  }

  // Developer Bypass
  if (user.email === DEVELOPER_EMAIL) {
    next();
    return;
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
