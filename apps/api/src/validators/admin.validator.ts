import { z } from 'zod';
import { BookingStatus, UserRole, DiscountType, PaymentStatus } from '@prisma/client';

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const createCouponSchema = z.object({
  code: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive(),
  minBookingAmount: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().optional(),
});

export const listAdminBookingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  search: z.string().optional(),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
});
