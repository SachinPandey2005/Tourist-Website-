import { apiClient } from './client.js';
import type { PaginatedResult, BookingStatus } from '@tourist/shared';

export interface BookingTourSchedule {
  id: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface BookingItemDetail {
  id: string;
  itemTitle: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
  startDate?: string | null;
  endDate?: string | null;
  tourPackage?: {
    id: string;
    title: string;
    slug: string;
    featuredImage: string;
  } | null;
  tourSchedule?: BookingTourSchedule | null;
  hotel?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
  } | null;
  activity?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
  } | null;
}

export interface BookingPaymentDetail {
  id: string;
  paymentReference: string;
  amount: string;
  currency: string;
  status: string;
  method: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface UserBookingRecord {
  id: string;
  bookingReference: string;
  userId: string;
  status: BookingStatus;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  specialRequests?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  items: BookingItemDetail[];
  payments: BookingPaymentDetail[];
}

export interface ListBookingsParams {
  page?: number;
  pageSize?: number;
  status?: BookingStatus;
}

export const bookingsApi = {
  getMyBookings: async (params?: ListBookingsParams): Promise<PaginatedResult<UserBookingRecord>> => {
    return apiClient.get<PaginatedResult<UserBookingRecord>>('/api/bookings', {
      params: params as Record<string, string | number | boolean>,
    });
  },

  getBookingDetails: async (id: string): Promise<UserBookingRecord> => {
    return apiClient.get<UserBookingRecord>(`/api/bookings/${id}`);
  },

  cancelBooking: async (id: string, reason?: string): Promise<UserBookingRecord> => {
    return apiClient.post<UserBookingRecord>(`/api/bookings/${id}/cancel`, { reason });
  },

  createBooking: async (payload: {
    items: Array<{
      tourPackageId?: string;
      tourScheduleId?: string;
      hotelId?: string;
      activityId?: string;
      itemTitle: string;
      unitPrice: number;
      quantity?: number;
      startDate?: string;
      endDate?: string;
    }>;
    specialRequests?: string;
    couponCode?: string;
  }): Promise<UserBookingRecord> => {
    return apiClient.post<UserBookingRecord>('/api/bookings', payload);
  },
};
