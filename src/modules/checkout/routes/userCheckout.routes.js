import { Router } from 'express';
import * as userCheckoutController from '../controllers/userCheckout.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = Router();

// Create new order (checkout)
router.post('/', verifyUserDualAuth, userCheckoutController.createOrder);

// Get user's orders
router.get('/orders', verifyUserDualAuth, userCheckoutController.getUserOrders);

export default router;
