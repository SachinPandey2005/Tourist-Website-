import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import {
  UserRole,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  Prisma,
} from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { generateToken } from '../src/utils/jwt.js';
import { PaymentService } from '../src/services/payment.service.js';
import { NotificationService } from '../src/services/notification.service.js';

describe('Phase 10: Razorpay End-to-End Payment Integration', () => {
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
    bookingReference: 'VV-RZP-2026-001',
    userId: travelerAlice.id,
    couponId: null,
    idempotencyKey: 'idemp-rzp-01',
    status: BookingStatus.PENDING,
    subtotal: new Prisma.Decimal('1200.00'),
    discountAmount: new Prisma.Decimal('0.00'),
    taxAmount: new Prisma.Decimal('120.00'),
    totalAmount: new Prisma.Decimal('1320.00'),
    currency: 'USD',
    specialRequests: 'Ocean view room',
    cancellationReason: null,
    cancelledAt: null,
    createdAt: new Date('2026-03-01T10:00:00Z'),
    updatedAt: new Date('2026-03-01T10:00:00Z'),
    user: travelerAlice,
    items: [
      {
        id: 'item-rzp-1',
        tourScheduleId: 'sched-rzp-001',
        itemTitle: 'Himalayan Sunrise Trek',
        unitPrice: new Prisma.Decimal('1200.00'),
        quantity: 1,
        totalPrice: new Prisma.Decimal('1200.00'),
        startDate: new Date('2026-11-01T00:00:00Z'),
        endDate: new Date('2026-11-12T00:00:00Z'),
      },
    ],
    payments: [],
  };

  describe('1. Razorpay Order Creation: POST /api/payments/create-order', () => {
    it('should create Razorpay order with server-calculated subunits (amount * 100) and stage pending payment', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(mockPendingBooking as any);

      const mockRzpOrdersCreate = vi.fn().mockResolvedValue({
        id: 'order_rzp_mock_12345',
        entity: 'order',
        amount: 132000, // 1320.00 * 100
        currency: 'USD',
        status: 'created',
      });

      vi.spyOn(PaymentService, 'getRazorpayClient').mockReturnValue({
        orders: { create: mockRzpOrdersCreate },
      });

      const stagedPayment = {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: 'order_rzp_mock_12345',
        bookingId: mockPendingBooking.id,
        userId: travelerAlice.id,
        amount: mockPendingBooking.totalAmount,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        method: PaymentMethod.CREDIT_CARD,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.payment, 'create').mockResolvedValue(stagedPayment as any);

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          bookingId: mockPendingBooking.id,
          currency: 'USD',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe('order_rzp_mock_12345');
      expect(res.body.data.amount).toBe(132000);
      expect(res.body.data.currency).toBe('USD');
      expect(res.body.data.keyId).toBe(env.RAZORPAY_KEY_ID);
      expect(res.body.data.bookingReference).toBe(mockPendingBooking.bookingReference);
      expect(res.body.data.customer.email).toBe(travelerAlice.email);

      expect(mockRzpOrdersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 132000,
          currency: 'USD',
          receipt: expect.stringContaining(mockPendingBooking.bookingReference),
        })
      );
    });

    it('should reject order creation if booking does not exist (404)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          bookingId: '99999999-9999-4000-a000-999999999999',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain('does not exist');
    });

    it('should reject order creation if booking belongs to another user (403)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerBob as any);
      // Booking belongs to Alice, but Bob requests payment order
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(mockPendingBooking as any);

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          bookingId: mockPendingBooking.id,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('authorization');
    });

    it('should reject order creation if booking is already CANCELLED (400)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue({
        ...mockPendingBooking,
        status: BookingStatus.CANCELLED,
      } as any);

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          bookingId: mockPendingBooking.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('cancelled reservation');
    });

    it('should reject order creation if booking is already CONFIRMED (400)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue({
        ...mockPendingBooking,
        status: BookingStatus.CONFIRMED,
      } as any);

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          bookingId: mockPendingBooking.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('already been confirmed');
    });
  });

  describe('2. Razorpay Signature Verification: POST /api/payments/verify', () => {
    const orderId = 'order_valid_rzp_999';
    const paymentId = 'pay_valid_rzp_888';

    it('should verify valid HMAC SHA256 signature, mark payment SUCCEEDED and booking CONFIRMED', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);

      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const mockPaymentRecord = {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: orderId,
        bookingId: mockPendingBooking.id,
        userId: travelerAlice.id,
        amount: mockPendingBooking.totalAmount,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        method: PaymentMethod.CREDIT_CARD,
        booking: {
          ...mockPendingBooking,
          status: BookingStatus.PENDING,
          user: travelerAlice,
        },
        user: travelerAlice,
      };

      vi.spyOn(prisma.payment, 'findFirst').mockResolvedValue(mockPaymentRecord as any);

      const txMock = {
        payment: { update: vi.fn().mockResolvedValue({ ...mockPaymentRecord, status: PaymentStatus.SUCCEEDED }) },
        booking: { update: vi.fn().mockResolvedValue({ ...mockPendingBooking, status: BookingStatus.CONFIRMED }) },
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(txMock));
      const notifySpy = vi.spyOn(NotificationService, 'notifyBookingConfirmed').mockResolvedValue(undefined as any);

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
          paymentId: mockPaymentRecord.id,
          bookingId: mockPendingBooking.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PaymentStatus.SUCCEEDED);
      expect(res.body.data.bookingStatus).toBe(BookingStatus.CONFIRMED);
      expect(txMock.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPaymentRecord.id },
          data: expect.objectContaining({
            status: PaymentStatus.SUCCEEDED,
            gatewayTransactionId: paymentId,
          }),
        })
      );
      expect(txMock.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPendingBooking.id },
          data: { status: BookingStatus.CONFIRMED },
        })
      );
      expect(notifySpy).toHaveBeenCalled();
    });

    it('should reject invalid cryptographic signature with 400 Bad Request and record FAILED status', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);

      const invalidSignature = 'tampered_signature_hex_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      const mockPaymentRecord = {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: orderId,
        bookingId: mockPendingBooking.id,
        userId: travelerAlice.id,
        status: PaymentStatus.PENDING,
        booking: mockPendingBooking,
        user: travelerAlice,
      };

      vi.spyOn(prisma.payment, 'findFirst').mockResolvedValue(mockPaymentRecord as any);
      const updatePaymentSpy = vi.spyOn(prisma.payment, 'update').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: invalidSignature,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid payment signature');
      expect(updatePaymentSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPaymentRecord.id },
          data: expect.objectContaining({
            status: PaymentStatus.FAILED,
          }),
        })
      );
    });

    it('should return already verified status idempotently without duplicate transaction', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);

      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const alreadySucceededPayment = {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: orderId,
        gatewayTransactionId: paymentId,
        bookingId: mockPendingBooking.id,
        userId: travelerAlice.id,
        status: PaymentStatus.SUCCEEDED,
        booking: {
          ...mockPendingBooking,
          status: BookingStatus.CONFIRMED,
        },
        user: travelerAlice,
      };

      vi.spyOn(prisma.payment, 'findFirst').mockResolvedValue(alreadySucceededPayment as any);
      const txSpy = vi.spyOn(prisma, '$transaction');

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(PaymentStatus.SUCCEEDED);
      expect(res.body.data.message).toContain('already verified');
      expect(txSpy).not.toHaveBeenCalled();
    });

    it('should reject verification if payment belongs to another user (403)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerBob as any);

      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const alicePayment = {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: orderId,
        bookingId: mockPendingBooking.id,
        userId: travelerAlice.id, // Alice
        status: PaymentStatus.PENDING,
        booking: mockPendingBooking,
      };

      vi.spyOn(prisma.payment, 'findFirst').mockResolvedValue(alicePayment as any);

      // Bob attempts to verify Alice's payment
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('authorization');
    });

    it('should reject verification if booking was cancelled while checkout was open (400)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);

      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const cancelledBookingPayment = {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: orderId,
        bookingId: mockPendingBooking.id,
        userId: travelerAlice.id,
        status: PaymentStatus.PENDING,
        booking: {
          ...mockPendingBooking,
          status: BookingStatus.CANCELLED,
        },
        user: travelerAlice,
      };

      vi.spyOn(prisma.payment, 'findFirst').mockResolvedValue(cancelledBookingPayment as any);

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('cancelled prior to payment verification');
    });
  });

  describe('3. Webhook Reconciliation: POST /api/payments/webhook', () => {
    it('should reconcile Razorpay order.paid event via raw body HMAC signature', async () => {
      const payload = {
        entity: 'event',
        event: 'order.paid',
        payload: {
          order: {
            entity: {
              id: 'order_webhook_100',
              amount: 132000,
              currency: 'USD',
              status: 'paid',
            },
          },
          payment: {
            entity: {
              id: 'pay_webhook_200',
              order_id: 'order_webhook_100',
              status: 'captured',
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const pendingPayment = {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: 'order_webhook_100',
        bookingId: mockPendingBooking.id,
        userId: travelerAlice.id,
        amount: mockPendingBooking.totalAmount,
        currency: 'USD',
        status: PaymentStatus.PENDING,
        booking: {
          ...mockPendingBooking,
          status: BookingStatus.PENDING,
          user: travelerAlice,
        },
        user: travelerAlice,
      };

      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(pendingPayment as any);

      const txMock = {
        payment: { update: vi.fn().mockResolvedValue({}) },
        booking: { update: vi.fn().mockResolvedValue({}) },
      };
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(txMock));
      vi.spyOn(NotificationService, 'notifyBookingConfirmed').mockResolvedValue(undefined as any);

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('order_paid_confirmed');
      expect(txMock.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.SUCCEEDED,
            gatewayTransactionId: 'pay_webhook_200',
          }),
        })
      );
      expect(txMock.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: BookingStatus.CONFIRMED },
        })
      );
    });

    it('should reject webhook with invalid Razorpay signature (400)', async () => {
      const payload = { event: 'order.paid' };
      const rawBody = JSON.stringify(payload);

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', 'invalid_signature_hex_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
        .set('Content-Type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid Razorpay webhook signature');
    });

    it('should handle webhook idempotency on duplicate order.paid event', async () => {
      const payload = {
        event: 'order.paid',
        payload: {
          payment: {
            entity: {
              id: 'pay_webhook_200',
              order_id: 'order_webhook_100',
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const alreadySucceededPayment = {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: 'order_webhook_100',
        status: PaymentStatus.SUCCEEDED,
        booking: mockPendingBooking,
        user: travelerAlice,
      };

      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(alreadySucceededPayment as any);
      const txSpy = vi.spyOn(prisma, '$transaction');

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('already_succeeded_idempotent');
      expect(txSpy).not.toHaveBeenCalled();
    });

    it('should handle payment.failed event and notify traveler', async () => {
      const payload = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_webhook_failed_300',
              order_id: 'order_webhook_failed_100',
              error_description: 'Card declined by issuing bank',
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const pendingPayment = {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: 'order_webhook_failed_100',
        status: PaymentStatus.PENDING,
        amount: mockPendingBooking.totalAmount,
        currency: 'USD',
        booking: mockPendingBooking,
        user: travelerAlice,
      };

      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(pendingPayment as any);
      const updateSpy = vi.spyOn(prisma.payment, 'update').mockResolvedValue({} as any);
      const notifyFailSpy = vi.spyOn(NotificationService, 'notifyPaymentFailed').mockResolvedValue(undefined as any);

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('payment_failed_recorded');
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.FAILED,
          }),
        })
      );
      expect(notifyFailSpy).toHaveBeenCalled();
    });
  });

  describe('4. Payment Status Reconciliation: GET /api/payments/:paymentId/status', () => {
    it('should return real-time payment and booking status for booking owner', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);

      const paymentRecord = {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: 'order_rzp_mock_12345',
        gatewayTransactionId: 'pay_rzp_mock_8888',
        amount: mockPendingBooking.totalAmount,
        currency: 'USD',
        status: PaymentStatus.SUCCEEDED,
        bookingId: mockPendingBooking.id,
        userId: travelerAlice.id,
        createdAt: new Date('2026-03-01T10:00:00Z'),
        paidAt: new Date('2026-03-01T10:05:00Z'),
        booking: {
          id: mockPendingBooking.id,
          bookingReference: mockPendingBooking.bookingReference,
          status: BookingStatus.CONFIRMED,
        },
      };

      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(paymentRecord as any);

      const res = await request(app)
        .get(`/api/payments/${paymentRecord.id}/status`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isPaid).toBe(true);
      expect(res.body.data.status).toBe(PaymentStatus.SUCCEEDED);
      expect(res.body.data.bookingStatus).toBe(BookingStatus.CONFIRMED);
      expect(res.body.data.bookingReference).toBe(mockPendingBooking.bookingReference);
      expect(res.body.data.gatewayTransactionId).toBe('pay_rzp_mock_8888');
    });

    it('should allow ADMIN to inspect any payment status', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(adminUser as any);

      const paymentRecord = {
        id: '50000000-0000-4000-a000-000000000005',
        paymentReference: 'order_rzp_mock_12345',
        gatewayTransactionId: 'pay_rzp_mock_8888',
        amount: mockPendingBooking.totalAmount,
        currency: 'USD',
        status: PaymentStatus.SUCCEEDED,
        bookingId: mockPendingBooking.id,
        userId: travelerAlice.id, // Alice
        createdAt: new Date('2026-03-01T10:00:00Z'),
        paidAt: new Date('2026-03-01T10:05:00Z'),
        booking: {
          id: mockPendingBooking.id,
          bookingReference: mockPendingBooking.bookingReference,
          status: BookingStatus.CONFIRMED,
        },
      };

      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(paymentRecord as any);

      const res = await request(app)
        .get(`/api/payments/${paymentRecord.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isPaid).toBe(true);
    });

    it('should reject unauthorized non-owner with 403 Forbidden', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerBob as any);

      const alicePayment = {
        id: '50000000-0000-4000-a000-000000000005',
        userId: travelerAlice.id, // Alice
        status: PaymentStatus.PENDING,
        booking: mockPendingBooking,
      };

      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(alicePayment as any);

      // Bob requests status of Alice's payment
      const res = await request(app)
        .get(`/api/payments/${alicePayment.id}/status`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('permission');
    });

    it('should return 404 for non-existent payment', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/payments/99999999-9999-4000-a000-999999999999/status')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain('not found');
    });
  });
});
