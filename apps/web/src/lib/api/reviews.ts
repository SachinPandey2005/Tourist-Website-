import { apiClient } from './client.js';
import type { ReviewDto, ReviewStatsDto, PaginatedResult } from '@tourist/shared';

export interface ReviewFilterParams {
  page?: number;
  pageSize?: number;
  destinationId?: string;
  tourPackageId?: string;
  rating?: number;
  isVerifiedBooking?: boolean;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface ReviewStatsParams {
  destinationId?: string;
  tourPackageId?: string;
}

export const reviewApi = {
  list: (params?: ReviewFilterParams) =>
    apiClient.get<PaginatedResult<ReviewDto>>('/api/reviews', { params: params as never }),
  getStats: (params: ReviewStatsParams) =>
    apiClient.get<ReviewStatsDto>('/api/reviews/stats', { params: params as never }),
};
