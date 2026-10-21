import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';

export class ActivityController {
  static async listActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ActivityService.listActivities(req.query as never);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = String(req.params.idOrSlug);
      const activity = await ActivityService.getActivityByIdOrSlug(idOrSlug);
      ApiResponseBuilder.success(res, activity);
    } catch (err) {
      next(err);
    }
  }

  static async createActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await ActivityService.createActivity(req.body);
      ApiResponseBuilder.success(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await ActivityService.updateActivity(id, req.body);
      ApiResponseBuilder.success(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await ActivityService.deleteActivity(id);
      ApiResponseBuilder.success(res, { message: 'Activity deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
