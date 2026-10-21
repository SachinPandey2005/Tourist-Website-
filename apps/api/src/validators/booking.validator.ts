import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const createBookingItemSchema = z.object({
  tourPackageId: z.string().uuid().optional(),
  tourScheduleId: z.string().uuid().optional(),
  hotelId: z.string().uuid().optional(),
  activityId: z.string().uuid().optional(),
  quantity: z.number().int().positive('Quantity must be at least 1').default(1),
  startDate: z.union([z.string(), z.date()]).optional(),
  endDate: z.union([z.string(), z.date()]).optional(),
  // unitPrice can be accepted optionally for backwards compatibility, but is strictly ignored/recalculated
  unitPrice: z.number().positive().optional(),
  itemTitle: z.string().optional(),
});

export const createBookingSchema = z.object({
  items: z.array(createBookingItemSchema).min(1, 'At least one travel item is required in a booking'),
  specialRequests: z.string().max(1000).optional(),
  couponCode: z.string().max(50).optional(),
  idempotencyKey: z.string().max(100).optional(),
});

export const checkAvailabilitySchema = z.object({
  items: z.array(createBookingItemSchema).min(1, 'At least one item is required to check availability'),
});

export const quoteBookingSchema = z.object({
  items: z.array(createBookingItemSchema).min(1, 'At least one item is required for a price quote'),
  couponCode: z.string().max(50).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(BookingStatus).optional(),
});
