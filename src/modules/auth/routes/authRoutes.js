import { Router } from 'express';
import multer from 'multer';

import * as authController from '../controllers/auth.controller.js';
import { verifyApiToken, verifyUserToken, auditTrail } from '../middleware/apiAccessMiddleware.js';
import verifyDualAuth from '../middleware/dualAuthMiddleware.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';
import { deleteUser } from '../../users/controllers/user.controller.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs for profile photos and licenses
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and PDF files are allowed.'));
    }
  }
});

router.post('/generate-token', authController.generateApiToken);

router.post('/register', auditTrail, verifyApiToken(1), upload.fields([
  { name: 'profile_photo', maxCount: 1 },
  { name: 'license', maxCount: 1 }
]), authController.register);
router.post('/admin/login', auditTrail, verifyApiToken(1), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', auditTrail, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.post('/verify-token', verifyUserToken, authController.verifyToken);
router.post('/verify-admin-token', verifyDualAuth, (req, res) => {
  res.status(200).json({
    statusCode: 200,
    message: 'Admin token is valid',
    admin: req.user
  });
});


router.post('/user/login', auditTrail, verifyApiToken(2,3), authController.login);
router.post('/user/validate-phone', verifyApiToken(2), authController.validatePhone);
router.post('/user/set-password', verifyApiToken(2), auditTrail, authController.setPassword);

// New routes for user forgot password and reset password via phone and OTP
router.post('/user/forgot-password', verifyApiToken(2), auditTrail, authController.userForgotPassword);
router.post('/user/reset-password', verifyApiToken(2), auditTrail, authController.userResetPassword);
router.post('/user/logout', verifyApiToken(2), authController.userLogout);

// Separate API for agreeing to terms and conditions
router.post('/user/agree-terms', verifyUserDualAuth, authController.agreeTermsAndConditions);

// Separate API for updating user profile (excluding terms agreement)
router.put('/user/update-profile', verifyUserDualAuth, authController.updateUserProfile);
router.delete('/user', verifyUserDualAuth, deleteUser);

export default router;
