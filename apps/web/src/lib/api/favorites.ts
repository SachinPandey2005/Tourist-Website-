import { apiClient } from './client.js';
import type { FavoriteDto } from '@tourist/shared';

export const favoritesApi = {
  getMyFavorites: async (): Promise<FavoriteDto[]> => {
    return apiClient.get<FavoriteDto[]>('/api/favorites');
  },

  addFavorite: async (data: { destinationId?: string; tourPackageId?: string }): Promise<FavoriteDto> => {
    return apiClient.post<FavoriteDto>('/api/favorites', data);
  },

  removeFavorite: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/favorites/${id}`);
  },
};
