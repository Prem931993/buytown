import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the products directory exists in the frontend public folder
const frontendPublicPath = path.join(__dirname, '../../../../../frontend/public');
const productsDir = path.join(frontendPublicPath, 'products');

if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Configure multer storage based on environment (FTP vs local)
let productStorage;

if (process.env.FTP_HOST) {
  // Use memory storage for FTP uploads
  productStorage = multer.memoryStorage();
} else {
  // Use disk storage for local development
  productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, productsDir);
    },
    filename: function (req, file, cb) {
      // Generate a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create separate upload middleware for import (uses memory storage)
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for import files
});

const router = Router();

// Routes for products
router.get('/', verifyDualAuth, productController.getAllProducts);
router.get('/:id', verifyDualAuth, productController.getProductById);
router.post('/', verifyDualAuth, upload.array('images', 10), productController.createProduct);
router.post('/import', verifyDualAuth, importUpload.single('file'), productController.importProducts);
router.put('/:id', verifyDualAuth, upload.array('images', 10), productController.updateProduct);
router.put('/:id/images', verifyDualAuth, upload.array('images', 10), productController.updateProductImages);
router.delete('/:id', verifyDualAuth, productController.deleteProduct);
router.delete('/image/:imageId', verifyDualAuth, productController.deleteProductImage);

export default router;
