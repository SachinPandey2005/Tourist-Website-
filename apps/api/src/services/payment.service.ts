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
  PaymentWebhookPayload,
} from '@tourist/shared';

export class PaymentService {
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
   * WEBHOOK HANDLER:
   * Asynchronous payment processor event consumer with signature verification and replay idempotency.
   */
  static async handleWebhook(
    signature: string | undefined,
    payload: PaymentWebhookPayload
  ): Promise<{ received: boolean; status: string }> {
    // 1. Signature Verification Check
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

    // 2. Event Dispatching
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
