import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the categories directory exists in the frontend public folder
const frontendPublicPath = path.join(__dirname, '../../../../../frontend/public');
const categoriesDir = path.join(frontendPublicPath, 'categories');

if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, categoriesDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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

// Routes for categories
router.get('/', categoryController.getAllCategories);
router.get('/root', categoryController.getRootCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/:parentId/children', categoryController.getChildCategories);
router.post('/', upload.single('image'), categoryController.createCategory);
router.put('/:id', upload.single('image'), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);
router.post('/import', importUpload.single('file'), categoryController.importCategoriesFromExcel);

export default router;