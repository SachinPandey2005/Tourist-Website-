import { apiClient } from './client.js';
import type {
  PaginatedResult,
  BookingStatus,
  CheckAvailabilityInput,
  CheckAvailabilityResult,
  BookingQuoteInput,
  BookingQuoteResult,
} from '@tourist/shared';

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
  couponId?: string | null;
  idempotencyKey?: string | null;
  status: BookingStatus;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  specialRequests?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  isCancellable?: boolean;
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

export interface CreateBookingPayload {
  items: Array<{
    tourPackageId?: string;
    tourScheduleId?: string;
    hotelId?: string;
    activityId?: string;
    quantity: number;
    startDate?: string;
    endDate?: string;
  }>;
  specialRequests?: string;
  couponCode?: string;
  idempotencyKey?: string;
}

export const bookingsApi = {
  checkAvailability: async (payload: CheckAvailabilityInput): Promise<CheckAvailabilityResult> => {
    return apiClient.post<CheckAvailabilityResult>('/api/bookings/check-availability', payload);
  },

  getQuote: async (payload: BookingQuoteInput): Promise<BookingQuoteResult> => {
    return apiClient.post<BookingQuoteResult>('/api/bookings/quote', payload);
  },

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

  createBooking: async (
    payload: CreateBookingPayload,
    idempotencyKey?: string
  ): Promise<UserBookingRecord> => {
    const headers: Record<string, string> = {};
    const key = idempotencyKey || payload.idempotencyKey;
    if (key) {
      headers['Idempotency-Key'] = key;
    }

    return apiClient.post<UserBookingRecord>('/api/bookings', {
      ...payload,
      idempotencyKey: key,
    }, { headers });
  },
};
