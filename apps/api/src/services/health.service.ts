import { checkDatabaseHealth } from '../config/database.js';
import { env } from '../config/env.js';
import type { HealthCheckResponse, ServiceStatus, DatabaseStatus } from '@tourist/shared';

export interface DetailedHealthResponse extends HealthCheckResponse {
  databaseLatencyMs?: number;
  memoryUsageMb: number;
}

export class HealthService {
  static async getSystemHealth(): Promise<DetailedHealthResponse> {
    const dbHealth = await checkDatabaseHealth(1500);

    const apiStatus: ServiceStatus = 'healthy';
    const dbStatus: DatabaseStatus =
      dbHealth.status === 'connected' ? 'connected' : 'disconnected';

    // If database is disconnected, system overall status is degraded
    const overallStatus: ServiceStatus =
      dbStatus === 'connected' ? 'healthy' : 'degraded';

    const memory = process.memoryUsage();
    const memoryMb = Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100;

    return {
      status: overallStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: '0.1.0',
      services: {
        api: apiStatus,
        database: dbStatus,
      },
      ...(dbHealth.latencyMs !== undefined && { databaseLatencyMs: dbHealth.latencyMs }),
      memoryUsageMb: memoryMb,
    };
  }
}
