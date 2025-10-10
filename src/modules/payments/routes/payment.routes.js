import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';

const router = express.Router();

// Create Cashfree order
router.post('/cashfree/order', paymentController.createCashfreeOrderController);

// Verify Cashfree payment
router.get('/cashfree/verify/:orderId', paymentController.verifyCashfreePaymentController);

// Cashfree webhook endpoint
router.post('/cashfree/webhook', paymentController.handleCashfreeWebhookController);

// Get payment details
router.get('/cashfree/payment/:orderId', paymentController.getPaymentDetailsController);

// Refund payment
router.post('/cashfree/refund/:orderId', paymentController.refundCashfreePaymentController);

export default router;
