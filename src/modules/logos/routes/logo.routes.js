import { Router } from 'express';
import * as logoController from '../controllers/logo.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

const router = Router();

// Routes for logos
router.get('/', verifyDualAuth, logoController.getAllLogos);
router.post('/upload', verifyDualAuth, logoController.uploadLogos);
router.delete('/:id', verifyDualAuth, logoController.deleteLogo);

export default router;
