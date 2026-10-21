import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';

export class BookingController {
  static async listMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await BookingService.listUserBookings(userId, req.query as never);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingId = String(req.params.id);
      const booking = await BookingService.getBookingById(
        bookingId,
        req.user!.id,
        req.user!.role
      );
      ApiResponseBuilder.success(res, booking);
    } catch (err) {
      next(err);
    }
  }

  static async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingId = String(req.params.id);
      const reason = typeof req.body?.reason === 'string' ? req.body.reason : undefined;
      const cancelled = await BookingService.cancelBooking(
        bookingId,
        req.user!.id,
        req.user!.role,
        reason
      );
      ApiResponseBuilder.success(res, cancelled);
    } catch (err) {
      next(err);
    }
  }

  static async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const booking = await BookingService.createBooking(userId, req.body);
      ApiResponseBuilder.success(res, booking, 201);
    } catch (err) {
      next(err);
    }
  }
}
