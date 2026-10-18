import { Router } from 'express';
import { healthRouter } from './health.routes.js';

export const apiRouter = Router();

// Sub-route registrations
apiRouter.use('/health', healthRouter);
