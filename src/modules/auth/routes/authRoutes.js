import { Router } from 'express';
const router = Router();
import * as authController from '../controllers/auth.controller.js';
import { verifyApiToken, auditTrail } from '../middleware/apiAccessMiddleware.js';

router.post('/generate-token', authController.generateApiToken);

router.post('/register', auditTrail, verifyApiToken(1), authController.register);
router.post('/admin/login', auditTrail, verifyApiToken(1), authController.login);
router.post('/user/login', auditTrail, verifyApiToken(2), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', auditTrail, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/user/validate-phone', verifyApiToken(2), authController.validatePhone);
router.post('/user/set-password', verifyApiToken(2), auditTrail, authController.setPassword);

export default router;