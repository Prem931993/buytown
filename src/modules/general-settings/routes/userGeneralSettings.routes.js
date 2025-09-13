import express from 'express';
import {
  getGeneralSettingsWithLogos
} from '../controllers/generalSettings.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.get('/', verifyUserDualAuth, getGeneralSettingsWithLogos);

export default router;
