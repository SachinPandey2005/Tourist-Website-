import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // 1. Handle Operational AppErrors
  if (err instanceof AppError) {
    return ApiResponseBuilder.error(
      res,
      err.statusCode,
      err.errorCode,
      err.message,
      err.details
    );
  }

  // 2. Handle Body Parser Malformed JSON Syntax Errors
  if ('type' in err && err.type === 'entity.parse.failed') {
    return ApiResponseBuilder.error(
      res,
      400,
      'INVALID_JSON',
      'The request payload contains malformed JSON syntax'
    );
  }

  // 3. Handle Unexpected / Programmer Errors
  console.error('💥 Unhandled System Error:', err);

  const isProduction = env.NODE_ENV === 'production';
  const statusCode = 500;
  const errorCode = 'INTERNAL_SERVER_ERROR';
  const message = isProduction
    ? 'An unexpected internal server error occurred'
    : err.message || 'Internal Server Error';

  const details = isProduction ? undefined : { stack: err.stack };

  return ApiResponseBuilder.error(res, statusCode, errorCode, message, details);
}
