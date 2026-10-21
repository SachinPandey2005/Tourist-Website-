import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize, authorizeOwnerOrAdmin } from '../middleware/auth.middleware.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import { AuthService } from '../services/auth.service.js';

export const adminRouter = Router();

// 1. Role-restricted endpoint: Only accessible by users with ADMIN role
adminRouter.get(
  '/dashboard',
  authenticate,
  authorize(UserRole.ADMIN),
  (_req: Request, res: Response) => {
    ApiResponseBuilder.success(res, {
      message: 'Welcome to the VoyageVista Admin Dashboard',
      restrictedAccess: true,
      roleRequired: 'ADMIN',
    });
  }
);

// 2. Resource ownership endpoint: Accessible by ADMIN or the owning user
adminRouter.get(
  '/users/:userId',
  authenticate,
  authorizeOwnerOrAdmin((req) => (typeof req.params.userId === 'string' ? req.params.userId : undefined)),
  async (req: Request, res: Response, next) => {
    try {
      const targetUserId = typeof req.params.userId === 'string' ? req.params.userId : '';
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!user) {
        throw AppError.notFound('Target user not found.');
      }

      ApiResponseBuilder.success(res, AuthService.formatAuthUser(user));
    } catch (err) {
      next(err);
    }
  }
);
