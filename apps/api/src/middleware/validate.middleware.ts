import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/appError.js';

export interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

export function validateRequest(schemas: RequestValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const allErrors: ValidationErrorDetail[] = [];

      if (schemas.params) {
        const result = await schemas.params.safeParseAsync(req.params);
        if (!result.success) {
          allErrors.push(
            ...result.error.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
              code: e.code,
            }))
          );
        } else {
          req.params = result.data as Record<string, string>;
        }
      }

      if (schemas.query) {
        const result = await schemas.query.safeParseAsync(req.query);
        if (!result.success) {
          allErrors.push(
            ...result.error.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
              code: e.code,
            }))
          );
        } else {
          req.query = result.data as Record<string, unknown> as typeof req.query;
        }
      }

      if (schemas.body) {
        const result = await schemas.body.safeParseAsync(req.body);
        if (!result.success) {
          allErrors.push(
            ...result.error.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
              code: e.code,
            }))
          );
        } else {
          req.body = result.data;
        }
      }

      if (allErrors.length > 0) {
        return next(
          AppError.unprocessable('Validation failed on request parameters', allErrors)
        );
      }

      next();
    } catch (err: unknown) {
      return next(err);
    }
  };
}
