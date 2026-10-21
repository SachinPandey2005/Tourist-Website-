import { apiClient } from './client.js';
import type {
  AdminOverviewStatsDto,
  CouponDto,
  PaginatedResult,
  BookingStatus,
  UserRole,
  PaymentStatus,
  DiscountType,
} from '@tourist/shared';

export interface AdminBookingItem {
  id: string;
  bookingReference: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  totalAmount: string;
  status: BookingStatus;
  paymentStatus: string;
  itemCount: number;
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber?: string | null;
  isEmailVerified: boolean;
  bookingCount: number;
  reviewCount: number;
  createdAt: string;
}

export interface AdminPaymentItem {
  id: string;
  paymentReference: string;
  bookingReference?: string;
  userName?: string;
  userEmail?: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  method: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  startDate: string;
  endDate: string;
}

export const adminApi = {
  getOverviewStats: async (): Promise<AdminOverviewStatsDto> => {
    return apiClient.get<AdminOverviewStatsDto>('/api/admin/stats');
  },

  getAdminBookings: async (params?: {
    page?: number;
    pageSize?: number;
    status?: BookingStatus;
    search?: string;
  }): Promise<PaginatedResult<AdminBookingItem>> => {
    return apiClient.get<PaginatedResult<AdminBookingItem>>('/api/admin/bookings', {
      params: params as Record<string, string | number | boolean>,
    });
  },

  updateBookingStatus: async (
    bookingId: string,
    status: BookingStatus
  ): Promise<{ id: string; bookingReference: string; status: BookingStatus; updatedAt: string }> => {
    return apiClient.patch(`/api/admin/bookings/${bookingId}/status`, { status });
  },

  getAdminUsers: async (params?: {
    page?: number;
    pageSize?: number;
    role?: UserRole;
    search?: string;
  }): Promise<PaginatedResult<AdminUserItem>> => {
    return apiClient.get<PaginatedResult<AdminUserItem>>('/api/admin/users', {
      params: params as Record<string, string | number | boolean>,
    });
  },

  updateUserRole: async (
    userId: string,
    role: UserRole
  ): Promise<{ id: string; name: string; email: string; role: UserRole }> => {
    return apiClient.patch(`/api/admin/users/${userId}/role`, { role });
  },

  getAdminPayments: async (params?: {
    page?: number;
    pageSize?: number;
    status?: PaymentStatus;
  }): Promise<PaginatedResult<AdminPaymentItem>> => {
    return apiClient.get<PaginatedResult<AdminPaymentItem>>('/api/admin/payments', {
      params: params as Record<string, string | number | boolean>,
    });
  },

  refundPayment: async (
    paymentId: string
  ): Promise<{ id: string; paymentReference: string; status: PaymentStatus; message: string }> => {
    return apiClient.post(`/api/admin/payments/${paymentId}/refund`);
  },

  getAdminCoupons: async (): Promise<CouponDto[]> => {
    return apiClient.get<CouponDto[]>('/api/admin/coupons');
  },

  createCoupon: async (payload: CreateCouponPayload): Promise<CouponDto> => {
    return apiClient.post<CouponDto>('/api/admin/coupons', payload);
  },

  deleteCoupon: async (couponId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/admin/coupons/${couponId}`);
  },
};
