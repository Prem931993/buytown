import { Router } from 'express';
import * as userCheckoutController from '../controllers/userCheckout.controller.js';
import * as paymentMethodController from '../controllers/paymentMethod.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = Router();

// Get available payment methods
router.get('/payment-methods', paymentMethodController.getPaymentMethods);

// Get user's checkout information
router.get('/', verifyUserDualAuth, userCheckoutController.getCheckoutInfo);

// Create new order (checkout)
router.post('/', verifyUserDualAuth, userCheckoutController.createOrder);

// Get user's orders
router.get('/orders', verifyUserDualAuth, userCheckoutController.getUserOrders);

export default router;
