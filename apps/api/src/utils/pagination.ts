import type { PaginationParams, PaginatedResult } from '@tourist/shared';

export interface PaginationOptions {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Normalizes query parameters into safe integer skip/take pagination boundaries.
 */
export function parsePaginationParams(
  query: PaginationParams,
  defaultPageSize = 10,
  maxPageSize = 100
): PaginationOptions {
  const pageNumber = Math.max(1, Number(query.page) || 1);
  const rawPageSize = Number(query.pageSize) || defaultPageSize;
  const pageSize = Math.min(Math.max(1, rawPageSize), maxPageSize);
  const skip = (pageNumber - 1) * pageSize;
  const sortOrder = query.sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc';

  return {
    page: pageNumber,
    pageSize,
    skip,
    take: pageSize,
    sortBy: query.sortBy,
    sortOrder,
  };
}

/**
 * Builds standard pagination metadata and links.
 */
export function buildPaginationMeta(
  totalItems: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Packages items and metadata into a PaginatedResult.
 */
export function formatPaginatedResult<T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number
): PaginatedResult<T> & { meta: PaginationMeta } {
  const meta = buildPaginationMeta(totalItems, page, pageSize);

  return {
    items,
    pagination: {
      page: meta.page,
      pageSize: meta.pageSize,
      totalItems: meta.totalItems,
      totalPages: meta.totalPages,
    },
    meta,
  };
}
