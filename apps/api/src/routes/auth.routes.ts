import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/authRateLimiter.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator.js';

export const authRouter = Router();

// Public Authentication Endpoints (protected by authRateLimiter against brute-force)
authRouter.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  AuthController.register
);

authRouter.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  AuthController.login
);

authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  AuthController.forgotPassword
);

authRouter.post(
  '/reset-password',
  authRateLimiter,
  validateRequest({ body: resetPasswordSchema }),
  AuthController.resetPassword
);

// Authenticated Endpoints
authRouter.post('/logout', authenticate, AuthController.logout);

authRouter.get('/profile', authenticate, AuthController.getProfile);
authRouter.get('/me', authenticate, AuthController.getProfile);

authRouter.patch(
  '/profile',
  authenticate,
  validateRequest({ body: updateProfileSchema }),
  AuthController.updateProfile
);

authRouter.post(
  '/change-password',
  authenticate,
  validateRequest({ body: changePasswordSchema }),
  AuthController.changePassword
);
