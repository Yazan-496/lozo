import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger.service';
import { formatError } from './error-formatter';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  // Full details stay server-side only
  logger.error('Request failed', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    message: err.message,
    stack: err.stack,
  });

  const errorResponse = formatError(err, req.id);
  res.status(errorResponse.error.statusCode).json(errorResponse);
}
