import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';
import { getAuthCookieOptions } from '../utils/jwt.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.cookie('token', result.token, getAuthCookieOptions());
      ApiResponseBuilder.success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.cookie('token', result.token, getAuthCookieOptions());
      ApiResponseBuilder.success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await AuthService.logout(req.user.id);
      }
      res.clearCookie('token', {
        ...getAuthCookieOptions(),
        maxAge: 0,
      });
      ApiResponseBuilder.success(
        res,
        { message: 'Logged out successfully and revoked active sessions.' },
        200
      );
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getProfile(req.user!.id);
      ApiResponseBuilder.success(res, user, 200);
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedUser = await AuthService.updateProfile(req.user!.id, req.body);
      ApiResponseBuilder.success(res, updatedUser, 200);
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.changePassword(req.user!.id, req.body);
      res.cookie('token', result.token, getAuthCookieOptions());
      ApiResponseBuilder.success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body);
      ApiResponseBuilder.success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.resetPassword(req.body);
      ApiResponseBuilder.success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }
}
