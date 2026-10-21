import { z } from 'zod';

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  destinationId: z.string().uuid().optional(),
  tourPackageId: z.string().uuid().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isVerifiedBooking: z
    .enum(['true', 'false', '1', '0'])
    .transform((val) => val === 'true' || val === '1')
    .optional(),
  sortBy: z.enum(['createdAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const reviewStatsQuerySchema = z
  .object({
    destinationId: z.string().uuid().optional(),
    tourPackageId: z.string().uuid().optional(),
  })
  .refine((data) => data.destinationId !== undefined || data.tourPackageId !== undefined, {
    message: 'Either destinationId or tourPackageId must be provided to calculate review stats',
  });

export const createReviewSchema = z
  .object({
    destinationId: z.string().uuid('destinationId must be a valid UUID').optional(),
    tourPackageId: z.string().uuid('tourPackageId must be a valid UUID').optional(),
    rating: z.coerce.number().int().min(1, 'Rating must be at least 1 star').max(5, 'Rating cannot exceed 5 stars'),
    title: z.string().trim().max(120, 'Title cannot exceed 120 characters').optional().nullable(),
    comment: z.string().trim().min(5, 'Review comment must be at least 5 characters').max(2000),
  })
  .refine((data) => data.destinationId !== undefined || data.tourPackageId !== undefined, {
    message: 'Review must be associated with either a destinationId or a tourPackageId',
    path: ['destinationId'],
  });
