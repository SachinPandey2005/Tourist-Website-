import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import { parsePaginationParams, formatPaginatedResult } from '../utils/pagination.js';
import type {
  CreateReviewInput,
  ReviewDto,
  ReviewStatsDto,
  PaginatedResult,
} from '@tourist/shared';

export interface ListReviewsFilter {
  page?: number;
  pageSize?: number;
  destinationId?: string;
  tourPackageId?: string;
  rating?: number;
  isVerifiedBooking?: boolean;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export class ReviewService {
  /**
   * Retrieves a paginated list of reviews for destinations or travel products.
   */
  static async listReviews(filter: ListReviewsFilter): Promise<PaginatedResult<ReviewDto>> {
    const { page, pageSize, skip, take, sortBy, sortOrder } = parsePaginationParams(
      {
        page: filter.page,
        pageSize: filter.pageSize,
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder,
      },
      10,
      100
    );

    const where: Prisma.ReviewWhereInput = {};

    if (filter.destinationId) {
      where.destinationId = filter.destinationId;
    }

    if (filter.tourPackageId) {
      where.tourPackageId = filter.tourPackageId;
    }

    if (filter.rating !== undefined) {
      where.rating = filter.rating;
    }

    if (filter.isVerifiedBooking !== undefined) {
      where.isVerifiedBooking = filter.isVerifiedBooking;
    }

    const orderBy: Prisma.ReviewOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const [items, totalItems] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    const formatted = items.map((r) => this.formatReview(r));
    return formatPaginatedResult(formatted, totalItems, page, pageSize);
  }

  /**
   * Calculates rating statistics and distribution for a destination or tour package.
   */
  static async getReviewStats(target: {
    destinationId?: string;
    tourPackageId?: string;
  }): Promise<ReviewStatsDto> {
    const where: Prisma.ReviewWhereInput = {};
    if (target.destinationId) where.destinationId = target.destinationId;
    if (target.tourPackageId) where.tourPackageId = target.tourPackageId;

    const [aggregate, distribution] = await Promise.all([
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where,
        _count: { rating: true },
      }),
    ]);

