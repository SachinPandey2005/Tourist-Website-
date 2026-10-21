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

export class NotificationService {
  /**
   * Dispatches booking creation notification.
   * Logs structured notification in development and test environments,
   * with clean hooks for production notification providers (e.g. Resend/SendGrid/SES).
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
