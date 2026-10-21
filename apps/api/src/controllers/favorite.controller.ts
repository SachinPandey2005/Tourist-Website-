import { Request, Response, NextFunction } from 'express';
import { FavoriteService } from '../services/favorite.service.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';

export class FavoriteController {
  static async listFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const favorites = await FavoriteService.listUserFavorites(userId);
      ApiResponseBuilder.success(res, favorites);
    } catch (err) {
      next(err);
    }
  }

  static async addFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await FavoriteService.addFavorite(userId, req.body);
      ApiResponseBuilder.success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async removeFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const favoriteId = String(req.params.id);
      const result = await FavoriteService.removeFavorite(userId, favoriteId);
      ApiResponseBuilder.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}
