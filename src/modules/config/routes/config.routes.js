import express from 'express';
import * as emailController from '../controllers/email.controller.js';
import * as taxController from '../controllers/tax.controller.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = express.Router();

// Email Configuration Routes
router.get('/email-configs', emailController.getAllEmailConfigurations);
router.get('/email-configs/:id', emailController.getEmailConfiguration);
router.post('/email-configs', emailController.createEmailConfiguration);
router.put('/email-configs/:id', emailController.updateEmailConfiguration);
router.delete('/email-configs/:id', emailController.deleteEmailConfiguration);

// Tax Configuration Routes
router.get('/tax-configs', taxController.getAllTaxConfigurations);
router.get('/tax-configs/:id', taxController.getTaxConfiguration);
router.post('/tax-configs', taxController.createTaxConfiguration);
router.put('/tax-configs/:id', taxController.updateTaxConfiguration);
router.delete('/tax-configs/:id', taxController.deleteTaxConfiguration);

// Payment Configuration Routes
router.get('/payment-configs', paymentController.getAllPaymentConfigurations);
router.get('/payment-configs/:gatewayName', paymentController.getPaymentConfiguration);
router.post('/payment-configs', paymentController.createPaymentConfiguration);
router.put('/payment-configs/:id', paymentController.updatePaymentConfiguration);
router.delete('/payment-configs/:id', paymentController.deletePaymentConfiguration);

export default router;
