import { apiClient } from './client.js';
import type { TourPackageDto, PaginatedResult } from '@tourist/shared';

export interface TourFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  destinationId?: string;
  category?: string;
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  durationDays?: number;
  hasAvailableSchedules?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const tourApi = {
  list: (params?: TourFilterParams) =>
    apiClient.get<PaginatedResult<TourPackageDto>>('/api/tours', { params: params as never }),
  getBySlugOrId: (idOrSlug: string) =>
    apiClient.get<TourPackageDto>(`/api/tours/${idOrSlug}`),
};
