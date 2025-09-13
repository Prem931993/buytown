import express from 'express';
import {
  getSettings,
  updateSettings
} from '../controllers/generalSettings.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.get('/', verifyDualAuth, getSettings);
router.put('/', verifyDualAuth, updateSettings);

export default router;
