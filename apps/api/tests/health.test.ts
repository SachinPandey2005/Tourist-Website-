import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('GET /api/health', () => {
  it('should return 200 with healthy service status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('services');
    expect(response.body.services).toEqual({
      api: 'healthy',
      database: 'pending'
    });
    expect(response.body).toHaveProperty('uptime');
    expect(typeof response.body.uptime).toBe('number');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return 404 for unknown endpoints with structured error', async () => {
    const response = await request(app).get('/api/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});
