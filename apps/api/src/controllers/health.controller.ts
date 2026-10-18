import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service.js';

export class HealthController {
  static async check(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const healthData = await HealthService.getSystemHealth();
      // Returns 200 OK with health status details
      res.status(200).json(healthData);
    } catch (err) {
      next(err);
    }
  }
}
