import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';

export interface AuthPayload {
  userId: string;
  username: string;
}

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Missing or invalid token');
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, 'Token expired or invalid');
  }
}
