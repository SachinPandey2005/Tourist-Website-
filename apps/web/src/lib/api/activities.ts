import { apiClient } from './client.js';
import type { ActivityDto, PaginatedResult } from '@tourist/shared';

export interface ActivityFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  destinationId?: string;
  destinationSlug?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: 'price' | 'durationHours' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const activityApi = {
  list: (params?: ActivityFilterParams) =>
    apiClient.get<PaginatedResult<ActivityDto>>('/api/activities', { params: params as never }),
  getBySlugOrId: (idOrSlug: string) =>
    apiClient.get<ActivityDto>(`/api/activities/${idOrSlug}`),
  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/api/activities/${id}`),
};
