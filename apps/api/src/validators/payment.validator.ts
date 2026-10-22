import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const createPaymentSessionSchema = z.object({
  bookingId: z.string().uuid('Booking ID must be a valid UUID'),
  method: z.nativeEnum(PaymentMethod).optional(),
});

export const processPaymentSchema = z.object({
  paymentId: z.string().uuid('Payment ID must be a valid UUID'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  cardholderName: z.string().min(1, 'Cardholder name is required').max(100).optional(),
  cardNumber: z.string().min(12).max(20).optional(),
  expiryDate: z.string().min(4).max(7).optional(),
  cvv: z.string().min(3).max(4).optional(),
});

export const refundPaymentSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const createRazorpayOrderSchema = z.object({
  bookingId: z.string().uuid('Booking ID must be a valid UUID'),
  currency: z.string().min(3).max(3).optional(),
});

export const verifyRazorpayPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'razorpay_order_id is required'),
  razorpay_payment_id: z.string().min(1, 'razorpay_payment_id is required'),
  razorpay_signature: z.string().min(1, 'razorpay_signature is required'),
  paymentId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
});

export const paymentIdParamSchema = z.object({
  paymentId: z.string().uuid('paymentId must be a valid UUID'),
});

