import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';
import {
  createBookingSchema,
  listBookingsQuerySchema,
  checkAvailabilitySchema,
  quoteBookingSchema,
  cancelBookingSchema,
} from '../validators/booking.validator.js';

export const bookingRouter = Router();

// Public / Pre-checkout endpoints
// 1. Check item inventory & departure availability
bookingRouter.post(
  '/check-availability',
  validateRequest({ body: checkAvailabilitySchema }),
  BookingController.checkAvailability
);

// 2. Server-authoritative price quote & coupon discount calculation
bookingRouter.post(
  '/quote',
  validateRequest({ body: quoteBookingSchema }),
  BookingController.calculateQuote
);

// Protected Booking Management (Requires Authentication)
bookingRouter.use(authenticate);

// List authenticated user's bookings
bookingRouter.get(
  '/',
  validateRequest({ query: listBookingsQuerySchema }),
  BookingController.listMyBookings
);

// Create a new PENDING booking
bookingRouter.post(
  '/',
  validateRequest({ body: createBookingSchema }),
  BookingController.createBooking
);

// Get single booking details (ownership check enforced in service)
bookingRouter.get(
  '/:id',
  validateRequest({ params: uuidParamSchema }),
  BookingController.getBooking
);

// Cancel an existing booking according to explicit eligibility rules
bookingRouter.post(
  '/:id/cancel',
  validateRequest({ params: uuidParamSchema, body: cancelBookingSchema }),
  BookingController.cancelBooking
);
