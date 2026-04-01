import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.service';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  logger.info('Request received', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.on('finish', () => {
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - req.startTime,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?.id,
    });
  });

  next();
}
