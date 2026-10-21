import { Request, Response, NextFunction } from 'express';
import { TourService } from '../services/tour.service.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';

export class TourController {
  static async listTours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TourService.listTours(req.query as never);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getTour(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = String(req.params.idOrSlug);
      const tour = await TourService.getTourByIdOrSlug(idOrSlug);
      ApiResponseBuilder.success(res, tour);
    } catch (err) {
      next(err);
    }
  }

  static async createTour(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await TourService.createTour(req.body);
      ApiResponseBuilder.success(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateTour(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await TourService.updateTour(id, req.body);
      ApiResponseBuilder.success(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteTour(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await TourService.deleteTour(id);
      ApiResponseBuilder.success(res, { message: 'Tour package deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // SCHEDULES & CAPACITY
  // =========================================================================

  static async listSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tourId = String(req.params.tourId);
      const schedules = await TourService.listSchedules(tourId);
      ApiResponseBuilder.success(res, schedules);
    } catch (err) {
      next(err);
    }
  }

  static async createSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tourId = String(req.params.tourId);
      const created = await TourService.createSchedule(tourId, req.body);
      ApiResponseBuilder.success(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scheduleId = String(req.params.scheduleId);
      const updated = await TourService.updateSchedule(scheduleId, req.body);
      ApiResponseBuilder.success(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scheduleId = String(req.params.scheduleId);
      await TourService.deleteSchedule(scheduleId);
      ApiResponseBuilder.success(res, { message: 'Tour schedule deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
