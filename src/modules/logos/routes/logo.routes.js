import { Router } from 'express';
import * as logoController from '../controllers/logo.controller.js';

const router = Router();

// Routes for logos
router.get('/', logoController.getAllLogos);
router.post('/upload', logoController.uploadLogos);
router.delete('/:id', logoController.deleteLogo);

export default router;
