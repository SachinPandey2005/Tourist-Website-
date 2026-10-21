import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { DestinationController } from '../controllers/destination.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import {
  listDestinationsQuerySchema,
  idOrSlugParamSchema,
  createDestinationSchema,
  updateDestinationSchema,
} from '../validators/destination.validator.js';

export const destinationRouter = Router();

// Public Discovery Endpoints
destinationRouter.get(
  '/',
  validateRequest({ query: listDestinationsQuerySchema }),
  DestinationController.listDestinations
);

destinationRouter.get(
  '/:idOrSlug',
  validateRequest({ params: idOrSlugParamSchema }),
  DestinationController.getDestination
);

// Admin-Only Catalog Management Endpoints
destinationRouter.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ body: createDestinationSchema }),
  DestinationController.createDestination
);

destinationRouter.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: uuidParamSchema, body: updateDestinationSchema }),
  DestinationController.updateDestination
);

destinationRouter.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: uuidParamSchema }),
  DestinationController.deleteDestination
);
