import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import { createBookingSchema, listBookingsQuerySchema } from '../validators/booking.validator.js';

export const bookingRouter = Router();

// All booking routes require authentication
bookingRouter.use(authenticate);

// List authenticated user's bookings
bookingRouter.get(
  '/',
  validateRequest({ query: listBookingsQuerySchema }),
  BookingController.listMyBookings
);

// Get single booking details (ownership check enforced in service)
bookingRouter.get(
  '/:id',
  validateRequest({ params: uuidParamSchema }),
  BookingController.getBooking
);

// Create a new booking
bookingRouter.post(
  '/',
  validateRequest({ body: createBookingSchema }),
  BookingController.createBooking
);

// Cancel an existing booking
bookingRouter.post(
  '/:id/cancel',
  validateRequest({ params: uuidParamSchema }),
  BookingController.cancelBooking
);
