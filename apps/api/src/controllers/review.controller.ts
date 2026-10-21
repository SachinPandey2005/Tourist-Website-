import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';
import { UserRole } from '@prisma/client';

export class ReviewController {
  static async listReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ReviewService.listReviews(req.query as never);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ReviewService.getReviewStats(req.query as never);
      ApiResponseBuilder.success(res, stats);
    } catch (err) {
      next(err);
    }
  }

  static async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const review = await ReviewService.createReview(userId, req.body);
      ApiResponseBuilder.success(res, review, 201);
    } catch (err) {
      next(err);
    }
  }

  static async deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const reviewId = String(req.params.id);
      const isAdmin = req.user!.role === UserRole.ADMIN;
      await ReviewService.deleteReview(reviewId, userId, isAdmin);
      ApiResponseBuilder.success(res, { message: 'Review deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
