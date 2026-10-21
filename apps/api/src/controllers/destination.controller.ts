import { Request, Response, NextFunction } from 'express';
import { DestinationService } from '../services/destination.service.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';

export class DestinationController {
  static async listDestinations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await DestinationService.listDestinations(req.query as never);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getDestination(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = String(req.params.idOrSlug);
      const destination = await DestinationService.getDestinationByIdOrSlug(idOrSlug);
      ApiResponseBuilder.success(res, destination);
    } catch (err) {
      next(err);
    }
  }

  static async createDestination(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await DestinationService.createDestination(req.body);
      ApiResponseBuilder.success(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateDestination(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await DestinationService.updateDestination(id, req.body);
      ApiResponseBuilder.success(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteDestination(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await DestinationService.deleteDestination(id);
      ApiResponseBuilder.success(res, { message: 'Destination deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
