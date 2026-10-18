import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Resource not found: Cannot ${req.method} ${req.originalUrl}`));
}
