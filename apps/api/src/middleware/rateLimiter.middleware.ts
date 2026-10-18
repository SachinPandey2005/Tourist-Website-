import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, res) => {
    return ApiResponseBuilder.error(
      res,
      429,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests from this IP address. Please retry after some time.'
    );
  },
});
