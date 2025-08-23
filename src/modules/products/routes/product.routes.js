import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';

const router = Router();

// Routes for products
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.upload.array('images', 10), productController.createProduct);
router.post('/import', productController.importUpload.single('file'), productController.importProducts);
router.put('/:id', productController.upload.array('images', 10), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.delete('/image/:imageId', productController.deleteProductImage);

export default router;