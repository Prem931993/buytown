import { Router } from 'express';
import * as userProductController from '../controllers/userProduct.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = Router();

// User product listing with filters using POST method
router.post('/', verifyUserDualAuth, userProductController.getUserProducts);

export default router;
