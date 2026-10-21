import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import {
  listReviewsQuerySchema,
  reviewStatsQuerySchema,
  createReviewSchema,
} from '../validators/review.validator.js';

export const reviewRouter = Router();

// Public Review Listings & Ratings Statistics
reviewRouter.get(
  '/',
  validateRequest({ query: listReviewsQuerySchema }),
  ReviewController.listReviews
);

reviewRouter.get(
  '/stats',
  validateRequest({ query: reviewStatsQuerySchema }),
  ReviewController.getStats
);

// Authenticated User Review Submission (Subject to Booking Rules)
reviewRouter.post(
  '/',
  authenticate,
  validateRequest({ body: createReviewSchema }),
  ReviewController.createReview
);

// Delete Review (Author or Admin)
reviewRouter.delete(
  '/:id',
  authenticate,
  validateRequest({ params: uuidParamSchema }),
  ReviewController.deleteReview
);
