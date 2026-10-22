import { apiClient } from './client.js';
import type {
  PaymentDto,
  CreatePaymentSessionInput,
  PaymentSessionResult,
  ProcessPaymentInput,
  ProcessPaymentResult,
} from '@tourist/shared';

export interface RefundPaymentInput {
  reason?: string;
}

export const paymentsApi = {
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
