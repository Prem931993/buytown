import express from 'express';
import {
  getMaintenanceMode,
  setMaintenanceMode
} from '../controllers/maintenance.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

const router = express.Router();

// Public route to check maintenance mode status
router.get('/status', getMaintenanceMode);

// Admin route to set maintenance mode (requires authentication)
router.put('/toggle', verifyDualAuth, setMaintenanceMode);

export default router;
