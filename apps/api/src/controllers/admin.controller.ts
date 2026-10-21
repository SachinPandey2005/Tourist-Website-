import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';

export class AdminController {
  static async getOverviewStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminService.getOverviewStats();
      ApiResponseBuilder.success(res, stats);
    } catch (err) {
      next(err);
    }
  }

  static async listBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.listAllBookings(req.query as never);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async updateBookingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingId = String(req.params.id);
      const updated = await AdminService.updateBookingStatus(bookingId, req.body.status);
      ApiResponseBuilder.success(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.listUsers(req.query as never);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.id);
      const updated = await AdminService.updateUserRole(userId, req.body.role);
      ApiResponseBuilder.success(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.listPayments(req.query as never);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async refundPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = String(req.params.id);
      const result = await AdminService.refundPayment(paymentId);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async listCoupons(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupons = await AdminService.listCoupons();
      ApiResponseBuilder.success(res, coupons);
    } catch (err) {
      next(err);
    }
  }

  static async createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await AdminService.createCoupon(req.body);
      ApiResponseBuilder.success(res, coupon, 201);
    } catch (err) {
      next(err);
    }
  }

  static async deleteCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const couponId = String(req.params.id);
      const result = await AdminService.deleteCoupon(couponId);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}
