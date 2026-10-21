import type { ApiResponse } from '@tourist/shared';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code = 'API_ERROR', statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

const getBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL || '';
};

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;

  let url = `${getBaseUrl()}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('voyagevista_token') : null;

  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...(restOptions.body ? { 'Content-Type': 'application/json' } : {}),
    ...(storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {}),
    ...(headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: defaultHeaders,
      credentials: 'include', // Support HttpOnly cookies for authentication
    });

    let json: ApiResponse<T> | null = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    if (!response.ok) {
      const errorCode = json?.error?.code || `HTTP_${response.status}`;
      const errorMessage = json?.error?.message || response.statusText || 'An unexpected error occurred';
      throw new ApiClientError(errorMessage, errorCode, response.status, json?.error?.details);
    }

    if (json && 'success' in json && json.success === false) {
      throw new ApiClientError(
        json.error?.message || 'Operation failed',
        json.error?.code || 'UNKNOWN_ERROR',
        response.status,
        json.error?.details
      );
    }

    return (json?.data as T) ?? (json as unknown as T);
  } catch (err: unknown) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network error';
    throw new ApiClientError(message, 'NETWORK_ERROR', 0);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