    const ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const group of distribution) {
      if (group.rating >= 1 && group.rating <= 5) {
        ratingDistribution[group.rating as 1 | 2 | 3 | 4 | 5] = group._count.rating;
      }
    }

    const rawAvg = aggregate._avg.rating ?? 0;
    const roundedAvg = Math.round(rawAvg * 100) / 100;

    return {
      averageRating: roundedAvg,
      totalReviews: aggregate._count.rating,
      ratingDistribution,
    };
  }

  /**
   * Allows an authenticated user to submit a review, subject to booking verification rules.
   */
  static async createReview(userId: string, input: CreateReviewInput): Promise<ReviewDto> {
    if (!input.destinationId && !input.tourPackageId) {
      throw AppError.badRequest(
        'Review must specify either destinationId or tourPackageId.',
        undefined,
        'TARGET_REQUIRED'
      );
    }

    // 1. Verify existence of target resource
    if (input.destinationId) {
      const dest = await prisma.destination.findUnique({ where: { id: input.destinationId } });
      if (!dest) {
        throw AppError.notFound('Target destination not found.', 'DESTINATION_NOT_FOUND');
      }
    }

    if (input.tourPackageId) {
      const tour = await prisma.tourPackage.findUnique({ where: { id: input.tourPackageId } });
      if (!tour) {
        throw AppError.notFound('Target tour package not found.', 'TOUR_NOT_FOUND');
      }
    }

    // 2. Prevent duplicate reviews from the same user on the same item
    const duplicate = await prisma.review.findFirst({
      where: {
        userId,
        ...(input.destinationId ? { destinationId: input.destinationId } : {}),
        ...(input.tourPackageId ? { tourPackageId: input.tourPackageId } : {}),
      },
    });

    if (duplicate) {
      throw AppError.conflict(
        'You have already submitted a review for this item.',
        'DUPLICATE_REVIEW'
      );
    }

    // 3. Evaluate Project Booking Rules for Verified Booking Badge
    const isVerifiedBooking = await this.checkVerifiedBooking(userId, input);

    // 4. Create Review
    const review = await prisma.review.create({
      data: {
        userId,
        destinationId: input.destinationId ?? null,
        tourPackageId: input.tourPackageId ?? null,
        rating: input.rating,
        title: input.title ?? null,
        comment: input.comment,
        isVerifiedBooking,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 5. Asynchronously recalculate and synchronize aggregate rating on parent catalog item
    await this.recalculateCatalogRating(input.destinationId, input.tourPackageId);

    return this.formatReview(review);
  }

  /**
   * Deletes a review (Review owner or Admin only).
   */
  static async deleteReview(reviewId: string, userId: string, isAdmin = false): Promise<void> {
    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      throw AppError.notFound(`Review '${reviewId}' was not found.`, 'REVIEW_NOT_FOUND');
    }

    if (!isAdmin && existing.userId !== userId) {
      throw AppError.forbidden(
        'You do not have permission to delete this review.',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    await prisma.review.delete({ where: { id: reviewId } });

    // Recalculate catalog rating
    await this.recalculateCatalogRating(existing.destinationId ?? undefined, existing.tourPackageId ?? undefined);
  }

  /**
   * Evaluates if the user has an active/completed booking for the item.
   */
  private static async checkVerifiedBooking(
    userId: string,
    input: CreateReviewInput
  ): Promise<boolean> {
    try {
      if (input.tourPackageId) {
        const verifiedBooking = await prisma.booking.findFirst({
          where: {
            userId,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            items: {
              some: {
                tourPackageId: input.tourPackageId,
              },
            },
          },
        });
        return Boolean(verifiedBooking);
      }

      if (input.destinationId) {
        const verifiedDestinationBooking = await prisma.booking.findFirst({
          where: {
            userId,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            items: {
              some: {
                OR: [
                  { tourPackage: { destinationId: input.destinationId } },
                  { hotel: { destinationId: input.destinationId } },
                  { activity: { destinationId: input.destinationId } },
                ],
              },
            },
          },
        });
        return Boolean(verifiedDestinationBooking);
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Recalculates and updates the aggregate rating and reviewCount for a Destination or TourPackage.
   */
  private static async recalculateCatalogRating(
    destinationId?: string,
    tourPackageId?: string
  ): Promise<void> {
    try {
      if (destinationId) {
        const stats = await prisma.review.aggregate({
          where: { destinationId },
          _avg: { rating: true },
          _count: { rating: true },
        });
        const rating = stats._avg.rating ? Math.round(stats._avg.rating * 100) / 100 : 0.0;
        await prisma.destination.update({
          where: { id: destinationId },
          data: {
            rating,
            reviewCount: stats._count.rating,
          },
        });
      }

      if (tourPackageId) {
        const stats = await prisma.review.aggregate({
          where: { tourPackageId },
          _avg: { rating: true },
          _count: { rating: true },
        });
        const rating = stats._avg.rating ? Math.round(stats._avg.rating * 100) / 100 : 0.0;
        await prisma.tourPackage.update({
          where: { id: tourPackageId },
          data: {
            rating,
            reviewCount: stats._count.rating,
          },
        });
      }
    } catch (err) {
      console.error('Failed to recalculate catalog rating:', err);
    }
  }

  private static formatReview(r: {
    id: string;
    userId: string;
    destinationId: string | null;
    tourPackageId: string | null;
    rating: number;
    title: string | null;
    comment: string;
    isVerifiedBooking: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  }): ReviewDto {
    return {
      id: r.id,
      userId: r.userId,
      destinationId: r.destinationId,
      tourPackageId: r.tourPackageId,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerifiedBooking: r.isVerifiedBooking,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      user: r.user,
    };
  }
}
