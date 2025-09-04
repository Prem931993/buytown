import express from 'express';
import * as controller from '../controllers/order.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

const router = express.Router();

// Create a new order
router.post('/', verifyDualAuth, controller.createOrder);

// Get all orders
router.get('/', verifyDualAuth, controller.getAllOrders);

// Get order by ID
router.get('/:id', verifyDualAuth, controller.getOrderById);

// Update order
router.put('/:id', verifyDualAuth, controller.updateOrder);

// Delete order
router.delete('/:id', verifyDualAuth, controller.deleteOrder);

// Get orders by status
router.get('/status/:status', verifyDualAuth, controller.getOrdersByStatus);

// Get orders by user
router.get('/user/:userId', verifyDualAuth, controller.getOrdersByUser);

export default router;
