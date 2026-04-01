import { Request, Response, NextFunction } from 'express';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id =
    (req.headers['x-request-id'] as string) ||
    `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  req.id = id;
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', id);

  next();
}
