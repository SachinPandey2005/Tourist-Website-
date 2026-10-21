import { Request, Response, NextFunction } from 'express';
import { HotelService } from '../services/hotel.service.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';

export class HotelController {
  static async listHotels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await HotelService.listHotels(req.query as never);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = String(req.params.idOrSlug);
      const hotel = await HotelService.getHotelByIdOrSlug(idOrSlug);
      ApiResponseBuilder.success(res, hotel);
    } catch (err) {
      next(err);
    }
  }

  static async createHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await HotelService.createHotel(req.body);
      ApiResponseBuilder.success(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const updated = await HotelService.updateHotel(id, req.body);
      ApiResponseBuilder.success(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await HotelService.deleteHotel(id);
      ApiResponseBuilder.success(res, { message: 'Hotel deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
