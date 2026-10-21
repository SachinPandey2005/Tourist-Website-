import { apiClient } from './client.js';
import type { HealthCheckResponse } from '@tourist/shared';

export const healthApi = {
  check: () => apiClient.get<HealthCheckResponse>('/api/health'),
};
