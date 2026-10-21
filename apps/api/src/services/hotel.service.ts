import { Prisma, Destination } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import { parsePaginationParams, formatPaginatedResult } from '../utils/pagination.js';
import { slugify } from '../utils/slugify.js';
import type {
  CreateHotelInput,
  UpdateHotelInput,
  HotelDto,
  PaginatedResult,
} from '@tourist/shared';

export interface ListHotelsFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  q?: string;
  destinationId?: string;
  destinationSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  starRating?: number;
  amenities?: string;
  sortBy?: 'pricePerNight' | 'starRating' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class HotelService {
  /**
   * Retrieves a paginated list of accommodations with destination, price, star rating, and amenities filters.
   */
  static async listHotels(filter: ListHotelsFilter): Promise<PaginatedResult<HotelDto>> {
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

    const where: Prisma.HotelWhereInput = {};

    const searchTerm = filter.search || filter.q;
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } },
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

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.pricePerNight = {
        ...(filter.minPrice !== undefined && { gte: new Prisma.Decimal(filter.minPrice) }),
        ...(filter.maxPrice !== undefined && { lte: new Prisma.Decimal(filter.maxPrice) }),
      };
    }

    if (filter.starRating !== undefined) {
      where.starRating = { gte: filter.starRating };
    }

    if (filter.amenities) {
      const amenityList = filter.amenities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      if (amenityList.length > 0) {
        where.amenities = {
          hasSome: amenityList,
        };
      }
    }

    const orderBy: Prisma.HotelOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const [items, totalItems] = await Promise.all([
      prisma.hotel.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { destination: true },
      }),
      prisma.hotel.count({ where }),
    ]);

    const formatted = items.map((h) => this.formatHotel(h));
    return formatPaginatedResult(formatted, totalItems, page, pageSize);
  }

  /**
   * Retrieves single hotel details by UUID or unique slug.
   */
  static async getHotelByIdOrSlug(idOrSlug: string): Promise<HotelDto> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );

    const hotel = await prisma.hotel.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: { destination: true },
    });

    if (!hotel) {
      throw AppError.notFound(`Hotel with identifier '${idOrSlug}' was not found.`, 'HOTEL_NOT_FOUND');
    }

    return this.formatHotel(hotel);
  }

  /**
   * Creates a new accommodation option (Admin only).
   */
  static async createHotel(input: CreateHotelInput): Promise<HotelDto> {
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

    while (await prisma.hotel.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const created = await prisma.hotel.create({
      data: {
        destinationId: input.destinationId,
        name: input.name,
        slug: finalSlug,
        description: input.description,
        address: input.address,
        starRating: input.starRating ?? 3,
        pricePerNight: new Prisma.Decimal(input.pricePerNight),
        amenities: input.amenities || [],
        imageUrl: input.imageUrl,
      },
      include: { destination: true },
    });

    return this.formatHotel(created);
  }

  /**
   * Updates an existing hotel (Admin only).
   */
  static async updateHotel(id: string, input: UpdateHotelInput): Promise<HotelDto> {
    const existing = await prisma.hotel.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound(`Hotel with ID '${id}' was not found.`, 'HOTEL_NOT_FOUND');
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
      const conflict = await prisma.hotel.findUnique({ where: { slug } });
      if (conflict) {
        throw AppError.conflict(`Hotel slug '${slug}' is already in use.`, 'SLUG_CONFLICT');
      }
    }

    const updated = await prisma.hotel.update({
      where: { id },
      data: {
        ...(input.destinationId && { destinationId: input.destinationId }),
        ...(input.name && { name: input.name }),
        ...(slug && { slug }),
        ...(input.description && { description: input.description }),
        ...(input.address && { address: input.address }),
        ...(input.starRating !== undefined && { starRating: input.starRating }),
        ...(input.pricePerNight !== undefined && {
          pricePerNight: new Prisma.Decimal(input.pricePerNight),
        }),
        ...(input.amenities && { amenities: input.amenities }),
        ...(input.imageUrl && { imageUrl: input.imageUrl }),
      },
      include: { destination: true },
    });

    return this.formatHotel(updated);
  }

  /**
   * Deletes a hotel (Admin only).
   */
  static async deleteHotel(id: string): Promise<void> {
    const existing = await prisma.hotel.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound(`Hotel with ID '${id}' was not found.`, 'HOTEL_NOT_FOUND');
    }

    await prisma.hotel.delete({ where: { id } });
  }

  private static formatHotel(h: {
    id: string;
    destinationId: string;
    name: string;
    slug: string;
    description: string;
    address: string;
    starRating: number;
    pricePerNight: Prisma.Decimal;
    amenities: string[];
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
    destination?: Destination;
  }): HotelDto {
    return {
      id: h.id,
      destinationId: h.destinationId,
      name: h.name,
      slug: h.slug,
      description: h.description,
      address: h.address,
      starRating: h.starRating,
      pricePerNight: h.pricePerNight.toString(),
      amenities: h.amenities,
      imageUrl: h.imageUrl,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
      destination: h.destination
        ? {
            id: h.destination.id,
            title: h.destination.title,
            slug: h.destination.slug,
            description: h.destination.description,
            shortDescription: h.destination.shortDescription,
            country: h.destination.country,
            city: h.destination.city,
            location: h.destination.location,
            latitude: h.destination.latitude,
            longitude: h.destination.longitude,
            category: h.destination.category,
            imageUrl: h.destination.imageUrl,
            galleryImages: h.destination.galleryImages,
            rating: h.destination.rating,
            reviewCount: h.destination.reviewCount,
            isFeatured: h.destination.isFeatured,
            createdAt: h.destination.createdAt.toISOString(),
            updatedAt: h.destination.updatedAt.toISOString(),
          }
        : undefined,
    };
  }
}
