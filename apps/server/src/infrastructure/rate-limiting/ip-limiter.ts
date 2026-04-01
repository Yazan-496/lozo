import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { formatError } from '../errors/error-formatter';
import { RateLimitError } from '../errors/error-types';

/** Applied to unauthenticated endpoints: 10 req/min per IP. */
export const ipRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX_IP) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  handler: (req, res) => {
    res.status(429).json(formatError(new RateLimitError('Too many requests'), req.id));
  },
});
