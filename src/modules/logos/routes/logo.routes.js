import { Router } from 'express';
import * as logoController from '../controllers/logo.controller.js';
import { verifyAdminToken } from '../../auth/middleware/apiAccessMiddleware.js';

const router = Router();

// Routes for logos
router.get('/', verifyAdminToken, logoController.getAllLogos);
router.post('/upload', verifyAdminToken, logoController.uploadLogos);
router.delete('/:id', verifyAdminToken, logoController.deleteLogo);

export default router;
