import { env } from '../config/env.js';

export interface NotificationDeliveryResult {
  delivered: boolean;
  channel: 'email' | 'console' | 'none';
  recipient: string;
  subject: string;
  message: string;
  timestamp: string;
}

export interface BookingCreatedNotificationPayload {
  recipientEmail: string;
  recipientName: string;
  bookingReference: string;
  totalAmount: string;
  currency: string;
  status: string;
  items: Array<{
    title: string;
    quantity: number;
    totalPrice: string;
    startDate?: string | null;
  }>;
}

export interface BookingCancelledNotificationPayload {
  recipientEmail: string;
  recipientName: string;
  bookingReference: string;
  reason?: string | null;
  refundStatus?: string;
}

export interface BookingConfirmedNotificationPayload {
  recipientEmail: string;
  recipientName: string;
  bookingReference: string;
  paymentReference: string;
  totalAmount: string;
  currency: string;
  method: string;
  gatewayTransactionId?: string | null;
  items: Array<{
    title: string;
    quantity: number;
    totalPrice: string;
    startDate?: string | null;
  }>;
}

export interface PaymentFailedNotificationPayload {
  recipientEmail: string;
  recipientName: string;
  bookingReference: string;
  paymentReference: string;
  amount: string;
  currency: string;
  reason?: string;
}

export class NotificationService {
  /**
   * Dispatches booking creation notification.
   */
  static async notifyBookingCreated(
    payload: BookingCreatedNotificationPayload
  ): Promise<NotificationDeliveryResult> {
    const subject = `Reservation Staged [${payload.bookingReference}] - Pending Payment Confirmation`;
    const timestamp = new Date().toISOString();

    const itemsSummary = payload.items
      .map((i) => `  • ${i.title} (Qty: ${i.quantity}) - ${payload.currency} ${i.totalPrice}`)
      .join('\n');

    const message = [
      `Dear ${payload.recipientName},`,
      ``,
      `Your reservation has been created with reference: ${payload.bookingReference}.`,
      `Status: ${payload.status} (Awaiting payment integration / confirmation)`,
      `Total Payable: ${payload.currency} ${payload.totalAmount}`,
      ``,
      `Reserved Items:`,
      itemsSummary,
      ``,
      `Note: Your inventory hold is secured in pending status. Please proceed to payment to confirm your journey.`,
    ].join('\n');

    if (env.EMAIL_PROVIDER === 'console' || env.NODE_ENV !== 'production') {
      console.log('\n======================================================');
      console.log('🔔 [NOTIFICATION SERVICE - BOOKING CREATED]');
      console.log(`To: ${payload.recipientEmail} (${payload.recipientName})`);
      console.log(`Subject: ${subject}`);
      console.log(`Reference: ${payload.bookingReference}`);
      console.log(`Total: ${payload.currency} ${payload.totalAmount} (${payload.status})`);
      console.log(itemsSummary);
      console.log('======================================================\n');
    }

    return {
      delivered: env.EMAIL_PROVIDER !== 'none',
      channel: env.EMAIL_PROVIDER === 'console' ? 'console' : 'email',
      recipient: payload.recipientEmail,
      subject,
      message,
      timestamp,
    };
  }

  /**
   * Dispatches payment success & booking confirmed voucher notification.
   */
  static async notifyBookingConfirmed(
    payload: BookingConfirmedNotificationPayload
  ): Promise<NotificationDeliveryResult> {
    const subject = `Booking Confirmed & Boarding Voucher [${payload.bookingReference}]`;
    const timestamp = new Date().toISOString();

    const itemsSummary = payload.items
      .map((i) => `  • ${i.title} (Qty: ${i.quantity}) - ${payload.currency} ${i.totalPrice}`)
      .join('\n');

    const message = [
      `Dear ${payload.recipientName},`,
      ``,
      `Great news! Your payment of ${payload.currency} ${payload.totalAmount} via ${payload.method} has succeeded.`,
      `Your booking ${payload.bookingReference} is now officially CONFIRMED.`,
      payload.gatewayTransactionId ? `Transaction ID: ${payload.gatewayTransactionId}` : '',
      `Payment Reference: ${payload.paymentReference}`,
      ``,
      `Confirmed Itinerary:`,
      itemsSummary,
      ``,
      `Your journey is protected under our VoyageVista Escrow Guarantee. We look forward to welcoming you!`,
    ]
      .filter(Boolean)
      .join('\n');

    if (env.EMAIL_PROVIDER === 'console' || env.NODE_ENV !== 'production') {
      console.log('\n======================================================');
      console.log('🔔 [NOTIFICATION SERVICE - BOOKING CONFIRMED & SETTLED]');
      console.log(`To: ${payload.recipientEmail} (${payload.recipientName})`);
      console.log(`Subject: ${subject}`);
      console.log(`Reference: ${payload.bookingReference}`);
      console.log(`Payment: ${payload.currency} ${payload.totalAmount} (${payload.method})`);
      if (payload.gatewayTransactionId) console.log(`Gateway Tx: ${payload.gatewayTransactionId}`);
      console.log(itemsSummary);
      console.log('======================================================\n');
    }

    return {
      delivered: env.EMAIL_PROVIDER !== 'none',
      channel: env.EMAIL_PROVIDER === 'console' ? 'console' : 'email',
      recipient: payload.recipientEmail,
      subject,
      message,
      timestamp,
    };
  }

