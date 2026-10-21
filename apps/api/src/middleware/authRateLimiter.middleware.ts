import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';

/**
 * Strict rate limiter to defend against brute-force login and credential-stuffing attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, res) => {
    return ApiResponseBuilder.error(
      res,
      429,
      'AUTH_RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts from this IP address. Please try again after 15 minutes.'
    );
  },
});
