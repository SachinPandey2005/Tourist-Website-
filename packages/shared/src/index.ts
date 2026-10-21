/**
 * @tourist/shared
 * Common contracts, types, and constants shared across API and Web applications.
 */

// =========================================================================
// API RESPONSE CONTRACTS
// =========================================================================

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorDetail;
  timestamp: string;
}

// =========================================================================
// HEALTH CHECK CONTRACT
// =========================================================================

export type ServiceStatus = 'healthy' | 'unhealthy' | 'degraded';
export type DatabaseStatus = 'connected' | 'disconnected' | 'pending';

export interface HealthCheckResponse {
  status: ServiceStatus;
  uptime: number;
  timestamp: string;
  environment: string;
  version: string;
  services: {
    api: ServiceStatus;
    database: DatabaseStatus;
  };
}

// =========================================================================
// CORE DOMAIN ENUMS
// =========================================================================

export type UserRole = 'ADMIN' | 'GUIDE' | 'TOURIST' | 'USER';

export type DestinationCategory =
  | 'BEACH'
  | 'MOUNTAIN'
  | 'HISTORICAL'
  | 'ADVENTURE'
  | 'URBAN'
  | 'CULTURAL'
  | 'NATURE'
  | 'WILDLIFE';

export type TourDifficulty = 'EASY' | 'MODERATE' | 'CHALLENGING' | 'DIFFICULT';

export type ScheduleStatus = 'AVAILABLE' | 'ALMOST_FULL' | 'SOLD_OUT' | 'CANCELLED';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

export type PaymentMethod =
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PAYPAL'
  | 'STRIPE'
  | 'BANK_TRANSFER';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

// =========================================================================
// DOMAIN DTO INTERFACES
// =========================================================================

export interface DestinationDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  country: string;
  city?: string | null;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  category: DestinationCategory;
  imageUrl: string;
  galleryImages: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TourScheduleDto {
  id: string;
  tourPackageId: string;
  startDate: string;
  endDate: string;
  price: string;
  totalCapacity: number;
  bookedCapacity: number;
  status: ScheduleStatus;
}

export interface TourPackageDto {
  id: string;
  destinationId: string;
  title: string;
  slug: string;
  description: string;
  highlights: string[];
  durationDays: number;
  durationNights: number;
  basePrice: string;
  discountPrice?: string | null;
  maxGroupSize: number;
  difficulty: TourDifficulty;
  featuredImage: string;
  galleryImages: string[];
  rating: number;
  reviewCount: number;
  isPublished: boolean;
  schedules?: TourScheduleDto[];
}

export interface BookingItemDto {
  id: string;
  bookingId: string;
  tourPackageId?: string | null;
  tourScheduleId?: string | null;
  hotelId?: string | null;
  activityId?: string | null;
  itemTitle: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface PaymentDto {
  id: string;
  paymentReference: string;
  bookingId: string;
  userId: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  paidAt?: string | null;
  createdAt: string;
}

export interface BookingDto {
  id: string;
  bookingReference: string;
  userId: string;
  couponId?: string | null;
  status: BookingStatus;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  items: BookingItemDto[];
  payments?: PaymentDto[];
  createdAt: string;
}

// =========================================================================
// PAGINATION
// =========================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// =========================================================================
// AUTHENTICATION & USER CONTRACTS
// =========================================================================

export interface AuthUserDto {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseData {
  user: AuthUserDto;
  token: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  name?: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
}

