import { Response } from 'express';
import type { ApiResponse } from '@tourist/shared';

export class ApiResponseBuilder {
  static success<T>(res: Response, data: T, statusCode = 200): Response {
    const responsePayload: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responsePayload);
  }

  static error(
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: unknown
  ): Response {
    const responsePayload: ApiResponse<never> = {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined && { details }),
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responsePayload);
  }
}
