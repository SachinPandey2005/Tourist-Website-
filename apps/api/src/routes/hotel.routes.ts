import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { HotelController } from '../controllers/hotel.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import { idOrSlugParamSchema } from '../validators/destination.validator.js';
import {
  listHotelsQuerySchema,
  createHotelSchema,
  updateHotelSchema,
} from '../validators/hotel.validator.js';

export const hotelRouter = Router();

// Public Hotel Discovery
hotelRouter.get(
  '/',
  validateRequest({ query: listHotelsQuerySchema }),
  HotelController.listHotels
);

hotelRouter.get(
  '/:idOrSlug',
  validateRequest({ params: idOrSlugParamSchema }),
  HotelController.getHotel
);

// Admin-Only Accommodation Management
hotelRouter.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ body: createHotelSchema }),
  HotelController.createHotel
);

hotelRouter.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: uuidParamSchema, body: updateHotelSchema }),
  HotelController.updateHotel
);

hotelRouter.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: uuidParamSchema }),
  HotelController.deleteHotel
);
