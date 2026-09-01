import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase.service';

/** Minimal shape of the Supabase auth user attached by `authenticate`. */
export interface AuthUser {
  id: string;
  email?: string;
  /** Read-only claims set by the backend — safe for authorization. */
  app_metadata?: Record<string, unknown>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Resolves the verified user id from the Supabase JWT, or responds 401 and
 * returns null. Controllers behind `authenticate` should still call this for
 * the compiler's benefit — the middleware guarantees a user in practice.
 */
export const requireUserId = (req: Request, res: Response): string | null => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: no verified user on request' });
    return null;
  }
  return userId;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    req.user = { id: user.id, email: user.email, app_metadata: user.app_metadata };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Internal Server Error' });
  }
};
