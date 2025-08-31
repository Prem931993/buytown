import express from 'express';
import * as controller from '../controllers/sms.controller.js';
import { verifyApiToken } from '../middleware/apiAccessMiddleware.js';

const router = express.Router();

// OTP endpoints (public)
router.post('/send-otp', controller.sendOtp);
router.post('/verify-otp', controller.verifyOtp);

// SMS Configuration endpoints (protected)
router.get('/sms-configs', controller.getSmsConfigurations);
router.post('/sms-configs', controller.createSmsConfiguration);
router.put('/sms-configs/:id',  controller.updateSmsConfiguration);
router.delete('/sms-configs/:id', controller.deleteSmsConfiguration);

// Cleanup endpoint (admin only)
router.post('/cleanup-otps', controller.cleanupExpiredOtps);

export default router;
