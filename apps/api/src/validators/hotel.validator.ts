import { z } from 'zod';

export const listHotelsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  q: z.string().trim().optional(),
  destinationId: z.string().uuid().optional(),
  destinationSlug: z.string().trim().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  starRating: z.coerce.number().int().min(1).max(5).optional(),
  amenities: z.string().trim().optional(),
  sortBy: z
    .enum(['pricePerNight', 'starRating', 'name', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createHotelSchema = z.object({
  destinationId: z.string().uuid('destinationId must be a valid UUID'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case alphanumeric with hyphens')
    .optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  address: z.string().trim().min(3, 'Address must be at least 3 characters'),
  starRating: z.coerce.number().int().min(1).max(5).default(3),
  pricePerNight: z.coerce.number().positive('Price per night must be a positive number'),
  amenities: z.array(z.string().trim()).optional().default([]),
  imageUrl: z.string().url('Image URL must be a valid URL'),
});

export const updateHotelSchema = createHotelSchema.partial();
