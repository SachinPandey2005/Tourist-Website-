import { Prisma, DestinationCategory } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import { parsePaginationParams, formatPaginatedResult } from '../utils/pagination.js';
import { slugify } from '../utils/slugify.js';
import type {
  CreateDestinationInput,
  UpdateDestinationInput,
  DestinationDto,
  PaginatedResult,
} from '@tourist/shared';

export interface ListDestinationsFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  q?: string;
  category?: DestinationCategory;
  region?: string;
  country?: string;
  city?: string;
  isFeatured?: boolean;
  sortBy?: 'title' | 'rating' | 'reviewCount' | 'createdAt' | 'country';
  sortOrder?: 'asc' | 'desc';
}

export class DestinationService {
  /**
   * Retrieves a paginated and filtered list of destinations.
   */
  static async listDestinations(
    filter: ListDestinationsFilter
  ): Promise<PaginatedResult<DestinationDto>> {
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

    const where: Prisma.DestinationWhereInput = {};

    const searchTerm = filter.search || filter.q;
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } },
        { country: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (filter.category) {
      where.category = filter.category;
    }

    if (filter.region) {
      where.OR = [
        ...(where.OR || []),
        { location: { contains: filter.region, mode: 'insensitive' } },
        { country: { contains: filter.region, mode: 'insensitive' } },
        { city: { contains: filter.region, mode: 'insensitive' } },
      ];
    }

    if (filter.country) {
      where.country = { contains: filter.country, mode: 'insensitive' };
    }

    if (filter.city) {
      where.city = { contains: filter.city, mode: 'insensitive' };
    }

    if (filter.isFeatured !== undefined) {
      where.isFeatured = filter.isFeatured;
    }

    const orderBy: Prisma.DestinationOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const [items, totalItems] = await Promise.all([
      prisma.destination.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.destination.count({ where }),
    ]);

    const formattedItems = items.map((d) => this.formatDestination(d));
    return formatPaginatedResult(formattedItems, totalItems, page, pageSize);
  }

  /**
   * Retrieves a single destination by its UUID or unique slug.
   */
  static async getDestinationByIdOrSlug(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );

    const destination = await prisma.destination.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        tours: {
          where: { isPublished: true },
          take: 6,
          select: {
            id: true,
            title: true,
            slug: true,
            basePrice: true,
            discountPrice: true,
            durationDays: true,
            rating: true,
            reviewCount: true,
            featuredImage: true,
          },
        },
        hotels: {
          take: 4,
          select: {
            id: true,
            name: true,
            slug: true,
            starRating: true,
            pricePerNight: true,
            imageUrl: true,
            address: true,
          },
        },
        activities: {
          take: 4,
          select: {
            id: true,
            name: true,
            slug: true,
            durationHours: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!destination) {
      throw AppError.notFound(
        `Destination with identifier '${idOrSlug}' was not found.`,
        'DESTINATION_NOT_FOUND'
      );
    }

    return {
      ...this.formatDestination(destination),
      tours: destination.tours.map((t) => ({
        ...t,
        basePrice: t.basePrice.toString(),
        discountPrice: t.discountPrice?.toString() ?? null,
      })),
      hotels: destination.hotels.map((h) => ({
        ...h,
        pricePerNight: h.pricePerNight.toString(),
      })),
      activities: destination.activities.map((a) => ({
        ...a,
        price: a.price.toString(),
      })),
    };
  }

  /**
   * Creates a new destination (Admin only).
   */
  static async createDestination(input: CreateDestinationInput): Promise<DestinationDto> {
    const baseSlug = input.slug || slugify(input.title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await prisma.destination.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const destination = await prisma.destination.create({
      data: {
        title: input.title,
        slug: finalSlug,
        description: input.description,
        shortDescription: input.shortDescription,
        country: input.country,
        city: input.city,
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        category: input.category,
        imageUrl: input.imageUrl,
        galleryImages: input.galleryImages || [],
        isFeatured: input.isFeatured ?? false,
      },
    });

    return this.formatDestination(destination);
  }

  /**
   * Updates an existing destination (Admin only).
   */
  static async updateDestination(
    id: string,
    input: UpdateDestinationInput
  ): Promise<DestinationDto> {
    const existing = await prisma.destination.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound(`Destination with ID '${id}' was not found.`, 'DESTINATION_NOT_FOUND');
    }

    let slug = input.slug;
    if (slug && slug !== existing.slug) {
      const conflict = await prisma.destination.findUnique({ where: { slug } });
      if (conflict) {
        throw AppError.conflict(`Destination slug '${slug}' is already in use.`, 'SLUG_CONFLICT');
      }
    }

    const updated = await prisma.destination.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(slug && { slug }),
        ...(input.description && { description: input.description }),
        ...(input.shortDescription !== undefined && { shortDescription: input.shortDescription }),
        ...(input.country && { country: input.country }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.location && { location: input.location }),
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
        ...(input.category && { category: input.category }),
        ...(input.imageUrl && { imageUrl: input.imageUrl }),
        ...(input.galleryImages && { galleryImages: input.galleryImages }),
        ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
      },
    });

    return this.formatDestination(updated);
  }

  /**
   * Deletes a destination by ID (Admin only).
   */
  static async deleteDestination(id: string): Promise<void> {
    const existing = await prisma.destination.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound(`Destination with ID '${id}' was not found.`, 'DESTINATION_NOT_FOUND');
    }

    await prisma.destination.delete({ where: { id } });
  }

  /**
   * Formats a raw Prisma Destination record into a DestinationDto.
   */
  private static formatDestination(d: {
    id: string;
    title: string;
    slug: string;
    description: string;
    shortDescription: string | null;
    country: string;
    city: string | null;
    location: string;
    latitude: number | null;
    longitude: number | null;
    category: DestinationCategory;
    imageUrl: string;
    galleryImages: string[];
    rating: number;
    reviewCount: number;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): DestinationDto {
    return {
      id: d.id,
      title: d.title,
      slug: d.slug,
      description: d.description,
      shortDescription: d.shortDescription,
      country: d.country,
      city: d.city,
      location: d.location,
      latitude: d.latitude,
      longitude: d.longitude,
      category: d.category,
      imageUrl: d.imageUrl,
      galleryImages: d.galleryImages,
      rating: d.rating,
      reviewCount: d.reviewCount,
      isFeatured: d.isFeatured,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }
}
