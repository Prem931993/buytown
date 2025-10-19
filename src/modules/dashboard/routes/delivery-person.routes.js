import express from 'express';
import * as controller from '../controllers/delivery-person.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';
import { getUploadMiddleware } from '../../../config/ftp.js';

const router = express.Router();

// Get upload middleware
const upload = getUploadMiddleware();

// Get delivery person profile
router.get('/profile', verifyUserDualAuth, controller.getDeliveryPersonProfile);

// Update delivery person profile (with file upload support)
router.put('/profile', verifyUserDualAuth, upload.single('license'), controller.updateDeliveryPersonProfile);

// Get available vehicles
router.get('/vehicles', verifyUserDualAuth, controller.getAvailableVehicles);

export default router;
