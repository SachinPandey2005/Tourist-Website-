import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { app } from '../src/app.js';
import { validateRequest } from '../src/middleware/validate.middleware.js';
import { errorHandler } from '../src/middleware/error.middleware.js';
import { AppError } from '../src/utils/appError.js';
import { paginationQuerySchema, uuidParamSchema } from '../src/validators/common.validator.js';

describe('Error Handling Middleware', () => {
  it('should return 404 for unknown API endpoints', async () => {
    const response = await request(app).get('/api/unknown-endpoint');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(response.body.error.message).toContain('Resource not found');
  });

  it('should handle malformed JSON syntax gracefully with 400 Bad Request', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ "brokenJson": ');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'INVALID_JSON');
  });

  it('should return operational AppError with specific status code and details', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get('/test-error', (_req, _res, next) => {
      next(AppError.conflict('Email already in use', 'EMAIL_TAKEN'));
    });
    testApp.use(errorHandler);

    const response = await request(testApp).get('/test-error');

    expect(response.status).toBe(409);
    expect(response.body.error).toHaveProperty('code', 'EMAIL_TAKEN');
    expect(response.body.error.message).toBe('Email already in use');
  });
});

describe('Zod Request Validation Middleware', () => {
  const sampleBodySchema = z.object({
    destinationName: z.string().min(3, 'Destination name must be at least 3 characters'),
    price: z.number().positive('Price must be greater than zero'),
  });

  const testApp = express();
  testApp.use(express.json());

  testApp.post(
    '/test-validation/:id',
    validateRequest({
      params: uuidParamSchema,
      query: paginationQuerySchema,
      body: sampleBodySchema,
    }),
    (req, res) => {
      res.status(200).json({ success: true, data: { body: req.body, query: req.query, params: req.params } });
    }
  );

  testApp.use(errorHandler);

  it('should pass validation with valid params, query, and body', async () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const response = await request(testApp)
      .post(`/test-validation/${validUuid}?page=2&pageSize=20`)
      .send({
        destinationName: 'Mount Fuji',
        price: 450.00,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.body.destinationName).toBe('Mount Fuji');
    expect(response.body.data.query.page).toBe(2);
    expect(response.body.data.params.id).toBe(validUuid);
  });

  it('should return 422 with structured field details when validation fails', async () => {
    const response = await request(testApp)
      .post('/test-validation/invalid-not-uuid?page=-1')
      .send({
        destinationName: 'A', // too short
        price: -50, // not positive
      });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(Array.isArray(response.body.error.details)).toBe(true);

    const fields = response.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toContain('id');
    expect(fields).toContain('destinationName');
    expect(fields).toContain('price');
  });
});
