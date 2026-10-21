import { Router } from 'express';
import { FavoriteController } from '../controllers/favorite.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../validators/common.validator.js';

export const favoriteRouter = Router();

// All favorite routes require authentication
favoriteRouter.use(authenticate);

favoriteRouter.get('/', FavoriteController.listFavorites);
favoriteRouter.post('/', FavoriteController.addFavorite);
favoriteRouter.delete('/:id', validateRequest({ params: uuidParamSchema }), FavoriteController.removeFavorite);
