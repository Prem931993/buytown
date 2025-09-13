import { Router } from 'express';
import * as brandController from '../controllers/brand.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = Router();

// User product listing with filters using POST method
router.get('/', verifyUserDualAuth, brandController.getAllBrands);

export default router;
