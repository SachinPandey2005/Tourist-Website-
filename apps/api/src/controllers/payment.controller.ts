import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';

export class PaymentController {
  static async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await PaymentService.createPaymentSession(userId, req.body);
      ApiResponseBuilder.success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async processPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await PaymentService.processPayment(userId, req.body);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = (req.headers['stripe-signature'] || req.headers['x-webhook-signature']) as string | undefined;
      const result = await PaymentService.handleWebhook(signature, req.body);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async refundPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = String(req.params.id);
      const reason = typeof req.body?.reason === 'string' ? req.body.reason : undefined;
      const result = await PaymentService.refundPayment(
        paymentId,
        req.user!.id,
        req.user!.role,
        reason
      );
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = String(req.params.id);
      const result = await PaymentService.getPaymentById(
        paymentId,
        req.user!.id,
        req.user!.role
      );
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}
