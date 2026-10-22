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
  destination?: DestinationDto;
}

export interface HotelDto {
  id: string;
  destinationId: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  starRating: number;
  pricePerNight: string;
  amenities: string[];
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  destination?: DestinationDto;
}

export interface ActivityDto {
  id: string;
  destinationId: string;
  name: string;
  slug: string;
  description: string;
  durationHours: number;
  price: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  destination?: DestinationDto;
}

export interface ReviewUserSummary {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ReviewDto {
  id: string;
  userId: string;
  destinationId?: string | null;
  tourPackageId?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  isVerifiedBooking: boolean;
  createdAt: string;
  updatedAt: string;
  user?: ReviewUserSummary;
}

export interface ReviewStatsDto {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
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
  gatewayTransactionId?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePaymentSessionInput {
  bookingId: string;
  method?: PaymentMethod;
}

export interface PaymentSessionResult {
  paymentId: string;
  paymentReference: string;
  clientSecret?: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  bookingId: string;
  bookingReference: string;
}

export interface ProcessPaymentInput {
  paymentId: string;
  paymentMethod: PaymentMethod;
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
}

export interface ProcessPaymentResult {
  success: boolean;
  paymentId: string;
  paymentReference: string;
  status: PaymentStatus;
  bookingStatus: BookingStatus;
  transactionId: string;
  message: string;
}

export interface PaymentWebhookPayload {
  event: 'payment_intent.succeeded' | 'payment_intent.payment_failed' | 'charge.refunded' | string;
  data: {
    paymentReference: string;
    gatewayTransactionId: string;
    amount?: string;
    currency?: string;
    status: string;
    reason?: string;
  };
  timestamp: string;
}

// Razorpay Payment Contracts
export interface CreateRazorpayOrderInput {
  bookingId: string;
  currency?: string;
}

export interface RazorpayOrderResult {
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  keyId: string;
  bookingId: string;
  bookingReference: string;
  customer: {
    name: string;
    email: string;
    contact?: string;
  };
}

export interface VerifyRazorpayPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  paymentId?: string;
  bookingId?: string;
}

export interface VerifyRazorpayPaymentResult {
  success: boolean;
  paymentId: string;
  paymentReference: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status: PaymentStatus;
  bookingStatus: BookingStatus;
  message: string;
}

export interface PaymentStatusResult {
  paymentId: string;
  paymentReference: string;
  gatewayTransactionId?: string | null;
  status: PaymentStatus;
  amount: string;
  currency: string;
  bookingId: string;
  bookingStatus: BookingStatus;
  bookingReference: string;
  isPaid: boolean;
  isCancellable: boolean;
  createdAt: string;
  paidAt?: string | null;
}

export interface BookingDto {
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
  items: BookingItemDto[];
  payments?: PaymentDto[];
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CheckAvailabilityItemInput {
  tourPackageId?: string;
  tourScheduleId?: string;
  hotelId?: string;
  activityId?: string;
  quantity: number;
  startDate?: string;
  endDate?: string;
}

export interface CheckAvailabilityInput {
  items: CheckAvailabilityItemInput[];
}

export interface AvailabilityItemResult {
  itemType: 'TOUR' | 'HOTEL' | 'ACTIVITY';
  itemId: string;
  itemTitle: string;
  isAvailable: boolean;
  availableCapacity?: number;
  requestedQuantity: number;
  unitPrice: string;
  totalPrice: string;
  message: string;
}

export interface CheckAvailabilityResult {
  isAvailable: boolean;
  items: AvailabilityItemResult[];
}

export interface BookingQuoteInput {
  items: CheckAvailabilityItemInput[];
  couponCode?: string;
}

export interface BookingQuoteItem {
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
  nights?: number;
}

export interface BookingQuoteResult {
  items: BookingQuoteItem[];
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  taxRatePercentage: number;
  totalAmount: string;
  currency: string;
  coupon?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: string;
    discountApplied: string;
    description?: string | null;
  };
}

export interface CreateBookingRequest {
  items: CheckAvailabilityItemInput[];
  specialRequests?: string;
  couponCode?: string;
  idempotencyKey?: string;
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

// =========================================================================
// DISCOVERY INPUT CONTRACTS (PHASE 5)
// =========================================================================

export interface CreateDestinationInput {
  title: string;
  slug?: string;
  description: string;
  shortDescription?: string | null;
  country: string;
  city?: string | null;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  category: DestinationCategory;
  imageUrl: string;
  galleryImages?: string[];
  isFeatured?: boolean;
}

export interface UpdateDestinationInput {
  title?: string;
  slug?: string;
  description?: string;
  shortDescription?: string | null;
  country?: string;
  city?: string | null;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  category?: DestinationCategory;
  imageUrl?: string;
  galleryImages?: string[];
  isFeatured?: boolean;
}

export interface CreateTourPackageInput {
  destinationId: string;
  title: string;
  slug?: string;
  description: string;
  highlights?: string[];
  durationDays: number;
  durationNights?: number;
  basePrice: number | string;
  discountPrice?: number | string | null;
  maxGroupSize?: number;
  difficulty?: TourDifficulty;
  featuredImage: string;
  galleryImages?: string[];
  isPublished?: boolean;
}

export interface UpdateTourPackageInput {
  destinationId?: string;
  title?: string;
  slug?: string;
  description?: string;
  highlights?: string[];
  durationDays?: number;
  durationNights?: number;
  basePrice?: number | string;
  discountPrice?: number | string | null;
  maxGroupSize?: number;
  difficulty?: TourDifficulty;
  featuredImage?: string;
  galleryImages?: string[];
  isPublished?: boolean;
}

export interface CreateTourScheduleInput {
  tourPackageId: string;
  startDate: string;
  endDate: string;
  price: number | string;
  totalCapacity: number;
  status?: ScheduleStatus;
}

export interface UpdateTourScheduleInput {
  startDate?: string;
  endDate?: string;
  price?: number | string;
  totalCapacity?: number;
  bookedCapacity?: number;
  status?: ScheduleStatus;
}

export interface CreateHotelInput {
  destinationId: string;
  name: string;
  slug?: string;
  description: string;
  address: string;
  starRating?: number;
  pricePerNight: number | string;
  amenities?: string[];
  imageUrl: string;
}

export interface UpdateHotelInput {
  destinationId?: string;
  name?: string;
  slug?: string;
  description?: string;
  address?: string;
  starRating?: number;
  pricePerNight?: number | string;
  amenities?: string[];
  imageUrl?: string;
}

export interface CreateActivityInput {
  destinationId: string;
  name: string;
  slug?: string;
  description: string;
  durationHours: number;
  price: number | string;
  imageUrl: string;
}

export interface UpdateActivityInput {
  destinationId?: string;
  name?: string;
  slug?: string;
  description?: string;
  durationHours?: number;
  price?: number | string;
  imageUrl?: string;
}

export interface CreateReviewInput {
  destinationId?: string;
  tourPackageId?: string;
  rating: number;
  title?: string;
  comment: string;
}

// =========================================================================
// FAVORITES CONTRACTS (PHASE 8)
// =========================================================================

export interface FavoriteDto {
  id: string;
  userId: string;
  createdAt: string;
  destination?: {
    id: string;
    title: string;
    slug: string;
    imageUrl: string;
    category: DestinationCategory;
    location: string;
    rating: number;
  } | null;
  tourPackage?: {
    id: string;
    title: string;
    slug: string;
    featuredImage: string;
    difficulty: TourDifficulty;
    durationDays: number;
    basePrice: string;
    discountPrice?: string | null;
  } | null;
}

// =========================================================================
// ADMIN DASHBOARD CONTRACTS (PHASE 8)
// =========================================================================

export interface AdminOverviewStatsDto {
  totalUsers: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  activeTours: number;
  totalDestinations: number;
  totalReviews: number;
  totalHotels: number;
  grossRevenue: string;
  currency: string;
  recentBookings: {
    id: string;
    bookingReference: string;
    userName: string;
    userEmail: string;
    totalAmount: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    createdAt: string;
  }[];
}

export interface CouponDto {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: string;
  minBookingAmount?: string | null;
  maxDiscountAmount?: string | null;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

