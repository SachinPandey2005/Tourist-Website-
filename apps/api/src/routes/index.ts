import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { adminRouter } from './admin.routes.js';
import { destinationRouter } from './destination.routes.js';
import { tourRouter } from './tour.routes.js';
import { hotelRouter } from './hotel.routes.js';
import { activityRouter } from './activity.routes.js';
import { reviewRouter } from './review.routes.js';
import { bookingRouter } from './booking.routes.js';
import { favoriteRouter } from './favorite.routes.js';

export const apiRouter = Router();

// Sub-route registrations
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/destinations', destinationRouter);
apiRouter.use('/tours', tourRouter);
apiRouter.use('/hotels', hotelRouter);
apiRouter.use('/activities', activityRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/bookings', bookingRouter);
apiRouter.use('/favorites', favoriteRouter);
