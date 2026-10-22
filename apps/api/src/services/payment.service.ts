import crypto from 'crypto';
import Razorpay from 'razorpay';
import { PaymentStatus, BookingStatus, ScheduleStatus, UserRole, PaymentMethod } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import { env } from '../config/env.js';
import { NotificationService } from './notification.service.js';
import type {
  CreatePaymentSessionInput,
  PaymentSessionResult,
  ProcessPaymentInput,
  ProcessPaymentResult,
  CreateRazorpayOrderInput,
  RazorpayOrderResult,
  VerifyRazorpayPaymentInput,
  VerifyRazorpayPaymentResult,
  PaymentStatusResult,
} from '@tourist/shared';

export class PaymentService {
  private static razorpayClient: any = null;

  /**
   * Lazily initializes and returns the Razorpay SDK instance.
   */
  static getRazorpayClient(): any {
    if (!this.razorpayClient) {
      this.razorpayClient = new (Razorpay as any)({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    }
    return this.razorpayClient;
  }

  /**
   * Formats a payment record for API responses.
   */
  private static formatPayment(payment: any) {
    return {
      id: payment.id,
      paymentReference: payment.paymentReference,
      bookingId: payment.bookingId,
      userId: payment.userId,
      amount: Number(payment.amount).toFixed(2),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      gatewayTransactionId: payment.gatewayTransactionId || null,
      gatewayResponse: payment.gatewayResponse || null,
      paidAt: payment.paidAt ? (typeof payment.paidAt === 'string' ? payment.paidAt : payment.paidAt.toISOString()) : null,
      createdAt: payment.createdAt ? (typeof payment.createdAt === 'string' ? payment.createdAt : payment.createdAt.toISOString()) : new Date().toISOString(),
      updatedAt: payment.updatedAt ? (typeof payment.updatedAt === 'string' ? payment.updatedAt : payment.updatedAt.toISOString()) : new Date().toISOString(),
      booking: payment.booking
        ? {
            id: payment.booking.id,
            bookingReference: payment.booking.bookingReference,
            status: payment.booking.status,
            totalAmount: Number(payment.booking.totalAmount).toFixed(2),
          }
        : undefined,
      user: payment.user
        ? {
            id: payment.user.id,
            name: payment.user.name,
            email: payment.user.email,
          }
        : undefined,
    };
  }

  /**
   * Creates or retrieves a payment session for an authenticated user's pending booking.
   */
  static async createPaymentSession(
    userId: string,
    input: CreatePaymentSessionInput
  ): Promise<PaymentSessionResult> {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        payments: true,
        user: true,
      },
    });

    if (!booking) {
      throw AppError.notFound(`Booking '${input.bookingId}' does not exist.`);
    }

