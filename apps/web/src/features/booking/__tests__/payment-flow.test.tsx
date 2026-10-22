import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext.js';
import { PaymentModal } from '../PaymentModal.js';
import { BookingConfirmationPage } from '../BookingConfirmationPage.js';
import { MyBookingsPage } from '../../dashboard/MyBookingsPage.js';
import { paymentsApi } from '../../../lib/api/payments.js';
import { bookingsApi, UserBookingRecord } from '../../../lib/api/bookings.js';
import { authApi } from '../../../lib/api/auth.js';
import { UserRole } from '@tourist/shared';

describe('Phase 10 Frontend: Payment Processing & Settlement Integration Tests', () => {
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

  const mockPendingBooking: UserBookingRecord = {
    id: 'booking-res-001',
    bookingReference: 'VV-PAY-2026-999',
    userId: mockUser.id,
    user: mockUser,
    couponId: null,
    idempotencyKey: 'idemp-pay-01',
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
    items: [
      {
        id: 'item-01',
        itemTitle: 'Everest Alpine Base Circuit',
        unitPrice: '1200.00',
        quantity: 1,
        totalPrice: '1200.00',
      },
    ],
    payments: [
      {
        id: 'payment-pending-01',
        paymentReference: 'PAY-REF-999',
        amount: '1320.00',
        currency: 'USD',
        status: 'PENDING',
        method: 'CREDIT_CARD',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const mockConfirmedBooking: UserBookingRecord = {
    ...mockPendingBooking,
    status: 'CONFIRMED',
    payments: [
      {
        id: 'payment-pending-01',
        paymentReference: 'PAY-REF-999',
        amount: '1320.00',
        currency: 'USD',
        status: 'SUCCEEDED',
        method: 'CREDIT_CARD',
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ],
  };

  describe('1. PaymentModal Component', () => {
    it('renders amount due, booking reference, and test auto-fill buttons', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={() => {}}
          booking={mockPendingBooking}
        />
      );

      expect(screen.getByText('Secure Checkout & Settlement')).toBeInTheDocument();
      expect(screen.getByText('VV-PAY-2026-999')).toBeInTheDocument();
      expect(screen.getByText('$1320.00')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
      expect(screen.getByText('✓ Success Card (...4242)')).toBeInTheDocument();
      expect(screen.getByText('✕ Decline Card (...0002)')).toBeInTheDocument();
    });

    it('auto-fills test card and settles payment successfully with receipt', async () => {
      const onPaymentSuccess = vi.fn();
      vi.spyOn(paymentsApi, 'processPayment').mockResolvedValue({
        success: true,
        paymentId: 'payment-pending-01',
        paymentReference: 'PAY-REF-999',
        status: 'SUCCEEDED',
        bookingStatus: 'CONFIRMED',
        transactionId: 'txn_mock_success_777',
        message: 'Payment verified and settled successfully.',
      });

      render(
        <PaymentModal
          isOpen={true}
          onClose={() => {}}
          booking={mockPendingBooking}
          onPaymentSuccess={onPaymentSuccess}
        />
      );

      // Click auto-fill test success card
      const autoFillSuccess = screen.getByText('✓ Success Card (...4242)');
      fireEvent.click(autoFillSuccess);

      const submitBtn = screen.getByRole('button', {
        name: /Pay \$1320\.00 USD/i,
      });
      expect(submitBtn).toBeEnabled();

      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(paymentsApi.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: 'payment-pending-01',
          paymentMethod: 'CREDIT_CARD',
          cardNumber: '4242424242424242',
          cvv: '123',
          expiryDate: '12/28',
        })
      );

      // Verify success screen displayed
      expect(screen.getByText('Payment Settled & Confirmed!')).toBeInTheDocument();
      expect(screen.getByText('txn_mock_success_777')).toBeInTheDocument();
      expect(onPaymentSuccess).toHaveBeenCalled();
    });

    it('handles simulated card decline and shows error alert', async () => {
      vi.spyOn(paymentsApi, 'processPayment').mockRejectedValue(
        new Error('Card declined by issuing bank (Simulated Test Card)')
      );

      render(
        <PaymentModal
          isOpen={true}
          onClose={() => {}}
          booking={mockPendingBooking}
        />
      );

      // Click auto-fill decline card
      const autoFillDecline = screen.getByText('✕ Decline Card (...0002)');
      fireEvent.click(autoFillDecline);

      const submitBtn = screen.getByRole('button', {
        name: /Pay \$1320\.00 USD/i,
      });

      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(screen.getByText('Payment Issue Encountered')).toBeInTheDocument();
      expect(
        screen.getByText(/Card declined by issuing bank/i)
      ).toBeInTheDocument();
    });
  });

  describe('2. BookingConfirmationPage Settlement Integration', () => {
    it('opens PaymentModal when traveler clicks Pay Now and transitions to CONFIRMED', async () => {
      vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser);
      vi.spyOn(bookingsApi, 'getBookingDetails')
        .mockResolvedValueOnce(mockPendingBooking)
        .mockResolvedValueOnce(mockConfirmedBooking);

      vi.spyOn(paymentsApi, 'processPayment').mockResolvedValue({
        success: true,
        paymentId: 'payment-pending-01',
        paymentReference: 'PAY-REF-999',
        status: 'SUCCEEDED',
        bookingStatus: 'CONFIRMED',
        transactionId: 'txn_settled_confirm_123',
        message: 'Payment confirmed.',
      });

      await act(async () => {
        render(
          <MemoryRouter initialEntries={[`/booking/confirmation?bookingId=${mockPendingBooking.id}`]}>
            <AuthProvider>
              <Routes>
                <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        );
      });

      // Initially Pending
      expect(screen.getByText('Payment Settlement Required')).toBeInTheDocument();
      const payNowBtn = screen.getByRole('button', {
        name: /Pay Now \(\$1320\.00 USD\)/i,
      });
      expect(payNowBtn).toBeInTheDocument();

      // Open modal
      await act(async () => {
        fireEvent.click(payNowBtn);
      });

      expect(screen.getByText('Secure Checkout & Settlement')).toBeInTheDocument();

      // Fill success card and submit
      fireEvent.click(screen.getByText('✓ Success Card (...4242)'));
      const payModalSubmit = screen.getByRole('button', {
        name: /Pay \$1320\.00 USD/i,
      });

      await act(async () => {
        fireEvent.click(payModalSubmit);
      });

      expect(paymentsApi.processPayment).toHaveBeenCalled();
      expect(screen.getByText('Payment Settled & Confirmed!')).toBeInTheDocument();

      // Close modal
      const closeSuccessBtn = screen.getByRole('button', {
        name: /View Updated Reservation/i,
      });
      await act(async () => {
        fireEvent.click(closeSuccessBtn);
      });

      // Should now show confirmed banner
      await waitFor(() => {
        expect(screen.getByText('Booking Confirmed & Boarding Voucher Ready!')).toBeInTheDocument();
      });
    });
  });

  describe('3. MyBookingsPage Settlement Integration', () => {
    it('shows Pay Now button on pending booking and launches PaymentModal', async () => {
      vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser);
      vi.spyOn(bookingsApi, 'getMyBookings').mockResolvedValue({
        items: [mockPendingBooking],
        pagination: { page: 1, pageSize: 6, totalItems: 1, totalPages: 1 },
      });

      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/dashboard/bookings']}>
            <AuthProvider>
              <Routes>
                <Route path="/dashboard/bookings" element={<MyBookingsPage />} />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        );
      });

      expect(screen.getByText('VV-PAY-2026-999')).toBeInTheDocument();
      const payNowBtn = screen.getByRole('button', { name: /Pay Now/i });
      expect(payNowBtn).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(payNowBtn);
      });

      expect(screen.getByText('Secure Checkout & Settlement')).toBeInTheDocument();
    });
  });
});
