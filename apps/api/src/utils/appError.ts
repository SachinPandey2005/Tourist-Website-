export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details?: unknown, code = 'BAD_REQUEST'): AppError {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message = 'Unauthorized access', code = 'UNAUTHORIZED'): AppError {
    return new AppError(401, code, message);
  }

  static forbidden(message = 'Access forbidden', code = 'FORBIDDEN'): AppError {
    return new AppError(403, code, message);
  }

  static notFound(message = 'Requested resource not found', code = 'NOT_FOUND'): AppError {
    return new AppError(404, code, message);
  }

  static conflict(message = 'Resource conflict', code = 'CONFLICT'): AppError {
    return new AppError(409, code, message);
  }

  static unprocessable(message = 'Validation failed', details?: unknown, code = 'VALIDATION_ERROR'): AppError {
    return new AppError(422, code, message, details);
  }

  static internal(message = 'Internal server error', details?: unknown, code = 'INTERNAL_SERVER_ERROR'): AppError {
    return new AppError(500, code, message, details, false);
  }
}
