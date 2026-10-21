import { z } from 'zod';
import { DestinationCategory } from '@prisma/client';

export const listActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  q: z.string().trim().optional(),
  destinationId: z.string().uuid().optional(),
  destinationSlug: z.string().trim().optional(),
  category: z.nativeEnum(DestinationCategory).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minDuration: z.coerce.number().positive().optional(),
  maxDuration: z.coerce.number().positive().optional(),
  sortBy: z
    .enum(['price', 'durationHours', 'name', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createActivitySchema = z.object({
  destinationId: z.string().uuid('destinationId must be a valid UUID'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case alphanumeric with hyphens')
    .optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  durationHours: z.coerce.number().positive('Duration must be a positive number of hours'),
  price: z.coerce.number().positive('Price must be a positive number'),
  imageUrl: z.string().url('Image URL must be a valid URL'),
});

export const updateActivitySchema = createActivitySchema.partial();
