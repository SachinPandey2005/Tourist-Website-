import { Router, Request, Response } from 'express';
import type { HealthCheckResponse } from '@tourist/shared';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  const healthData: HealthCheckResponse = {
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '0.1.0',
    services: {
      api: 'healthy',
      database: 'pending'
    }
  };

  res.status(200).json(healthData);
});
