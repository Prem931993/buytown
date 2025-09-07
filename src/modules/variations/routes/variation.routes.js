import { Router } from 'express';
import * as variationController from '../controllers/variation.controller.js';
import multer from 'multer';

// Create separate upload middleware for import (uses memory storage)
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

// Routes for variations
router.get('/', variationController.getAllVariations);
router.get('/dropdown', variationController.getVariationsForDropdown);
router.get('/:id', variationController.getVariationById);
router.post('/', variationController.createVariation);
router.put('/:id', variationController.updateVariation);
router.delete('/:id', variationController.deleteVariation);
router.post('/import', importUpload.single('file'), variationController.importVariationsFromExcel);

export default router;