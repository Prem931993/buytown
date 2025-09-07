import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = Router();

// User API route to get all enabled categories with images
router.get('/', verifyUserDualAuth, categoryController.getAllEnabledCategoriesWithImages);

export default router;
