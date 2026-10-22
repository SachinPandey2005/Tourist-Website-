import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import {
  UserRole,
  BookingStatus,
  PaymentStatus,
  ScheduleStatus,
  PaymentMethod,
  Prisma,
} from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { generateToken } from '../src/utils/jwt.js';
import { NotificationService } from '../src/services/notification.service.js';

describe('Phase 10: Secure Payment Processing & Settlement Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const travelerAlice = {
    id: '10000000-0000-4000-a000-000000000001',
    email: 'alice.traveler@voyagevista.com',
    name: 'Alice Traveler',
    role: UserRole.TOURIST,
    tokenVersion: 0,
    passwordHash: 'hashed_password',
    phoneNumber: '+15550001',
    avatarUrl: null,
    isEmailVerified: true,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const travelerBob = {
    id: '20000000-0000-4000-a000-000000000002',
    email: 'bob.explorer@voyagevista.com',
    name: 'Bob Explorer',
    role: UserRole.TOURIST,
    tokenVersion: 0,
    passwordHash: 'hashed_password',
    phoneNumber: '+15550002',
    avatarUrl: null,
    isEmailVerified: true,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const adminUser = {
    id: '30000000-0000-4000-a000-000000000003',
    email: 'admin@voyagevista.com',
    name: 'Admin Chief',
    role: UserRole.ADMIN,
    tokenVersion: 0,
    passwordHash: 'hashed_password',
    phoneNumber: '+15550003',
    avatarUrl: null,
    isEmailVerified: true,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const aliceToken = generateToken({
    sub: travelerAlice.id,
    email: travelerAlice.email,
    role: travelerAlice.role,
    tokenVersion: 0,
  });

  const bobToken = generateToken({
    sub: travelerBob.id,
    email: travelerBob.email,
    role: travelerBob.role,
    tokenVersion: 0,
  });

  const adminToken = generateToken({
    sub: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    tokenVersion: 0,
  });

  const mockPendingBooking = {
    id: '40000000-0000-4000-a000-000000000004',
    bookingReference: 'VV-PAY-2026-001',
    userId: travelerAlice.id,
    couponId: null,
    idempotencyKey: 'idemp-pay-01',
    status: BookingStatus.PENDING,
    subtotal: new Prisma.Decimal('1200.00'),
    discountAmount: new Prisma.Decimal('0.00'),
    taxAmount: new Prisma.Decimal('120.00'),
    totalAmount: new Prisma.Decimal('1320.00'),
    currency: 'USD',
    specialRequests: 'Window seat please',
    cancellationReason: null,
    cancelledAt: null,
    createdAt: new Date('2026-03-01T10:00:00Z'),
    updatedAt: new Date('2026-03-01T10:00:00Z'),
    user: travelerAlice,
    items: [
      {
        id: 'item-1',
        tourScheduleId: 'sched-uuid-001',
        itemTitle: 'Everest Alpine Circuit',
        unitPrice: new Prisma.Decimal('1200.00'),
        quantity: 1,
        totalPrice: new Prisma.Decimal('1200.00'),
        startDate: new Date('2026-11-01T00:00:00Z'),
        endDate: new Date('2026-11-12T00:00:00Z'),
      },
    ],
    payments: [
      {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: 'PAY-REF-2026-001',
        bookingId: '40000000-0000-4000-a000-000000000004',
        userId: travelerAlice.id,
        amount: new Prisma.Decimal('1320.00'),
        currency: 'USD',
        status: PaymentStatus.PENDING,
        method: PaymentMethod.CREDIT_CARD,
        gatewayTransactionId: null,
        gatewayResponse: null,
        paidAt: null,
        createdAt: new Date('2026-03-01T10:00:00Z'),
        updatedAt: new Date('2026-03-01T10:00:00Z'),
      },
    ],
  };

  const mockSchedule = {
    id: 'sched-uuid-001',
    tourPackageId: 'tour-uuid-001',
    startDate: new Date('2026-11-01T00:00:00Z'),
    endDate: new Date('2026-11-12T00:00:00Z'),
    price: new Prisma.Decimal('1200.00'),
    totalCapacity: 10,
    bookedCapacity: 5,
    status: ScheduleStatus.AVAILABLE,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  describe('1. Payment Session / Intent Initialization', () => {
    it('POST /api/payments/session should generate checkout session for pending booking', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(mockPendingBooking as any);

      const res = await request(app)
        .post('/api/payments/session')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          bookingId: mockPendingBooking.id,
          method: 'CREDIT_CARD',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        paymentId: mockPendingBooking.payments[0].id,
        paymentReference: mockPendingBooking.payments[0].paymentReference,
        amount: '1320.00',
        currency: 'USD',
        status: 'PENDING',
        bookingId: mockPendingBooking.id,
        bookingReference: mockPendingBooking.bookingReference,
      });
      expect(res.body.data.clientSecret).toBeDefined();
    });

    it('POST /api/payments/session should reject when user attempts to initialize payment for another traveler (403 Forbidden)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerBob as any);
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(mockPendingBooking as any);

      const res = await request(app)
        .post('/api/payments/session')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          bookingId: mockPendingBooking.id,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('authorization');
    });

    it('POST /api/payments/session should reject when booking is already confirmed and paid', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      const confirmedBooking = {
        ...mockPendingBooking,
        status: BookingStatus.CONFIRMED,
      };
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(confirmedBooking as any);

      const res = await request(app)
        .post('/api/payments/session')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          bookingId: confirmedBooking.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('already been confirmed and paid');
    });
  });

  describe('2. Direct Settlement & Transaction Processing', () => {
    it('POST /api/payments/process should settle payment, update booking to CONFIRMED, and dispatch voucher', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      const pendingPayment = {
        ...mockPendingBooking.payments[0],
        booking: mockPendingBooking,
        user: travelerAlice,
      };
      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(pendingPayment as any);

      const txMock = {
        payment: {
          update: vi.fn().mockResolvedValue({
            ...pendingPayment,
            status: PaymentStatus.SUCCEEDED,
            gatewayTransactionId: 'txn_test_settled_123',
            paidAt: new Date(),
          }),
        },
        booking: {
          update: vi.fn().mockResolvedValue({
            ...mockPendingBooking,
            status: BookingStatus.CONFIRMED,
          }),
        },
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb(txMock);
      });

      const notifySpy = vi.spyOn(NotificationService, 'notifyBookingConfirmed');

      const res = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          paymentId: pendingPayment.id,
          paymentMethod: 'CREDIT_CARD',
          cardholderName: 'Alice Traveler',
          cardNumber: '4242424242424242',
          expiryDate: '12/28',
          cvv: '123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUCCEEDED');
      expect(res.body.data.bookingStatus).toBe('CONFIRMED');
      expect(res.body.data.transactionId).toBeDefined();

      // Verify transaction committed updates
      expect(txMock.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: pendingPayment.id },
          data: expect.objectContaining({
            status: PaymentStatus.SUCCEEDED,
          }),
        })
      );
      expect(txMock.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPendingBooking.id },
          data: expect.objectContaining({
            status: BookingStatus.CONFIRMED,
          }),
        })
      );
      expect(notifySpy).toHaveBeenCalled();
    });

    it('POST /api/payments/process should handle simulated card decline and transition payment to FAILED', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      const pendingPayment = {
        ...mockPendingBooking.payments[0],
        booking: mockPendingBooking,
        user: travelerAlice,
      };
      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(pendingPayment as any);
      vi.spyOn(prisma.payment, 'update').mockResolvedValue({
        ...pendingPayment,
        status: PaymentStatus.FAILED,
      } as any);

      const notifyFailSpy = vi.spyOn(NotificationService, 'notifyPaymentFailed');

      const res = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          paymentId: pendingPayment.id,
          paymentMethod: 'CREDIT_CARD',
          cardholderName: 'Alice Traveler',
          cardNumber: '4000000000000002', // Card ending in 0002 triggers simulated decline
          expiryDate: '12/28',
          cvv: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('card was declined');
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.FAILED,
          }),
        })
      );
      expect(notifyFailSpy).toHaveBeenCalled();
    });
  });

  describe('3. Asynchronous Webhook Processing & Idempotency', () => {
    it('POST /api/payments/webhook should process payment_intent.succeeded and confirm booking', async () => {
      const pendingPayment = {
        ...mockPendingBooking.payments[0],
        booking: mockPendingBooking,
        user: travelerAlice,
      };
      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(pendingPayment as any);

      const txMock = {
        payment: {
          update: vi.fn().mockResolvedValue({
            ...pendingPayment,
            status: PaymentStatus.SUCCEEDED,
          }),
        },
        booking: {
          update: vi.fn().mockResolvedValue({
            ...mockPendingBooking,
            status: BookingStatus.CONFIRMED,
          }),
        },
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb(txMock);
      });

      const notifySpy = vi.spyOn(NotificationService, 'notifyBookingConfirmed');

      const res = await request(app)
        .post('/api/payments/webhook')
        .send({
          event: 'payment_intent.succeeded',
          data: {
            paymentReference: pendingPayment.paymentReference,
            gatewayTransactionId: 'wh_txn_abc123',
            amount: '1320.00',
            currency: 'USD',
            status: 'succeeded',
          },
          timestamp: new Date().toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('settled_confirmed');
      expect(txMock.payment.update).toHaveBeenCalled();
      expect(txMock.booking.update).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
    });

    it('POST /api/payments/webhook should be idempotent and ignore already settled payments', async () => {
      const alreadySettledPayment = {
        ...mockPendingBooking.payments[0],
        status: PaymentStatus.SUCCEEDED,
        booking: mockPendingBooking,
        user: travelerAlice,
      };
      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(alreadySettledPayment as any);
      const txSpy = vi.spyOn(prisma, '$transaction');

      const res = await request(app)
        .post('/api/payments/webhook')
        .send({
          event: 'payment_intent.succeeded',
          data: {
            paymentReference: alreadySettledPayment.paymentReference,
            gatewayTransactionId: 'wh_txn_duplicate_retry',
          },
          timestamp: new Date().toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('already_succeeded_idempotent');
      expect(txSpy).not.toHaveBeenCalled();
    });
  });

  describe('4. Refund Handling & Schedule Capacity Release', () => {
    it('POST /api/payments/:id/refund should mark payment REFUNDED, cancel booking, and restore tour schedule capacity', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(adminUser as any);

      const succeededPayment = {
        id: '60000000-0000-4000-a000-000000000006',
        paymentReference: 'PAY-SUCC-001',
        userId: travelerAlice.id,
        bookingId: mockPendingBooking.id,
        amount: new Prisma.Decimal('1320.00'),
        currency: 'USD',
        status: PaymentStatus.SUCCEEDED,
        booking: {
          ...mockPendingBooking,
          status: BookingStatus.CONFIRMED,
        },
        user: travelerAlice,
      };

      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(succeededPayment as any);

      const txMock = {
        payment: {
          update: vi.fn().mockResolvedValue({
            ...succeededPayment,
            status: PaymentStatus.REFUNDED,
          }),
        },
        booking: {
          update: vi.fn().mockResolvedValue({
            ...mockPendingBooking,
            status: BookingStatus.CANCELLED,
          }),
        },
        tourSchedule: {
          findUnique: vi.fn().mockResolvedValue(mockSchedule),
          update: vi.fn().mockResolvedValue({
            ...mockSchedule,
            bookedCapacity: 4, // 5 - 1 = 4
          }),
        },
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb(txMock);
      });

      const notifyCancelSpy = vi.spyOn(NotificationService, 'notifyBookingCancelled');

      const res = await request(app)
        .post(`/api/payments/${succeededPayment.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Severe weather cancellation refund',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REFUNDED');
      expect(txMock.tourSchedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockSchedule.id },
          data: expect.objectContaining({
            bookedCapacity: 4,
            status: ScheduleStatus.AVAILABLE,
          }),
        })
      );
      expect(notifyCancelSpy).toHaveBeenCalled();
    });

    it('POST /api/payments/:id/refund should reject non-admin non-owner with 403 Forbidden', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerBob as any);

      const alicePayment = {
        id: '60000000-0000-4000-a000-000000000006',
        userId: travelerAlice.id, // Alice
        status: PaymentStatus.SUCCEEDED,
        booking: mockPendingBooking,
        user: travelerAlice,
      };
      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(alicePayment as any);

      // Bob tries to refund Alice's payment
      const res = await request(app)
        .post(`/api/payments/${alicePayment.id}/refund`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('authorization');
    });
  });
});
