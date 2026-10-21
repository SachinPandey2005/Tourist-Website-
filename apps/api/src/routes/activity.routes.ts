import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ActivityController } from '../controllers/activity.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import { idOrSlugParamSchema } from '../validators/destination.validator.js';
import {
  listActivitiesQuerySchema,
  createActivitySchema,
  updateActivitySchema,
} from '../validators/activity.validator.js';

export const activityRouter = Router();

// Public Activity Discovery
activityRouter.get(
  '/',
  validateRequest({ query: listActivitiesQuerySchema }),
  ActivityController.listActivities
);

activityRouter.get(
  '/:idOrSlug',
  validateRequest({ params: idOrSlugParamSchema }),
  ActivityController.getActivity
);

// Admin-Only Activity Management
activityRouter.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ body: createActivitySchema }),
  ActivityController.createActivity
);

activityRouter.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: uuidParamSchema, body: updateActivitySchema }),
  ActivityController.updateActivity
);

activityRouter.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: uuidParamSchema }),
  ActivityController.deleteActivity
);
