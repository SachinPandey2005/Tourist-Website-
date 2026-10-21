import { z } from 'zod';
import { TourDifficulty, ScheduleStatus, DestinationCategory } from '@prisma/client';

export const listToursQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  q: z.string().trim().optional(),
  destinationId: z.string().uuid().optional(),
  destinationSlug: z.string().trim().optional(),
  category: z.nativeEnum(DestinationCategory).optional(),
  difficulty: z.nativeEnum(TourDifficulty).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  durationDays: z.coerce.number().int().positive().optional(),
  minDuration: z.coerce.number().int().positive().optional(),
  maxDuration: z.coerce.number().int().positive().optional(),
  hasAvailableSchedules: z
    .enum(['true', 'false', '1', '0'])
    .transform((val) => val === 'true' || val === '1')
    .optional(),
  isPublished: z
    .enum(['true', 'false', '1', '0'])
    .transform((val) => val === 'true' || val === '1')
    .optional(),
  sortBy: z
    .enum(['basePrice', 'rating', 'reviewCount', 'durationDays', 'createdAt', 'title'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createTourPackageSchema = z.object({
  destinationId: z.string().uuid('destinationId must be a valid UUID'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case alphanumeric with hyphens')
    .optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  highlights: z.array(z.string().trim()).optional().default([]),
  durationDays: z.coerce.number().int().min(1, 'Duration must be at least 1 day'),
  durationNights: z.coerce.number().int().min(0).default(0),
  basePrice: z.coerce.number().positive('Base price must be a positive number'),
  discountPrice: z.coerce.number().positive().optional().nullable(),
  maxGroupSize: z.coerce.number().int().min(1).default(15),
  difficulty: z.nativeEnum(TourDifficulty).default(TourDifficulty.MODERATE),
  featuredImage: z.string().url('Featured image must be a valid URL'),
  galleryImages: z.array(z.string().url()).optional().default([]),
  isPublished: z.boolean().optional().default(true),
});

export const updateTourPackageSchema = createTourPackageSchema.partial();

export const createTourScheduleSchema = z
  .object({
    startDate: z.string().datetime({ message: 'startDate must be an ISO-8601 datetime' }),
    endDate: z.string().datetime({ message: 'endDate must be an ISO-8601 datetime' }),
    price: z.coerce.number().positive('Price must be a positive number'),
    totalCapacity: z.coerce.number().int().min(1, 'Total capacity must be at least 1'),
    status: z.nativeEnum(ScheduleStatus).default(ScheduleStatus.AVAILABLE),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });

export const updateTourScheduleSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  price: z.coerce.number().positive().optional(),
  totalCapacity: z.coerce.number().int().min(1).optional(),
  bookedCapacity: z.coerce.number().int().min(0).optional(),
  status: z.nativeEnum(ScheduleStatus).optional(),
});

export const tourScheduleParamsSchema = z.object({
  tourId: z.string().min(1, 'tourId is required'),
  scheduleId: z.string().uuid('scheduleId must be a valid UUID').optional(),
});
