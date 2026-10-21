import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';

export interface AddFavoriteInput {
  destinationId?: string;
  tourPackageId?: string;
}

export class FavoriteService {
  /**
   * Retrieves all saved favorite destinations and tours for an authenticated user.
   */
  static async listUserFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        destination: true,
        tourPackage: true,
      },
    });

    return favorites.map((fav) => ({
      id: fav.id,
      userId: fav.userId,
      createdAt: fav.createdAt.toISOString(),
      destination: fav.destination
        ? {
            id: fav.destination.id,
            title: fav.destination.title,
            slug: fav.destination.slug,
            imageUrl: fav.destination.imageUrl,
            category: fav.destination.category,
            location: fav.destination.location,
            rating: fav.destination.rating,
          }
        : null,
      tourPackage: fav.tourPackage
        ? {
            id: fav.tourPackage.id,
            title: fav.tourPackage.title,
            slug: fav.tourPackage.slug,
            featuredImage: fav.tourPackage.featuredImage,
            difficulty: fav.tourPackage.difficulty,
            durationDays: fav.tourPackage.durationDays,
            basePrice: Number(fav.tourPackage.basePrice).toFixed(2),
            discountPrice: fav.tourPackage.discountPrice
              ? Number(fav.tourPackage.discountPrice).toFixed(2)
              : null,
          }
        : null,
    }));
  }

  /**
   * Adds a destination or tour to user favorites.
   */
  static async addFavorite(userId: string, input: AddFavoriteInput) {
    if (!input.destinationId && !input.tourPackageId) {
      throw AppError.badRequest('Either destinationId or tourPackageId must be specified.');
    }

    if (input.destinationId) {
      const dest = await prisma.destination.findUnique({ where: { id: input.destinationId } });
      if (!dest) throw AppError.notFound('Destination not found.');

      const existing = await prisma.favorite.findUnique({
        where: {
          userId_destinationId: {
            userId,
            destinationId: input.destinationId,
          },
        },
      });

      if (existing) return existing;

      return await prisma.favorite.create({
        data: {
          userId,
          destinationId: input.destinationId,
        },
      });
    }

    if (input.tourPackageId) {
      const tour = await prisma.tourPackage.findUnique({ where: { id: input.tourPackageId } });
      if (!tour) throw AppError.notFound('Tour package not found.');

      const existing = await prisma.favorite.findUnique({
        where: {
          userId_tourPackageId: {
            userId,
            tourPackageId: input.tourPackageId,
          },
        },
      });

      if (existing) return existing;

      return await prisma.favorite.create({
        data: {
          userId,
          tourPackageId: input.tourPackageId,
        },
      });
    }

    throw AppError.badRequest('Either destinationId or tourPackageId must be specified.');
  }

  /**
   * Removes a favorite enforcing user ownership.
   */
  static async removeFavorite(userId: string, favoriteId: string) {
    const favorite = await prisma.favorite.findUnique({
      where: { id: favoriteId },
    });

    if (!favorite) {
      throw AppError.notFound('Favorite entry not found.');
    }

    if (favorite.userId !== userId) {
      throw AppError.forbidden('You cannot delete another user’s saved favorite.');
    }

    await prisma.favorite.delete({
      where: { id: favoriteId },
    });

    return { message: 'Favorite successfully removed.' };
  }
}
