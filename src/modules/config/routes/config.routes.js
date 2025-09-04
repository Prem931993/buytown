import express from 'express';
import * as emailController from '../controllers/email.controller.js';
import * as taxController from '../controllers/tax.controller.js';
import * as paymentController from '../controllers/payment.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

const router = express.Router();

// Email Configuration Routes
router.get('/email-configs', verifyDualAuth, emailController.getAllEmailConfigurations);
router.get('/email-configs/:id', verifyDualAuth, emailController.getEmailConfiguration);
router.post('/email-configs', verifyDualAuth, emailController.createEmailConfiguration);
router.put('/email-configs/:id', verifyDualAuth, emailController.updateEmailConfiguration);
router.delete('/email-configs/:id', verifyDualAuth, emailController.deleteEmailConfiguration);

// Tax Configuration Routes
router.get('/tax-configs', verifyDualAuth, taxController.getAllTaxConfigurations);
router.get('/tax-configs/:id', verifyDualAuth, taxController.getTaxConfiguration);
router.post('/tax-configs', verifyDualAuth, taxController.createTaxConfiguration);
router.put('/tax-configs/:id', verifyDualAuth, taxController.updateTaxConfiguration);
router.delete('/tax-configs/:id', verifyDualAuth, taxController.deleteTaxConfiguration);

// Payment Configuration Routes
router.get('/payment-configs', verifyDualAuth, paymentController.getAllPaymentConfigurations);
router.get('/payment-configs/:gatewayName', verifyDualAuth, paymentController.getPaymentConfiguration);
router.post('/payment-configs', verifyDualAuth, paymentController.createPaymentConfiguration);
router.put('/payment-configs/:id', verifyDualAuth, paymentController.updatePaymentConfiguration);
router.delete('/payment-configs/:id', verifyDualAuth, paymentController.deletePaymentConfiguration);

export default router;
