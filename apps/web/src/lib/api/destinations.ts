import { apiClient } from './client.js';
import type { DestinationDto, PaginatedResult } from '@tourist/shared';

export interface DestinationFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  region?: string;
  country?: string;
  isFeatured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const destinationApi = {
  list: (params?: DestinationFilterParams) =>
    apiClient.get<PaginatedResult<DestinationDto>>('/api/destinations', { params: params as never }),
  getBySlugOrId: (idOrSlug: string) =>
    apiClient.get<DestinationDto & { tours: unknown[]; hotels: unknown[]; activities: unknown[] }>(
      `/api/destinations/${idOrSlug}`
    ),
};
