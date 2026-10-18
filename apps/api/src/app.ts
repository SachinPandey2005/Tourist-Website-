import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { requestLogger } from './middleware/logging.middleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { apiRouter } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // 1. Security HTTP Headers
  app.use(helmet());

  // 2. Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With'],
    })
  );

  // 3. Request Logging
  app.use(requestLogger);

  // 4. Request Body Parsing with Size Limiting
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 5. Rate Limiting for /api
  app.use('/api', apiRateLimiter);

  // 6. Mount Master API Routes
  app.use('/api', apiRouter);

  // 7. 404 Catch-All Handler
  app.use(notFoundHandler);

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
