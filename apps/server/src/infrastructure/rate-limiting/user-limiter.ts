import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { formatError } from '../errors/error-formatter';
import { RateLimitError } from '../errors/error-types';

/** Applied to authenticated endpoints: 100 req/min per user ID. */
export const userRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX_USER) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).user?.id ?? ipKeyGenerator(req),
  skip: (req) => !(req as any).user,
  handler: (req, res) => {
    res.status(429).json(formatError(new RateLimitError('Too many requests'), req.id));
  },
});
