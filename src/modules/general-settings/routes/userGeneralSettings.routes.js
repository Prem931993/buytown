import express from 'express';
import {
  getGeneralSettingsWithLogos
} from '../controllers/generalSettings.controller.js';

const router = express.Router();

// All routes require admin authentication
router.get('/', getGeneralSettingsWithLogos);

export default router;
