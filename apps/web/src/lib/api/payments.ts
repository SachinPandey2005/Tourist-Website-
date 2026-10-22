import { apiClient } from './client.js';
import type {
  PaymentDto,
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

export interface RefundPaymentInput {
  reason?: string;
}

export const paymentsApi = {
  /**
   * RAZORPAY: Creates a Razorpay Order and stages payment record on the server.
   */
  createRazorpayOrder: async (payload: CreateRazorpayOrderInput): Promise<RazorpayOrderResult> => {
    return apiClient.post<RazorpayOrderResult>('/api/payments/create-order', payload);
  },

  /**
   * RAZORPAY: Submits frontend Razorpay checkout response for backend cryptographic signature verification.
   */
  verifyRazorpayPayment: async (
    payload: VerifyRazorpayPaymentInput
  ): Promise<VerifyRazorpayPaymentResult> => {
    return apiClient.post<VerifyRazorpayPaymentResult>('/api/payments/verify', payload);
  },

  /**
   * RAZORPAY: Queries real-time server payment and reconciliation status.
   */
  getPaymentStatus: async (paymentId: string): Promise<PaymentStatusResult> => {
    return apiClient.get<PaymentStatusResult>(`/api/payments/${paymentId}/status`);
  },

  /**
   * Initializes a secure checkout payment session for a pending booking.
   */
  createSession: async (payload: CreatePaymentSessionInput): Promise<PaymentSessionResult> => {
    return apiClient.post<PaymentSessionResult>('/api/payments/session', payload);
  },

  /**
   * Processes a direct card, bank, or gateway payment settlement.
   */
  processPayment: async (payload: ProcessPaymentInput): Promise<ProcessPaymentResult> => {
    return apiClient.post<ProcessPaymentResult>('/api/payments/process', payload);
  },

  /**
   * Retrieves payment transaction details by ID with ownership verification.
   */
  getPaymentDetails: async (id: string): Promise<PaymentDto> => {
    return apiClient.get<PaymentDto>(`/api/payments/${id}`);
  },

  /**
   * Issues a refund for an eligible payment transaction.
   */
  refundPayment: async (id: string, payload?: RefundPaymentInput): Promise<PaymentDto> => {
    return apiClient.post<PaymentDto>(`/api/payments/${id}/refund`, payload || {});
  },
};