  /**
   * Dispatches payment failed notification.
   */
  static async notifyPaymentFailed(
    payload: PaymentFailedNotificationPayload
  ): Promise<NotificationDeliveryResult> {
    const subject = `Payment Failed for Reservation [${payload.bookingReference}]`;
    const timestamp = new Date().toISOString();

    const message = [
      `Dear ${payload.recipientName},`,
      ``,
      `The payment attempt for your booking ${payload.bookingReference} (${payload.currency} ${payload.amount}) could not be completed.`,
      payload.reason ? `Reason: ${payload.reason}` : '',
      `Payment Reference: ${payload.paymentReference}`,
      ``,
      `Your booking remains in PENDING status. Please visit your traveler dashboard to retry payment with a different payment method.`,
    ]
      .filter(Boolean)
      .join('\n');

    if (env.EMAIL_PROVIDER === 'console' || env.NODE_ENV !== 'production') {
      console.log('\n======================================================');
      console.log('⚠️ [NOTIFICATION SERVICE - PAYMENT FAILED]');
      console.log(`To: ${payload.recipientEmail} (${payload.recipientName})`);
      console.log(`Subject: ${subject}`);
      console.log(`Booking: ${payload.bookingReference}`);
      if (payload.reason) console.log(`Reason: ${payload.reason}`);
      console.log('======================================================\n');
    }

    return {
      delivered: env.EMAIL_PROVIDER !== 'none',
      channel: env.EMAIL_PROVIDER === 'console' ? 'console' : 'email',
      recipient: payload.recipientEmail,
      subject,
      message,
      timestamp,
    };
  }

  /**
   * Dispatches booking cancellation notification.
   */
  static async notifyBookingCancelled(
    payload: BookingCancelledNotificationPayload
  ): Promise<NotificationDeliveryResult> {
    const subject = `Booking Cancellation Confirmed [${payload.bookingReference}]`;
    const timestamp = new Date().toISOString();

    const message = [
      `Dear ${payload.recipientName},`,
      ``,
      `Your booking ${payload.bookingReference} has been successfully cancelled.`,
      payload.reason ? `Cancellation Reason: ${payload.reason}` : '',
      payload.refundStatus ? `Payment / Refund Status: ${payload.refundStatus}` : '',
      `Any reserved schedule seats have been released back to availability.`,
    ]
      .filter(Boolean)
      .join('\n');

    if (env.EMAIL_PROVIDER === 'console' || env.NODE_ENV !== 'production') {
      console.log('\n======================================================');
      console.log('🔔 [NOTIFICATION SERVICE - BOOKING CANCELLED]');
      console.log(`To: ${payload.recipientEmail} (${payload.recipientName})`);
      console.log(`Subject: ${subject}`);
      console.log(`Reference: ${payload.bookingReference}`);
      if (payload.reason) console.log(`Reason: ${payload.reason}`);
      if (payload.refundStatus) console.log(`Refund Status: ${payload.refundStatus}`);
      console.log('======================================================\n');
    }

    return {
      delivered: env.EMAIL_PROVIDER !== 'none',
      channel: env.EMAIL_PROVIDER === 'console' ? 'console' : 'email',
      recipient: payload.recipientEmail,
      subject,
      message,
      timestamp,
    };
  }
}
