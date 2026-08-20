import { Request, Response, NextFunction } from 'express';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement signup using Supabase Auth
    res.status(501).json({ error: 'Not Implemented' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement login using Supabase Auth
    res.status(501).json({ error: 'Not Implemented' });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Return current user based on auth middleware
    res.status(501).json({ error: 'Not Implemented' });
  } catch (error) {
    next(error);
  }
};
