import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestLogger } from './middleware/logging.middleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { apiRouter } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // 1. Security HTTP Headers via Helmet
  app.use(helmet());

  // 2. Cross-Origin Resource Sharing with Explicit Origin Allowlist
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin || allowedOrigins.includes(origin) || env.CORS_ORIGIN === '*') {
          return callback(null, true);
        }
        return callback(new Error(`CORS error: Origin ${origin} not allowed by allowlist`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Idempotency-Key',
        'X-Requested-With',
        'X-CSRF-Token',
        'x-razorpay-signature',
      ],
    })
  );

  // 3. Request Logging
  app.use(requestLogger);

  // 4. Request Body Parsing with Size Limiting and Raw Body Capture for Webhook Signatures
  app.use(
    express.json({
      limit: '1mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 5. Hardened Cookie Parser
  app.use(cookieParser(env.COOKIE_SECRET));

  // 6. General Rate Limiting for /api
  app.use('/api', apiRateLimiter);

  // 7. Mount Master API Routes
  app.use('/api', apiRouter);

  // 8. 404 Catch-All Handler
  app.use(notFoundHandler);

  // 9. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
