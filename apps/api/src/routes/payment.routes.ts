import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import {
  createPaymentSessionSchema,
  processPaymentSchema,
  refundPaymentSchema,
} from '../validators/payment.validator.js';

export const paymentRouter = Router();

// 1. Asynchronous Gateway Webhook (Signature-validated callback)
paymentRouter.post('/webhook', PaymentController.handleWebhook);

// Protected Payment Operations (Requires Authentication)
paymentRouter.use(authenticate);

// 2. Initialize Payment Session / Intent
paymentRouter.post(
  '/session',
  validateRequest({ body: createPaymentSessionSchema }),
  PaymentController.createSession
);

// 3. Confirm / Process Direct Settlement
paymentRouter.post(
  '/process',
  validateRequest({ body: processPaymentSchema }),
  PaymentController.processPayment
);

// 4. Retrieve Payment Details (Ownership Check)
paymentRouter.get(
  '/:id',
  validateRequest({ params: uuidParamSchema }),
  PaymentController.getPayment
);

// 5. Issue Refund (Owner or Admin Authorization)
paymentRouter.post(
  '/:id/refund',
  validateRequest({ params: uuidParamSchema, body: refundPaymentSchema }),
  PaymentController.refundPayment
);
