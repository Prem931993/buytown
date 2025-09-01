import express from 'express';
import * as controller from '../controllers/order.controller.js';

const router = express.Router();

// Create a new order
router.post('/', controller.createOrder);

// Get all orders
router.get('/', controller.getAllOrders);

// Get order by ID
router.get('/:id', controller.getOrderById);

// Update order
router.put('/:id', controller.updateOrder);

// Delete order
router.delete('/:id', controller.deleteOrder);

// Get orders by status
router.get('/status/:status', controller.getOrdersByStatus);

// Get orders by user
router.get('/user/:userId', controller.getOrdersByUser);

export default router;
