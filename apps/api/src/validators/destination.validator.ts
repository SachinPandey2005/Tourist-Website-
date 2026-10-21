import { z } from 'zod';
import { DestinationCategory } from '@prisma/client';

export const listDestinationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  q: z.string().trim().optional(),
  category: z.nativeEnum(DestinationCategory).optional(),
  region: z.string().trim().optional(),
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  isFeatured: z
    .enum(['true', 'false', '1', '0'])
    .transform((val) => val === 'true' || val === '1')
    .optional(),
  sortBy: z
    .enum(['title', 'rating', 'reviewCount', 'createdAt', 'country'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idOrSlugParamSchema = z.object({
  idOrSlug: z.string().min(1, 'Identifier or slug is required'),
});

export const createDestinationSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case alphanumeric with hyphens')
    .optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().trim().max(300).optional().nullable(),
  country: z.string().trim().min(2, 'Country must be at least 2 characters'),
  city: z.string().trim().optional().nullable(),
  location: z.string().trim().min(2, 'Location description must be at least 2 characters'),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  category: z.nativeEnum(DestinationCategory).default(DestinationCategory.CULTURAL),
  imageUrl: z.string().url('Image URL must be a valid URL'),
  galleryImages: z.array(z.string().url()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
});

export const updateDestinationSchema = createDestinationSchema.partial();
