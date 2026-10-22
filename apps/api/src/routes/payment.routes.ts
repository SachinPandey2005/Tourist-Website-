import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import {
  createPaymentSessionSchema,
  processPaymentSchema,
  refundPaymentSchema,
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
  paymentIdParamSchema,
} from '../validators/payment.validator.js';

export const paymentRouter = Router();

// 1. Asynchronous Gateway Webhook (Signature-validated callback)
paymentRouter.post('/webhook', PaymentController.handleWebhook);

// Protected Payment Operations (Requires Authentication)
paymentRouter.use(authenticate);

// 2. Razorpay: Create Order
paymentRouter.post(
  '/create-order',
  validateRequest({ body: createRazorpayOrderSchema }),
  PaymentController.createOrder
);

// 3. Razorpay: Verify Payment Signature
paymentRouter.post(
  '/verify',
  validateRequest({ body: verifyRazorpayPaymentSchema }),
  PaymentController.verifyPayment
);

// 4. Razorpay / Payment Reconciliation: Status Check
paymentRouter.get(
  '/:paymentId/status',
  validateRequest({ params: paymentIdParamSchema }),
  PaymentController.getStatus
);

// 5. Initialize Payment Session / Intent (Phase 10 direct session)
paymentRouter.post(
  '/session',
  validateRequest({ body: createPaymentSessionSchema }),
  PaymentController.createSession
);

// 6. Confirm / Process Direct Settlement
paymentRouter.post(
  '/process',
  validateRequest({ body: processPaymentSchema }),
  PaymentController.processPayment
);

// 7. Retrieve Payment Details (Ownership Check)
paymentRouter.get(
  '/:id',
  validateRequest({ params: uuidParamSchema }),
  PaymentController.getPayment
);

// 8. Issue Refund (Owner or Admin Authorization)
paymentRouter.post(
  '/:id/refund',
  validateRequest({ params: uuidParamSchema, body: refundPaymentSchema }),
  PaymentController.refundPayment
);

