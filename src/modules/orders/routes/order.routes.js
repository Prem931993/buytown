import express from 'express';
import * as controller from '../controllers/order.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

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

// Approve order
router.put('/:id/approve', verifyDualAuth, controller.approveOrder);

// Reject order
router.put('/:id/reject', verifyDualAuth, controller.rejectOrder);

// Assign delivery person
router.put('/:id/assign-delivery', verifyDualAuth, controller.assignDeliveryPerson);

// Mark order as completed
router.put('/:id/complete', verifyDualAuth, controller.markOrderCompleted);

// Calculate delivery charge for selected delivery person
router.post('/:id/calculate-delivery-charge', verifyDualAuth, controller.calculateDeliveryCharge);

// PDF Generation Routes
router.post('/:id/generate-invoice-pdf', verifyDualAuth, controller.generateInvoicePDF);
router.post('/:id/generate-confirmation-pdf', verifyDualAuth, controller.generateOrderConfirmationPDF);
router.get('/:id/invoices', verifyDualAuth, controller.getInvoicesByOrder);

// Delivery personnel complete order
router.put('/:id/delivery-complete', verifyUserDualAuth, controller.completeOrderByDelivery);

// Delivery personnel reject order
router.put('/:id/delivery-reject', verifyUserDualAuth, controller.rejectOrderByDelivery);

// User cancel order
router.put('/:id/cancel', verifyUserDualAuth, controller.cancelOrderByUser);

// User mark order as received
router.put('/:id/received', verifyUserDualAuth, controller.markOrderReceivedByUser);

// User get order details with items
router.get('/details/:id', verifyUserDualAuth, controller.getUserOrderById);

// User download invoice
router.get('/:id/download-invoice', verifyUserDualAuth, controller.downloadUserInvoice);

export default router;
