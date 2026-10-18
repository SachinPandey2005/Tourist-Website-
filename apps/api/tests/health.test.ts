import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as dbModule from '../src/config/database.js';

describe('GET /api/health', () => {
  it('should return 200 with service health payload', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(['healthy', 'degraded']).toContain(response.body.status);
    expect(response.body).toHaveProperty('services');
    expect(response.body.services).toHaveProperty('api', 'healthy');
    expect(response.body.services).toHaveProperty('database');
    expect(response.body).toHaveProperty('uptime');
    expect(typeof response.body.uptime).toBe('number');
    expect(response.body).toHaveProperty('memoryUsageMb');
    expect(typeof response.body.memoryUsageMb).toBe('number');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return degraded status when database is disconnected', async () => {
    const spy = vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValueOnce({
      status: 'disconnected',
      error: 'Connection refused',
    });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('degraded');
    expect(response.body.services.database).toBe('disconnected');

    spy.mockRestore();
  });
});
