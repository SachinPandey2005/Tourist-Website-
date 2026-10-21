import { apiClient } from './client.js';
import type { HotelDto, PaginatedResult } from '@tourist/shared';

export interface HotelFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  destinationId?: string;
  destinationSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  starRating?: number;
  amenities?: string;
  sortBy?: 'pricePerNight' | 'starRating' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const hotelApi = {
  list: (params?: HotelFilterParams) =>
    apiClient.get<PaginatedResult<HotelDto>>('/api/hotels', { params: params as never }),
  getBySlugOrId: (idOrSlug: string) =>
    apiClient.get<HotelDto>(`/api/hotels/${idOrSlug}`),
  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/api/hotels/${id}`),
};
