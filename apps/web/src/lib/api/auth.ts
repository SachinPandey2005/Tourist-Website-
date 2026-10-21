import { apiClient } from './client.js';
import type {
  AuthUserDto,
  AuthResponseData,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from '@tourist/shared';

export const authApi = {
  getCurrentUser: async (): Promise<AuthUserDto> => {
    return apiClient.get<AuthUserDto>('/api/auth/me');
  },

  login: async (credentials: LoginInput): Promise<AuthResponseData> => {
    return apiClient.post<AuthResponseData>('/api/auth/login', credentials);
  },

  register: async (data: RegisterInput): Promise<AuthResponseData> => {
    return apiClient.post<AuthResponseData>('/api/auth/register', data);
  },

  logout: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/api/auth/logout');
  },

  updateProfile: async (data: UpdateProfileInput): Promise<AuthUserDto> => {
    return apiClient.patch<AuthUserDto>('/api/auth/profile', data);
  },

  changePassword: async (data: ChangePasswordInput): Promise<{ message: string; token: string }> => {
    return apiClient.post<{ message: string; token: string }>('/api/auth/change-password', data);
  },
};