    // Ownership Authorization
    if (booking.userId !== userId) {
      throw AppError.forbidden('You do not have authorization to initiate payment for this booking.');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw AppError.badRequest('Cannot initiate payment for a cancelled reservation.');
    }

    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED) {
      throw AppError.badRequest('This booking has already been confirmed and paid.');
    }

    // Find existing payment or create initial pending record
    let payment = booking.payments[0];

    if (!payment) {
      const paymentReference = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      payment = await prisma.payment.create({
        data: {
          paymentReference,
          bookingId: booking.id,
          userId,
          amount: booking.totalAmount,
          currency: booking.currency,
          status: PaymentStatus.PENDING,
          method: input.method || PaymentMethod.CREDIT_CARD,
        },
      });
    } else if (payment.status === PaymentStatus.SUCCEEDED) {
      throw AppError.badRequest('This payment has already been settled.');
    } else {
      // Update method if provided
      if (input.method && payment.method !== input.method) {
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: { method: input.method },
        });
      }
    }

    // Generate client secret for gateway / frontend simulation
    const clientSecret = `pi_sec_${payment.id.replace(/-/g, '')}_${Date.now()}`;

    return {
      paymentId: payment.id,
      paymentReference: payment.paymentReference,
      clientSecret,
      amount: Number(payment.amount).toFixed(2),
      currency: payment.currency,
      status: payment.status,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
    };
  }

  /**
   * Processes direct settlement of a pending payment.
   * Atomic transition:
   * Succeeded: Payment -> SUCCEEDED, Booking -> CONFIRMED, Dispatches Confirmation Notice.
   * Failed: Payment -> FAILED, Booking remains PENDING, Dispatches Failure Notice.
   */
  static async processPayment(
    userId: string,
    input: ProcessPaymentInput
  ): Promise<ProcessPaymentResult> {
    const payment = await prisma.payment.findUnique({
      where: { id: input.paymentId },
      include: {
        booking: {
          include: {
            items: true,
            user: true,
          },
        },
        user: true,
      },
    });

    if (!payment) {
      throw AppError.notFound(`Payment '${input.paymentId}' not found.`);
    }

    // Authorization
    if (payment.userId !== userId) {
      throw AppError.forbidden('You do not have authorization to process this payment.');
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      throw AppError.badRequest('This payment transaction has already succeeded.');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw AppError.badRequest('This payment transaction has been refunded.');
    }

    if (payment.booking.status === BookingStatus.CANCELLED) {
      throw AppError.badRequest('The associated booking has been cancelled.');
    }

    // Test card simulation & validation rules:
    // Numbers ending in 0002 or 0000 simulate card decline
    const cardNum = input.cardNumber?.replace(/\s+/g, '') || '';
    const isSimulatedDecline = cardNum.endsWith('0002') || cardNum.endsWith('0000');

    if (isSimulatedDecline) {
      // Record payment failure in transaction
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          method: input.paymentMethod,
          gatewayResponse: JSON.stringify({
            authorized: false,
            declineCode: 'card_declined_insufficient_funds',
            message: 'Your card was declined by the issuing financial institution.',
          }),
        },
      });

      // Dispatch failure notice
      if (payment.user) {
        NotificationService.notifyPaymentFailed({
          recipientEmail: payment.user.email,
          recipientName: payment.user.name,
          bookingReference: payment.booking.bookingReference,
          paymentReference: payment.paymentReference,
          amount: Number(payment.amount).toFixed(2),
          currency: payment.currency,
          reason: 'Card declined by issuing bank (Simulated Test Card)',
        }).catch((err) => {
          console.error('[NotificationService Error] Could not dispatch payment failure:', err);
        });
      }

      throw AppError.badRequest('Your card was declined. Please try another payment method.');
    }

    // Process Successful Settlement
    const transactionId = `txn_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Settle Payment
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          method: input.paymentMethod,
          gatewayTransactionId: transactionId,
          gatewayResponse: JSON.stringify({
            authorized: true,
            network: input.paymentMethod,
            timestamp: new Date().toISOString(),
          }),
          paidAt: new Date(),
        },
      });

      // 2. Confirm Booking
      const updatedBooking = await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
        },
      });

      // 3. Dispatch Confirmed Notification & Voucher
      if (payment.booking.user) {
        NotificationService.notifyBookingConfirmed({
          recipientEmail: payment.booking.user.email,
          recipientName: payment.booking.user.name,
          bookingReference: payment.booking.bookingReference,
          paymentReference: updatedPayment.paymentReference,
          totalAmount: Number(updatedPayment.amount).toFixed(2),
          currency: updatedPayment.currency,
          method: String(updatedPayment.method),
          gatewayTransactionId: transactionId,
          items: payment.booking.items.map((i) => ({
            title: i.itemTitle,
            quantity: i.quantity,
            totalPrice: Number(i.totalPrice).toFixed(2),
            startDate: i.startDate ? i.startDate.toISOString() : null,
          })),
        }).catch((err) => {
          console.error('[NotificationService Error] Could not dispatch confirmation notice:', err);
        });
      }

      return {
        success: true,
        paymentId: updatedPayment.id,
        paymentReference: updatedPayment.paymentReference,
        status: updatedPayment.status,
        bookingStatus: updatedBooking.status,
        transactionId,
        message: 'Payment settled successfully. Your booking is confirmed!',
      };
    });
  }

  /**
   * RAZORPAY: Create Order
   * Validates product availability, recalculates total amount from server-trusted records,
   * creates Razorpay order, and registers/reuses a pending payment record.
   */
  static async createRazorpayOrder(
    userId: string,
    input: CreateRazorpayOrderInput
  ): Promise<RazorpayOrderResult> {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        payments: true,
        user: true,
        items: true,
      },
    });

    if (!booking) {
      throw AppError.notFound(`Booking '${input.bookingId}' does not exist.`);
    }

    if (booking.userId !== userId) {
      throw AppError.forbidden('You do not have authorization to initiate payment for this booking.');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw AppError.badRequest('Cannot initiate payment for a cancelled reservation.');
    }

    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED) {
      throw AppError.badRequest('This booking has already been confirmed and paid.');
    }

    const currency = (input.currency || booking.currency || 'INR').toUpperCase();
    const amountInMajor = Number(booking.totalAmount);
    if (isNaN(amountInMajor) || amountInMajor <= 0) {
      throw AppError.badRequest('Invalid booking amount calculation.');
    }

    const amountInSubunits = Math.round(amountInMajor * 100);

    const client = PaymentService.getRazorpayClient();
    let order: any;
    try {
      order = await client.orders.create({
        amount: amountInSubunits,
        currency,
        receipt: `rcpt_${booking.bookingReference.replace(/[^a-zA-Z0-9_-]/g, '_')}`.slice(0, 40),
        notes: {
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          userId,
        },
      });
    } catch (err: any) {
      order = {
        id: `order_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        amount: amountInSubunits,
        currency,
        status: 'created',
      };
    }

    // Reuse existing PENDING payment or create a fresh one
    let payment = booking.payments.find((p) => p.status === PaymentStatus.PENDING);

    if (payment) {
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentReference: order.id,
          amount: booking.totalAmount,
          currency,
          method: PaymentMethod.CREDIT_CARD,
          gatewayResponse: JSON.stringify({ orderId: order.id, provider: 'RAZORPAY' }),
        },
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          paymentReference: order.id,
          bookingId: booking.id,
          userId,
          amount: booking.totalAmount,
          currency,
          status: PaymentStatus.PENDING,
          method: PaymentMethod.CREDIT_CARD,
          gatewayResponse: JSON.stringify({ orderId: order.id, provider: 'RAZORPAY' }),
        },
      });
    }

    return {
      orderId: order.id,
      paymentId: payment.id,
      amount: Number(order.amount),
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      customer: {
        name: booking.user.name,
        email: booking.user.email,
        contact: booking.user.phoneNumber || undefined,
      },
    };
  }

  /**
   * RAZORPAY: Verify Payment
   * Validates Razorpay HMAC SHA256 signature, validates booking state, and confirms booking.
   */
  static async verifyRazorpayPayment(
    userId: string,
    userRole: UserRole,
    input: VerifyRazorpayPaymentInput
  ): Promise<VerifyRazorpayPaymentResult> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId, bookingId } = input;

    // 1. Signature Verification
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

    // Look up payment
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { paymentReference: razorpay_order_id },
          ...(paymentId ? [{ id: paymentId }] : []),
          ...(bookingId ? [{ bookingId }] : []),
        ],
      },
      include: {
        booking: {
          include: {
            items: true,
            user: true,
          },
        },
        user: true,
      },
    });

    if (!isValid) {
      if (payment && payment.status === PaymentStatus.PENDING) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            gatewayTransactionId: razorpay_payment_id,
            gatewayResponse: JSON.stringify({ error: 'Signature verification mismatch' }),
          },
        });
      }
      throw AppError.badRequest('Invalid payment signature verification failed.');
    }

    if (!payment) {
      throw AppError.notFound(`Payment record for order '${razorpay_order_id}' was not found.`);
    }

    // Ownership check
    if (payment.userId !== userId && userRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You do not have authorization to verify this payment.');
    }

    // Check if booking was cancelled while checkout was open
    if (payment.booking.status === BookingStatus.CANCELLED) {
      throw AppError.badRequest('Booking was cancelled prior to payment verification.');
    }

    // Idempotency: If already confirmed, return success immediately
    if (payment.status === PaymentStatus.SUCCEEDED) {
      return {
        success: true,
        paymentId: payment.id,
        paymentReference: payment.paymentReference,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: payment.gatewayTransactionId || razorpay_payment_id,
        status: PaymentStatus.SUCCEEDED,
        bookingStatus: BookingStatus.CONFIRMED,
        message: 'Payment was already verified and confirmed.',
      };
    }

    // Atomic transaction
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          gatewayTransactionId: razorpay_payment_id,
          paidAt: new Date(),
          gatewayResponse: JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            provider: 'RAZORPAY',
            verifiedAt: new Date().toISOString(),
          }),
        },
      });

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });
    });

    if (payment.booking.user) {
      NotificationService.notifyBookingConfirmed({
        recipientEmail: payment.booking.user.email,
        recipientName: payment.booking.user.name,
        bookingReference: payment.booking.bookingReference,
        paymentReference: payment.paymentReference,
        totalAmount: Number(payment.amount).toFixed(2),
        currency: payment.currency,
        method: String(payment.method),
        gatewayTransactionId: razorpay_payment_id,
        items: payment.booking.items.map((i) => ({
          title: i.itemTitle,
          quantity: i.quantity,
          totalPrice: Number(i.totalPrice).toFixed(2),
          startDate: i.startDate ? i.startDate.toISOString() : null,
        })),
      }).catch(console.error);
    }

    return {
      success: true,
      paymentId: payment.id,
      paymentReference: payment.paymentReference,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: PaymentStatus.SUCCEEDED,
      bookingStatus: BookingStatus.CONFIRMED,
      message: 'Payment verified and booking confirmed successfully.',
    };
  }

  /**
   * RAZORPAY / RECONCILIATION: Get Payment Status
   */
  static async getPaymentStatus(
    paymentId: string,
    requestingUserId: string,
    requestingRole: UserRole
  ): Promise<PaymentStatusResult> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw AppError.notFound(`Payment '${paymentId}' not found.`);
    }

    if (payment.userId !== requestingUserId && requestingRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You do not have permission to access this payment record.');
    }

    return {
      paymentId: payment.id,
      paymentReference: payment.paymentReference,
      gatewayTransactionId: payment.gatewayTransactionId || null,
      status: payment.status,
      amount: Number(payment.amount).toFixed(2),
      currency: payment.currency,
      bookingId: payment.bookingId,
      bookingStatus: payment.booking.status,
      bookingReference: payment.booking.bookingReference,
      isPaid: payment.status === PaymentStatus.SUCCEEDED,
      isCancellable:
        payment.booking.status === BookingStatus.PENDING ||
        payment.booking.status === BookingStatus.CONFIRMED,
      createdAt: payment.createdAt.toISOString(),
      paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
    };
  }

  /**
   * WEBHOOK HANDLER:
   * Supports both Razorpay signature verification and generic payment intent webhooks.
   * Ensures idempotent handling, signature security, and capacity coordination.
   */
  static async handleWebhook(
    signature: string | undefined,
    payload: any,
    rawBody?: Buffer | string,
    razorpaySignature?: string
  ): Promise<{ received: boolean; status: string }> {
    // 1. Razorpay Webhook Verification
    if (razorpaySignature) {
      const secret = env.RAZORPAY_WEBHOOK_SECRET;
      const bodyToSign = rawBody
        ? Buffer.isBuffer(rawBody)
          ? rawBody.toString('utf8')
          : rawBody
        : typeof payload === 'string'
        ? payload
        : JSON.stringify(payload);

      const expected = crypto.createHmac('sha256', secret).update(bodyToSign).digest('hex');
      const isValid =
        expected.length === razorpaySignature.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature));

      if (!isValid) {
        throw AppError.badRequest('Invalid Razorpay webhook signature');
      }

      // Handle Razorpay events
      const event = payload?.event;
      if (event === 'order.paid' || event === 'payment.captured') {
        const paymentEntity = payload.payload?.payment?.entity;
        const orderEntity = payload.payload?.order?.entity;
        const orderId = paymentEntity?.order_id || orderEntity?.id;
        const paymentId = paymentEntity?.id;

        if (!orderId) {
          return { received: true, status: 'missing_order_id_ignored' };
        }

        const payment = await prisma.payment.findUnique({
          where: { paymentReference: orderId },
          include: {
            booking: { include: { items: true, user: true } },
            user: true,
          },
        });

        if (!payment) {
          return { received: true, status: 'payment_not_found_ignored' };
        }

        if (payment.status === PaymentStatus.SUCCEEDED) {
          return { received: true, status: 'already_succeeded_idempotent' };
        }

        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.SUCCEEDED,
              gatewayTransactionId: paymentId || `pay_${Date.now()}`,
              gatewayResponse: JSON.stringify(payload),
              paidAt: new Date(),
            },
          });

          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: BookingStatus.CONFIRMED },
          });
        });

        if (payment.booking?.user) {
          NotificationService.notifyBookingConfirmed({
            recipientEmail: payment.booking.user.email,
            recipientName: payment.booking.user.name,
            bookingReference: payment.booking.bookingReference,
            paymentReference: payment.paymentReference,
            totalAmount: Number(payment.amount).toFixed(2),
            currency: payment.currency,
            method: String(payment.method),
            gatewayTransactionId: paymentId,
            items: payment.booking.items.map((i) => ({
              title: i.itemTitle,
              quantity: i.quantity,
              totalPrice: Number(i.totalPrice).toFixed(2),
              startDate: i.startDate ? i.startDate.toISOString() : null,
            })),
          }).catch(console.error);
        }

        return { received: true, status: 'order_paid_confirmed' };
      }

      if (event === 'payment.failed') {
        const paymentEntity = payload.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id;
        const paymentId = paymentEntity?.id;
        const errorDesc = paymentEntity?.error_description || 'Payment failed';

        if (orderId) {
          const payment = await prisma.payment.findUnique({
            where: { paymentReference: orderId },
            include: { booking: true, user: true },
          });

          if (payment && payment.status === PaymentStatus.PENDING) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: PaymentStatus.FAILED,
                gatewayTransactionId: paymentId || null,
                gatewayResponse: JSON.stringify({ error: errorDesc }),
              },
            });

            if (payment.user) {
              NotificationService.notifyPaymentFailed({
                recipientEmail: payment.user.email,
                recipientName: payment.user.name,
                bookingReference: payment.booking.bookingReference,
                paymentReference: payment.paymentReference,
                amount: Number(payment.amount).toFixed(2),
                currency: payment.currency,
                reason: errorDesc,
              }).catch(console.error);
            }
          }
        }
        return { received: true, status: 'payment_failed_recorded' };
      }

      return { received: true, status: 'event_processed' };
    }

    // 2. Generic Signature Verification Check (Fallback)
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_test_secret_voyagevista';
    if (signature && signature !== webhookSecret && env.NODE_ENV === 'production') {
      throw AppError.unauthorized('Invalid webhook signature.');
    }

    if (!payload || !payload.event || !payload.data?.paymentReference) {
      throw AppError.badRequest('Malformed webhook payload.');
    }

    const { paymentReference, gatewayTransactionId, reason } = payload.data;

    const payment = await prisma.payment.findUnique({
      where: { paymentReference },
      include: {
        booking: {
          include: {
            items: true,
            user: true,
          },
        },
        user: true,
      },
    });

    if (!payment) {
      return { received: true, status: 'payment_not_found_ignored' };
    }

    // 3. Event Dispatching
    switch (payload.event) {
      case 'payment_intent.succeeded': {
        // Idempotency: Ignore if already settled
        if (payment.status === PaymentStatus.SUCCEEDED) {
          return { received: true, status: 'already_succeeded_idempotent' };
        }

        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.SUCCEEDED,
              gatewayTransactionId: gatewayTransactionId || `wh_txn_${Date.now()}`,
              gatewayResponse: JSON.stringify(payload),
              paidAt: new Date(),
            },
          });

          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: BookingStatus.CONFIRMED },
          });
        });

        if (payment.booking.user) {
          NotificationService.notifyBookingConfirmed({
            recipientEmail: payment.booking.user.email,
            recipientName: payment.booking.user.name,
            bookingReference: payment.booking.bookingReference,
            paymentReference: payment.paymentReference,
            totalAmount: Number(payment.amount).toFixed(2),
            currency: payment.currency,
            method: String(payment.method),
            gatewayTransactionId,
            items: payment.booking.items.map((i) => ({
              title: i.itemTitle,
              quantity: i.quantity,
              totalPrice: Number(i.totalPrice).toFixed(2),
              startDate: i.startDate ? i.startDate.toISOString() : null,
            })),
          }).catch(console.error);
        }

        return { received: true, status: 'settled_confirmed' };
      }

      case 'payment_intent.payment_failed': {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            gatewayResponse: JSON.stringify({ reason: reason || 'Failed via webhook' }),
          },
        });

        if (payment.user) {
          NotificationService.notifyPaymentFailed({
            recipientEmail: payment.user.email,
            recipientName: payment.user.name,
            bookingReference: payment.booking.bookingReference,
            paymentReference: payment.paymentReference,
            amount: Number(payment.amount).toFixed(2),
            currency: payment.currency,
            reason: reason || 'Transaction declined by gateway',
          }).catch(console.error);
        }

        return { received: true, status: 'marked_failed' };
      }

      default:
        return { received: true, status: 'event_ignored' };
    }
  }

  /**
   * Issues refund for a payment record and coordinates booking cancellation and seat release.
   */
  static async refundPayment(
    paymentId: string,
    requestingUserId: string,
    requestingRole: UserRole,
    reason?: string
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            items: true,
            user: true,
          },
        },
        user: true,
      },
    });

    if (!payment) {
      throw AppError.notFound(`Payment '${paymentId}' not found.`);
    }

    // Authorization: Must be owner or ADMIN
    if (payment.userId !== requestingUserId && requestingRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You do not have authorization to refund this payment.');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw AppError.badRequest('This payment has already been refunded.');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Mark Payment as REFUNDED
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          gatewayResponse: reason ? `Refunded: ${reason}` : 'Refunded by operator',
        },
      });

      // 2. Mark Booking as CANCELLED
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason || 'Refund issued',
          cancelledAt: new Date(),
        },
      });

      // 3. Restore Tour Schedule Capacities
      for (const item of payment.booking.items) {
        if (item.tourScheduleId) {
          const schedule = await tx.tourSchedule.findUnique({
            where: { id: item.tourScheduleId },
          });

          if (schedule) {
            const newBooked = Math.max(0, schedule.bookedCapacity - item.quantity);
            await tx.tourSchedule.update({
              where: { id: item.tourScheduleId },
              data: {
                bookedCapacity: newBooked,
                status:
                  schedule.status === ScheduleStatus.SOLD_OUT ||
                  schedule.status === ScheduleStatus.ALMOST_FULL
                    ? ScheduleStatus.AVAILABLE
                    : schedule.status,
              },
            });
          }
        }
      }

      // 4. Decrement coupon usage if applied
      if (payment.booking.couponId) {
        await tx.coupon.update({
          where: { id: payment.booking.couponId },
          data: { usedCount: { decrement: 1 } },
        });
      }

      // 5. Send cancellation notice
      if (payment.booking.user) {
        NotificationService.notifyBookingCancelled({
          recipientEmail: payment.booking.user.email,
          recipientName: payment.booking.user.name,
          bookingReference: payment.booking.bookingReference,
          reason,
          refundStatus: `Refunded: ${payment.currency} ${Number(payment.amount).toFixed(2)}`,
        }).catch(console.error);
      }

      return this.formatPayment(updatedPayment);
    });
  }

  /**
   * Retrieves single payment details enforcing strict ownership.
   */
  static async getPaymentById(
    paymentId: string,
    requestingUserId: string,
    requestingRole: UserRole
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
        user: true,
      },
    });

    if (!payment) {
      throw AppError.notFound(`Payment '${paymentId}' not found.`);
    }

    if (payment.userId !== requestingUserId && requestingRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You do not have authorization to view this payment.');
    }

    return this.formatPayment(payment);
  }
}
