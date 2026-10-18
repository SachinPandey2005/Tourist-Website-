/**
 * @tourist/shared
 * Common contracts, types, and constants shared across API and Web applications.
 */

// API Response Contracts
export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorDetail;
  timestamp: string;
}

// Health Check Contract
export type ServiceStatus = 'healthy' | 'unhealthy' | 'degraded';
export type DatabaseStatus = 'connected' | 'disconnected' | 'pending';

export interface HealthCheckResponse {
  status: ServiceStatus;
  uptime: number;
  timestamp: string;
  environment: string;
  version: string;
  services: {
    api: ServiceStatus;
    database: DatabaseStatus;
  };
}

// Core Tourism Domain Types
export type UserRole = 'ADMIN' | 'GUIDE' | 'TOURIST';

export type DestinationCategory =
  | 'BEACH'
  | 'MOUNTAIN'
  | 'HISTORICAL'
  | 'ADVENTURE'
  | 'URBAN'
  | 'CULTURAL'
  | 'NATURE';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
