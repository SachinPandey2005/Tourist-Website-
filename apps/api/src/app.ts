import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.routes.js';

export const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    },
    timestamp: new Date().toISOString()
  });
});

// Centralized Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred'
    },
    timestamp: new Date().toISOString()
  });
});
