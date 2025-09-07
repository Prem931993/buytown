import { Router } from 'express';
import * as brandController from '../controllers/brand.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer storage based on environment (Cloudinary vs local)
let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  // Use memory storage for Cloudinary uploads
  storage = multer.memoryStorage();
} else {
  // Use disk storage for local development
  const frontendPublicPath = path.join(__dirname, '../../../../../frontend/public');
  const brandsDir = path.join(frontendPublicPath, 'brands');

  if (!fs.existsSync(brandsDir)) {
    fs.mkdirSync(brandsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, brandsDir);
    },
    filename: function (req, file, cb) {
      // Generate a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'brand-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create separate upload middleware for import (uses memory storage)
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

// Routes for brands
router.get('/', verifyDualAuth, brandController.getAllBrands);
router.get('/dropdown', verifyDualAuth, brandController.getBrandsForDropdown);
router.get('/:id', verifyDualAuth, brandController.getBrandById);
router.post('/', verifyDualAuth, upload.single('image'), brandController.createBrand);
router.put('/:id', verifyDualAuth, upload.single('image'), brandController.updateBrand);
router.delete('/:id', verifyDualAuth, brandController.deleteBrand);
router.post('/import', verifyDualAuth, importUpload.single('file'), brandController.importBrandsFromExcel);

export default router;
