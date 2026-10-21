import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const createBookingItemSchema = z.object({
  tourPackageId: z.string().uuid().optional(),
  tourScheduleId: z.string().uuid().optional(),
  hotelId: z.string().uuid().optional(),
  activityId: z.string().uuid().optional(),
  itemTitle: z.string().min(1, 'Item title is required'),
  unitPrice: z.number().positive('Unit price must be positive'),
  quantity: z.number().int().positive().default(1),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
});

export const createBookingSchema = z.object({
  items: z.array(createBookingItemSchema).min(1, 'At least one item is required in a booking'),
  specialRequests: z.string().max(1000).optional(),
  couponCode: z.string().max(50).optional(),
});

export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(BookingStatus).optional(),
});
