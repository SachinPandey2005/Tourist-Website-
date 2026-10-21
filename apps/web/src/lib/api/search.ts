import { destinationApi } from './destinations.js';
import { tourApi } from './tours.js';
import { hotelApi } from './hotels.js';
import { activityApi } from './activities.js';
import type { DestinationDto, TourPackageDto, HotelDto, ActivityDto } from '@tourist/shared';

export interface UniversalSearchParams {
  q?: string;
  category?: string;
  destinationId?: string;
  minPrice?: number;
  maxPrice?: number;
  difficulty?: string;
  starRating?: number;
  pageSize?: number;
}

export interface UniversalSearchResult {
  destinations: DestinationDto[];
  tours: TourPackageDto[];
  hotels: HotelDto[];
  activities: ActivityDto[];
  totalMatches: number;
}

export const searchApi = {
  universalSearch: async (params: UniversalSearchParams): Promise<UniversalSearchResult> => {
    const q = params.q?.trim();
    const pageSize = params.pageSize || 6;

    const [destRes, tourRes, hotelRes, actRes] = await Promise.allSettled([
      destinationApi.list({ search: q, category: params.category, pageSize }),
      tourApi.list({ search: q, category: params.category, difficulty: params.difficulty, minPrice: params.minPrice, maxPrice: params.maxPrice, pageSize }),
      hotelApi.list({ search: q, starRating: params.starRating, minPrice: params.minPrice, maxPrice: params.maxPrice, pageSize }),
      activityApi.list({ search: q, category: params.category, minPrice: params.minPrice, maxPrice: params.maxPrice, pageSize }),
    ]);

    const destinations = destRes.status === 'fulfilled' ? destRes.value.items ?? [] : [];
    const tours = tourRes.status === 'fulfilled' ? tourRes.value.items ?? [] : [];
    const hotels = hotelRes.status === 'fulfilled' ? hotelRes.value.items ?? [] : [];
    const activities = actRes.status === 'fulfilled' ? actRes.value.items ?? [] : [];

    const totalMatches =
      destinations.length + tours.length + hotels.length + activities.length;

    return {
      destinations,
      tours,
      hotels,
      activities,
      totalMatches,
    };
  },
};
