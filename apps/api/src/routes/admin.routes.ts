import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize, authorizeOwnerOrAdmin } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import {
  listUsersQuerySchema,
  listAdminBookingsQuerySchema,
  listPaymentsQuerySchema,
  updateBookingStatusSchema,
  updateUserRoleSchema,
  createCouponSchema,
} from '../validators/admin.validator.js';
import { AdminController } from '../controllers/admin.controller.js';
import { ApiResponseBuilder } from '../utils/apiResponse.js';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import { AuthService } from '../services/auth.service.js';

export const adminRouter = Router();

// Resource ownership endpoint: Accessible by ADMIN or the owning user
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

// All subsequent routes require ADMIN role strictly
adminRouter.use(authenticate, authorize(UserRole.ADMIN));

// Role-restricted dashboard landing check
adminRouter.get('/dashboard', (_req: Request, res: Response) => {
  ApiResponseBuilder.success(res, {
    message: 'Welcome to the VoyageVista Admin Dashboard',
    restrictedAccess: true,
    roleRequired: 'ADMIN',
  });
});

// High-level Platform Statistics
adminRouter.get('/stats', AdminController.getOverviewStats);

// Booking Management
adminRouter.get(
  '/bookings',
  validateRequest({ query: listAdminBookingsQuerySchema }),
  AdminController.listBookings
);

adminRouter.patch(
  '/bookings/:id/status',
  validateRequest({ params: uuidParamSchema, body: updateBookingStatusSchema }),
  AdminController.updateBookingStatus
);

// User Management
adminRouter.get(
  '/users',
  validateRequest({ query: listUsersQuerySchema }),
  AdminController.listUsers
);

adminRouter.patch(
  '/users/:id/role',
  validateRequest({ params: uuidParamSchema, body: updateUserRoleSchema }),
  AdminController.updateUserRole
);

// Payment & Refund Records
adminRouter.get(
  '/payments',
  validateRequest({ query: listPaymentsQuerySchema }),
  AdminController.listPayments
);

adminRouter.post(
  '/payments/:id/refund',
  validateRequest({ params: uuidParamSchema }),
  AdminController.refundPayment
);

// Coupons & Promotions Management
adminRouter.get('/coupons', AdminController.listCoupons);

adminRouter.post(
  '/coupons',
  validateRequest({ body: createCouponSchema }),
  AdminController.createCoupon
);

adminRouter.delete(
  '/coupons/:id',
  validateRequest({ params: uuidParamSchema }),
  AdminController.deleteCoupon
);
