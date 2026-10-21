import { Prisma, TourDifficulty, ScheduleStatus, DestinationCategory, Destination } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import { parsePaginationParams, formatPaginatedResult } from '../utils/pagination.js';
import { slugify } from '../utils/slugify.js';
import type {
  CreateTourPackageInput,
  UpdateTourPackageInput,
  CreateTourScheduleInput,
  UpdateTourScheduleInput,
  TourPackageDto,
  TourScheduleDto,
  PaginatedResult,
} from '@tourist/shared';

export interface ListToursFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  q?: string;
  destinationId?: string;
  destinationSlug?: string;
  category?: DestinationCategory;
  difficulty?: TourDifficulty;
  minPrice?: number;
  maxPrice?: number;
  durationDays?: number;
  minDuration?: number;
  maxDuration?: number;
  hasAvailableSchedules?: boolean;
  isPublished?: boolean;
  sortBy?: 'basePrice' | 'rating' | 'reviewCount' | 'durationDays' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export class TourService {
  /**
   * Retrieves a paginated list of tour packages filtered by destination, price, duration, category, and availability.
   */
  static async listTours(filter: ListToursFilter): Promise<PaginatedResult<TourPackageDto>> {
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

    const where: Prisma.TourPackageWhereInput = {};

    // By default, only show published tours unless specifically filtered
    if (filter.isPublished !== undefined) {
      where.isPublished = filter.isPublished;
    } else {
      where.isPublished = true;
    }

    const searchTerm = filter.search || filter.q;
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { destination: { title: { contains: searchTerm, mode: 'insensitive' } } },
        { destination: { country: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    if (filter.destinationId) {
      where.destinationId = filter.destinationId;
    }

    if (filter.destinationSlug) {
      where.destination = { slug: filter.destinationSlug };
    }

    if (filter.category) {
      where.destination = {
        ...(where.destination as Prisma.DestinationWhereInput),
        category: filter.category,
      };
    }

    if (filter.difficulty) {
      where.difficulty = filter.difficulty;
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.basePrice = {
        ...(filter.minPrice !== undefined && { gte: new Prisma.Decimal(filter.minPrice) }),
        ...(filter.maxPrice !== undefined && { lte: new Prisma.Decimal(filter.maxPrice) }),
      };
    }

    if (filter.durationDays !== undefined) {
      where.durationDays = filter.durationDays;
    } else if (filter.minDuration !== undefined || filter.maxDuration !== undefined) {
      where.durationDays = {
        ...(filter.minDuration !== undefined && { gte: filter.minDuration }),
        ...(filter.maxDuration !== undefined && { lte: filter.maxDuration }),
      };
    }

    if (filter.hasAvailableSchedules) {
      where.schedules = {
        some: {
          status: ScheduleStatus.AVAILABLE,
          startDate: { gte: new Date() },
        },
      };
    }

    const orderBy: Prisma.TourPackageOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const [items, totalItems] = await Promise.all([
      prisma.tourPackage.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          destination: true,
          schedules: {
            where: {
              status: { in: [ScheduleStatus.AVAILABLE, ScheduleStatus.ALMOST_FULL] },
            },
            take: 3,
            orderBy: { startDate: 'asc' },
          },
        },
      }),
      prisma.tourPackage.count({ where }),
    ]);

    const formatted = items.map((tour) => this.formatTour(tour));
    return formatPaginatedResult(formatted, totalItems, page, pageSize);
  }

  /**
   * Retrieves single tour details by UUID or slug with schedules and destination.
   */
  static async getTourByIdOrSlug(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );

    const tour = await prisma.tourPackage.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        destination: true,
        schedules: {
          orderBy: { startDate: 'asc' },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!tour) {
      throw AppError.notFound(`Tour package '${idOrSlug}' was not found.`, 'TOUR_NOT_FOUND');
    }

    return {
      ...this.formatTour(tour),
      reviews: tour.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        isVerifiedBooking: r.isVerifiedBooking,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      })),
    };
  }

  /**
   * Creates a new tour package (Admin only).
   */
  static async createTour(input: CreateTourPackageInput): Promise<TourPackageDto> {
    const destination = await prisma.destination.findUnique({
      where: { id: input.destinationId },
    });
    if (!destination) {
      throw AppError.badRequest(
        `Destination with ID '${input.destinationId}' does not exist.`,
        undefined,
        'DESTINATION_NOT_FOUND'
      );
    }

    const baseSlug = input.slug || slugify(input.title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await prisma.tourPackage.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const created = await prisma.tourPackage.create({
      data: {
        destinationId: input.destinationId,
        title: input.title,
        slug: finalSlug,
        description: input.description,
        highlights: input.highlights || [],
        durationDays: input.durationDays,
        durationNights: input.durationNights ?? Math.max(0, input.durationDays - 1),
        basePrice: new Prisma.Decimal(input.basePrice),
        discountPrice: input.discountPrice ? new Prisma.Decimal(input.discountPrice) : null,
        maxGroupSize: input.maxGroupSize ?? 15,
        difficulty: input.difficulty ?? TourDifficulty.MODERATE,
        featuredImage: input.featuredImage,
        galleryImages: input.galleryImages || [],
        isPublished: input.isPublished ?? true,
      },
      include: {
        destination: true,
      },
    });

    return this.formatTour(created);
  }

  /**
   * Updates an existing tour package (Admin only).
   */
  static async updateTour(id: string, input: UpdateTourPackageInput): Promise<TourPackageDto> {
    const existing = await prisma.tourPackage.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound(`Tour package with ID '${id}' was not found.`, 'TOUR_NOT_FOUND');
    }

    if (input.destinationId) {
      const destination = await prisma.destination.findUnique({
        where: { id: input.destinationId },
      });
      if (!destination) {
        throw AppError.badRequest(
          `Destination with ID '${input.destinationId}' does not exist.`,
          undefined,
          'DESTINATION_NOT_FOUND'
        );
      }
    }

    let slug = input.slug;
    if (slug && slug !== existing.slug) {
      const conflict = await prisma.tourPackage.findUnique({ where: { slug } });
      if (conflict) {
        throw AppError.conflict(`Tour package slug '${slug}' is already in use.`, 'SLUG_CONFLICT');
      }
    }

    const updated = await prisma.tourPackage.update({
      where: { id },
      data: {
        ...(input.destinationId && { destinationId: input.destinationId }),
        ...(input.title && { title: input.title }),
        ...(slug && { slug }),
        ...(input.description && { description: input.description }),
        ...(input.highlights && { highlights: input.highlights }),
        ...(input.durationDays !== undefined && { durationDays: input.durationDays }),
        ...(input.durationNights !== undefined && { durationNights: input.durationNights }),
        ...(input.basePrice !== undefined && { basePrice: new Prisma.Decimal(input.basePrice) }),
        ...(input.discountPrice !== undefined && {
          discountPrice: input.discountPrice ? new Prisma.Decimal(input.discountPrice) : null,
        }),
        ...(input.maxGroupSize !== undefined && { maxGroupSize: input.maxGroupSize }),
        ...(input.difficulty && { difficulty: input.difficulty }),
        ...(input.featuredImage && { featuredImage: input.featuredImage }),
        ...(input.galleryImages && { galleryImages: input.galleryImages }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
      },
      include: {
        destination: true,
        schedules: true,
      },
    });

    return this.formatTour(updated);
  }

  /**
   * Deletes a tour package (Admin only).
   */
  static async deleteTour(id: string): Promise<void> {
    const existing = await prisma.tourPackage.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound(`Tour package with ID '${id}' was not found.`, 'TOUR_NOT_FOUND');
    }

    await prisma.tourPackage.delete({ where: { id } });
  }

  // =========================================================================
  // TOUR SCHEDULES & CAPACITY MANAGEMENT
  // =========================================================================

  /**
   * Lists upcoming schedules and capacity for a tour.
   */
  static async listSchedules(tourIdOrSlug: string): Promise<TourScheduleDto[]> {
    const tour = await this.resolveTour(tourIdOrSlug);
    const schedules = await prisma.tourSchedule.findMany({
      where: { tourPackageId: tour.id },
      orderBy: { startDate: 'asc' },
    });

    return schedules.map((s) => this.formatSchedule(s));
  }

  /**
   * Creates a schedule for a tour (Admin only).
   */
  static async createSchedule(
    tourIdOrSlug: string,
    input: CreateTourScheduleInput
  ): Promise<TourScheduleDto> {
    const tour = await this.resolveTour(tourIdOrSlug);

    const schedule = await prisma.tourSchedule.create({
      data: {
        tourPackageId: tour.id,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        price: new Prisma.Decimal(input.price),
        totalCapacity: input.totalCapacity,
        bookedCapacity: 0,
        status: input.status ?? ScheduleStatus.AVAILABLE,
      },
    });

    return this.formatSchedule(schedule);
  }

  /**
   * Updates an existing tour schedule and capacity (Admin only).
   */
  static async updateSchedule(
    scheduleId: string,
    input: UpdateTourScheduleInput
  ): Promise<TourScheduleDto> {
    const existing = await prisma.tourSchedule.findUnique({ where: { id: scheduleId } });
    if (!existing) {
      throw AppError.notFound(
        `Tour schedule with ID '${scheduleId}' was not found.`,
        'SCHEDULE_NOT_FOUND'
      );
    }

    const bookedCapacity = input.bookedCapacity ?? existing.bookedCapacity;
    const totalCapacity = input.totalCapacity ?? existing.totalCapacity;

    let computedStatus = input.status ?? existing.status;
    if (!input.status) {
      if (bookedCapacity >= totalCapacity) {
        computedStatus = ScheduleStatus.SOLD_OUT;
      } else if (bookedCapacity / totalCapacity >= 0.8) {
        computedStatus = ScheduleStatus.ALMOST_FULL;
      } else {
        computedStatus = ScheduleStatus.AVAILABLE;
      }
    }

    const updated = await prisma.tourSchedule.update({
      where: { id: scheduleId },
      data: {
        ...(input.startDate && { startDate: new Date(input.startDate) }),
        ...(input.endDate && { endDate: new Date(input.endDate) }),
        ...(input.price !== undefined && { price: new Prisma.Decimal(input.price) }),
        ...(input.totalCapacity !== undefined && { totalCapacity: input.totalCapacity }),
        ...(input.bookedCapacity !== undefined && { bookedCapacity: input.bookedCapacity }),
        status: computedStatus,
      },
    });

    return this.formatSchedule(updated);
  }

  /**
   * Deletes a tour schedule (Admin only).
   */
  static async deleteSchedule(scheduleId: string): Promise<void> {
    const existing = await prisma.tourSchedule.findUnique({ where: { id: scheduleId } });
    if (!existing) {
      throw AppError.notFound(
        `Tour schedule with ID '${scheduleId}' was not found.`,
        'SCHEDULE_NOT_FOUND'
      );
    }

    await prisma.tourSchedule.delete({ where: { id: scheduleId } });
  }

  // =========================================================================
  // FORMATTING HELPERS
  // =========================================================================

  private static async resolveTour(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );
    const tour = await prisma.tourPackage.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
    });
    if (!tour) {
      throw AppError.notFound(`Tour package '${idOrSlug}' was not found.`, 'TOUR_NOT_FOUND');
    }
    return tour;
  }

  private static formatTour(tour: {
    id: string;
    destinationId: string;
    title: string;
    slug: string;
    description: string;
    highlights: string[];
    durationDays: number;
    durationNights: number;
    basePrice: Prisma.Decimal;
    discountPrice: Prisma.Decimal | null;
    maxGroupSize: number;
    difficulty: TourDifficulty;
    featuredImage: string;
    galleryImages: string[];
    rating: number;
    reviewCount: number;
    isPublished: boolean;
    destination?: Destination;
    schedules?: Array<{
      id: string;
      tourPackageId: string;
      startDate: Date;
      endDate: Date;
      price: Prisma.Decimal;
      totalCapacity: number;
      bookedCapacity: number;
      status: ScheduleStatus;
    }>;
  }): TourPackageDto {
    return {
      id: tour.id,
      destinationId: tour.destinationId,
      title: tour.title,
      slug: tour.slug,
      description: tour.description,
      highlights: tour.highlights,
      durationDays: tour.durationDays,
      durationNights: tour.durationNights,
      basePrice: tour.basePrice.toString(),
      discountPrice: tour.discountPrice?.toString() ?? null,
      maxGroupSize: tour.maxGroupSize,
      difficulty: tour.difficulty,
      featuredImage: tour.featuredImage,
      galleryImages: tour.galleryImages,
      rating: tour.rating,
      reviewCount: tour.reviewCount,
      isPublished: tour.isPublished,
      schedules: tour.schedules?.map((s) => this.formatSchedule(s)),
      destination: tour.destination
        ? {
            id: tour.destination.id,
            title: tour.destination.title,
            slug: tour.destination.slug,
            description: tour.destination.description,
            shortDescription: tour.destination.shortDescription,
            country: tour.destination.country,
            city: tour.destination.city,
            location: tour.destination.location,
            latitude: tour.destination.latitude,
            longitude: tour.destination.longitude,
            category: tour.destination.category,
            imageUrl: tour.destination.imageUrl,
            galleryImages: tour.destination.galleryImages,
            rating: tour.destination.rating,
            reviewCount: tour.destination.reviewCount,
            isFeatured: tour.destination.isFeatured,
            createdAt: tour.destination.createdAt.toISOString(),
            updatedAt: tour.destination.updatedAt.toISOString(),
          }
        : undefined,
    };
  }

  private static formatSchedule(s: {
    id: string;
    tourPackageId: string;
    startDate: Date;
    endDate: Date;
    price: Prisma.Decimal;
    totalCapacity: number;
    bookedCapacity: number;
    status: ScheduleStatus;
  }): TourScheduleDto {
    return {
      id: s.id,
      tourPackageId: s.tourPackageId,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
      price: s.price.toString(),
      totalCapacity: s.totalCapacity,
      bookedCapacity: s.bookedCapacity,
      status: s.status,
    };
  }
}
