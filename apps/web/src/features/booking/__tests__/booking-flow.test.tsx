import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext.js';
import { BookingPage } from '../BookingPage.js';
import { BookingConfirmationPage } from '../BookingConfirmationPage.js';
import { bookingsApi, UserBookingRecord } from '../../../lib/api/bookings.js';
import { tourApi } from '../../../lib/api/tours.js';
import { authApi } from '../../../lib/api/auth.js';
import { UserRole, TourDifficulty } from '@tourist/shared';

describe('Phase 9 Frontend: Booking & Availability Flow Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const mockUser = {
    id: 'user-alice-01',
    name: 'Alice Traveler',
    email: 'alice@example.com',
    role: 'TOURIST' as UserRole,
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTour = {
    id: 'tour-everest-01',
    destinationId: 'dest-nepal-01',
    title: 'Everest Alpine Base Circuit',
    slug: 'everest-alpine-base-circuit',
    description: 'High altitude guided Himalayan adventure.',
    highlights: ['Alpine ridge views'],
    basePrice: '1500.00',
    discountPrice: '1200.00',
    durationDays: 12,
    durationNights: 11,
    difficulty: 'CHALLENGING' as TourDifficulty,
    maxGroupSize: 10,
    featuredImage: 'https://images.unsplash.com/everest.jpg',
    galleryImages: [],
    rating: 4.95,
    reviewCount: 30,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schedules: [
      {
        id: 'sched-01',
        tourPackageId: 'tour-everest-01',
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-11-13T00:00:00.000Z',
        price: '1200.00',
        totalCapacity: 10,
        bookedCapacity: 4,
        status: 'AVAILABLE' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  const mockQuoteResponse = {
    items: [
      {
        tourPackageId: 'tour-everest-01',
        tourScheduleId: 'sched-01',
        hotelId: null,
        activityId: null,
        itemTitle: 'Everest Alpine Base Circuit (2026-11-01 to 2026-11-13)',
        unitPrice: '1200.00',
        quantity: 1,
        totalPrice: '1200.00',
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-11-13T00:00:00.000Z',
      },
    ],
    subtotal: '1200.00',
    discountAmount: '0.00',
    taxAmount: '120.00',
    taxRatePercentage: 10,
    totalAmount: '1320.00',
    currency: 'USD',
  };

  const mockPendingBookingRecord: UserBookingRecord = {
    id: 'booking-res-001',
    bookingReference: 'VV-EV-2026-999',
    userId: mockUser.id,
    couponId: null,
    idempotencyKey: 'idemp-test-01',
    status: 'PENDING',
    subtotal: '1200.00',
    discountAmount: '0.00',
    taxAmount: '120.00',
    totalAmount: '1320.00',
    currency: 'USD',
    specialRequests: 'Window seat please',
    cancellationReason: null,
    cancelledAt: null,
    isCancellable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: mockUser,
    items: [
      {
        id: 'item-1',
        itemTitle: 'Everest Alpine Base Circuit (2026-11-01 to 2026-11-13)',
        unitPrice: '1200.00',
        quantity: 1,
        totalPrice: '1200.00',
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-11-13T00:00:00.000Z',
      },
    ],
    payments: [
      {
        id: 'pay-1',
        paymentReference: 'PAY-VV-001',
        amount: '1320.00',
        currency: 'USD',
        status: 'PENDING',
        method: 'CREDIT_CARD',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  it('renders booking page, checks server availability, and displays server-calculated quote', async () => {
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser);
    vi.spyOn(tourApi, 'getBySlugOrId').mockResolvedValue(mockTour);
    vi.spyOn(bookingsApi, 'checkAvailability').mockResolvedValue({
      isAvailable: true,
      items: [
        {
          itemType: 'TOUR',
          itemId: 'sched-01',
          itemTitle: 'Everest Alpine Base Circuit',
          isAvailable: true,
          availableCapacity: 6,
          requestedQuantity: 1,
          unitPrice: '1200.00',
          totalPrice: '1200.00',
          message: 'Available (6 spots remaining)',
        },
      ],
    });
    vi.spyOn(bookingsApi, 'getQuote').mockResolvedValue(mockQuoteResponse);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/book?tourId=tour-everest-01&scheduleId=sched-01']}>
          <AuthProvider>
            <Routes>
              <Route path="/book" element={<BookingPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Everest Alpine Base Circuit')).toBeInTheDocument();
    expect(screen.getByText('Complete Your Travel Reservation')).toBeInTheDocument();
    expect(screen.getByText('Available (6 spots remaining)')).toBeInTheDocument();
    // Verify server-calculated quote display ($1,320)
    expect(screen.getAllByText('$1,320').length).toBeGreaterThan(0);
  });

  it('creates a pending booking and redirects to booking confirmation', async () => {
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser);
    vi.spyOn(tourApi, 'getBySlugOrId').mockResolvedValue(mockTour);
    vi.spyOn(bookingsApi, 'checkAvailability').mockResolvedValue({
      isAvailable: true,
      items: [
        {
          itemType: 'TOUR',
          itemId: 'sched-01',
          itemTitle: 'Everest Alpine Base Circuit',
          isAvailable: true,
          availableCapacity: 6,
          requestedQuantity: 1,
          unitPrice: '1200.00',
          totalPrice: '1200.00',
          message: 'Available (6 spots remaining)',
        },
      ],
    });
    vi.spyOn(bookingsApi, 'getQuote').mockResolvedValue(mockQuoteResponse);
    vi.spyOn(bookingsApi, 'createBooking').mockResolvedValue(mockPendingBookingRecord);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/book?tourId=tour-everest-01&scheduleId=sched-01']}>
          <AuthProvider>
            <Routes>
              <Route path="/book" element={<BookingPage />} />
              <Route
                path="/booking/confirmation"
                element={<div>BOOKING_CONFIRMATION_VIEW</div>}
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    const submitBtn = screen.getByRole('button', {
      name: /Confirm & Create Reservation/i,
    });
    expect(submitBtn).toBeEnabled();

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(bookingsApi.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            tourPackageId: 'tour-everest-01',
            tourScheduleId: 'sched-01',
            quantity: 1,
          }),
        ],
      }),
      expect.any(String)
    );

    expect(screen.getByText('BOOKING_CONFIRMATION_VIEW')).toBeInTheDocument();
  });

  it('BookingConfirmationPage displays verified booking reference, pending status, and cancellation flow', async () => {
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser);
    vi.spyOn(bookingsApi, 'getBookingDetails').mockResolvedValue(mockPendingBookingRecord);

    const cancelledRecord: UserBookingRecord = {
      ...mockPendingBookingRecord,
      status: 'CANCELLED',
      cancellationReason: 'Traveler change of plans',
      isCancellable: false,
    };
    vi.spyOn(bookingsApi, 'cancelBooking').mockResolvedValue(cancelledRecord);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={[`/booking/confirmation?bookingId=${mockPendingBookingRecord.id}`]}>
          <AuthProvider>
            <Routes>
              <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('VV-EV-2026-999')).toBeInTheDocument();
    expect(screen.getAllByText('PENDING').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Inventory Hold Successfully Created')).toBeInTheDocument();
    expect(screen.getByText(/Awaiting Phase 10 payment processing/i)).toBeInTheDocument();

    // Cancellation Action
    const cancelBtn = screen.getByRole('button', { name: /Cancel This Reservation/i });
    expect(cancelBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    // Confirmation modal should appear
    expect(screen.getByText('Cancel This Travel Reservation?')).toBeInTheDocument();
    const confirmCancelBtn = screen.getByRole('button', {
      name: /Yes, Cancel Reservation/i,
    });

    await act(async () => {
      fireEvent.click(confirmCancelBtn);
    });

    expect(bookingsApi.cancelBooking).toHaveBeenCalledWith(
      mockPendingBookingRecord.id,
      expect.any(String)
    );

    // After cancellation, status updates
    expect(screen.getByText('Reservation Cancelled')).toBeInTheDocument();
    expect(screen.getByText('BOOKING CANCELLED')).toBeInTheDocument();
  });
});
