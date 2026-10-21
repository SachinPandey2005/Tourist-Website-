import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { TourController } from '../controllers/tour.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import {
  listToursQuerySchema,
  createTourPackageSchema,
  updateTourPackageSchema,
  createTourScheduleSchema,
  updateTourScheduleSchema,
  tourScheduleParamsSchema,
} from '../validators/tour.validator.js';
import { idOrSlugParamSchema } from '../validators/destination.validator.js';

export const tourRouter = Router();

// Public Tour Discovery Endpoints
tourRouter.get(
  '/',
  validateRequest({ query: listToursQuerySchema }),
  TourController.listTours
);

tourRouter.get(
  '/:idOrSlug',
  validateRequest({ params: idOrSlugParamSchema }),
  TourController.getTour
);

// Admin-Only Tour Management
tourRouter.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ body: createTourPackageSchema }),
  TourController.createTour
);

tourRouter.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: uuidParamSchema, body: updateTourPackageSchema }),
  TourController.updateTour
);

tourRouter.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: uuidParamSchema }),
  TourController.deleteTour
);

// Tour Schedules & Capacity Management Endpoints
tourRouter.get(
  '/:tourId/schedules',
  TourController.listSchedules
);

tourRouter.post(
  '/:tourId/schedules',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ body: createTourScheduleSchema }),
  TourController.createSchedule
);

tourRouter.patch(
  '/:tourId/schedules/:scheduleId',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: tourScheduleParamsSchema, body: updateTourScheduleSchema }),
  TourController.updateSchedule
);

tourRouter.delete(
  '/:tourId/schedules/:scheduleId',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: tourScheduleParamsSchema }),
  TourController.deleteSchedule
);
