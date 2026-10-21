import { Prisma, DestinationCategory, Destination } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import { parsePaginationParams, formatPaginatedResult } from '../utils/pagination.js';
import { slugify } from '../utils/slugify.js';
import type {
  CreateActivityInput,
  UpdateActivityInput,
  ActivityDto,
  PaginatedResult,
} from '@tourist/shared';

export interface ListActivitiesFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  q?: string;
  destinationId?: string;
  destinationSlug?: string;
  category?: DestinationCategory;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: 'price' | 'durationHours' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class ActivityService {
  /**
   * Retrieves a paginated list of activities with destination, category, price, and duration filters.
   */
  static async listActivities(filter: ListActivitiesFilter): Promise<PaginatedResult<ActivityDto>> {
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

    const where: Prisma.ActivityWhereInput = {};

    const searchTerm = filter.search || filter.q;
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
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

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {
        ...(filter.minPrice !== undefined && { gte: new Prisma.Decimal(filter.minPrice) }),
        ...(filter.maxPrice !== undefined && { lte: new Prisma.Decimal(filter.maxPrice) }),
      };
    }

    if (filter.minDuration !== undefined || filter.maxDuration !== undefined) {
      where.durationHours = {
        ...(filter.minDuration !== undefined && { gte: filter.minDuration }),
        ...(filter.maxDuration !== undefined && { lte: filter.maxDuration }),
      };
    }

    const orderBy: Prisma.ActivityOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const [items, totalItems] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { destination: true },
      }),
      prisma.activity.count({ where }),
    ]);

    const formatted = items.map((a) => this.formatActivity(a));
    return formatPaginatedResult(formatted, totalItems, page, pageSize);
  }

  /**
   * Retrieves single activity details by UUID or unique slug.
   */
  static async getActivityByIdOrSlug(idOrSlug: string): Promise<ActivityDto> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );

    const activity = await prisma.activity.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: { destination: true },
    });

    if (!activity) {
      throw AppError.notFound(
        `Activity with identifier '${idOrSlug}' was not found.`,
        'ACTIVITY_NOT_FOUND'
      );
    }

    return this.formatActivity(activity);
  }

  /**
   * Creates a new activity (Admin only).
   */
  static async createActivity(input: CreateActivityInput): Promise<ActivityDto> {
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

    const baseSlug = input.slug || slugify(input.name);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await prisma.activity.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const created = await prisma.activity.create({
      data: {
        destinationId: input.destinationId,
        name: input.name,
        slug: finalSlug,
        description: input.description,
        durationHours: input.durationHours,
        price: new Prisma.Decimal(input.price),
        imageUrl: input.imageUrl,
      },
      include: { destination: true },
    });

    return this.formatActivity(created);
  }

  /**
   * Updates an existing activity (Admin only).
   */
  static async updateActivity(id: string, input: UpdateActivityInput): Promise<ActivityDto> {
    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound(`Activity with ID '${id}' was not found.`, 'ACTIVITY_NOT_FOUND');
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
      const conflict = await prisma.activity.findUnique({ where: { slug } });
      if (conflict) {
        throw AppError.conflict(`Activity slug '${slug}' is already in use.`, 'SLUG_CONFLICT');
      }
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: {
        ...(input.destinationId && { destinationId: input.destinationId }),
        ...(input.name && { name: input.name }),
        ...(slug && { slug }),
        ...(input.description && { description: input.description }),
        ...(input.durationHours !== undefined && { durationHours: input.durationHours }),
        ...(input.price !== undefined && { price: new Prisma.Decimal(input.price) }),
        ...(input.imageUrl && { imageUrl: input.imageUrl }),
      },
      include: { destination: true },
    });

    return this.formatActivity(updated);
  }

  /**
   * Deletes an activity (Admin only).
   */
  static async deleteActivity(id: string): Promise<void> {
    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound(`Activity with ID '${id}' was not found.`, 'ACTIVITY_NOT_FOUND');
    }

    await prisma.activity.delete({ where: { id } });
  }

  private static formatActivity(a: {
    id: string;
    destinationId: string;
    name: string;
    slug: string;
    description: string;
    durationHours: number;
    price: Prisma.Decimal;
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
    destination?: Destination;
  }): ActivityDto {
    return {
      id: a.id,
      destinationId: a.destinationId,
      name: a.name,
      slug: a.slug,
      description: a.description,
      durationHours: a.durationHours,
      price: a.price.toString(),
      imageUrl: a.imageUrl,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      destination: a.destination
        ? {
            id: a.destination.id,
            title: a.destination.title,
            slug: a.destination.slug,
            description: a.destination.description,
            shortDescription: a.destination.shortDescription,
            country: a.destination.country,
            city: a.destination.city,
            location: a.destination.location,
            latitude: a.destination.latitude,
            longitude: a.destination.longitude,
            category: a.destination.category,
            imageUrl: a.destination.imageUrl,
            galleryImages: a.destination.galleryImages,
            rating: a.destination.rating,
            reviewCount: a.destination.reviewCount,
            isFeatured: a.destination.isFeatured,
            createdAt: a.destination.createdAt.toISOString(),
            updatedAt: a.destination.updatedAt.toISOString(),
          }
        : undefined,
    };
  }
}
