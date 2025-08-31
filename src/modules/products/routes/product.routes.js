import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { verifyAdminToken } from '../../auth/middleware/apiAccessMiddleware.js';

const router = Router();

// Routes for products
router.get('/', verifyAdminToken, productController.getAllProducts);
router.get('/:id', verifyAdminToken, productController.getProductById);
router.post('/', verifyAdminToken, productController.upload.array('images', 10), productController.createProduct);
router.post('/import', verifyAdminToken, productController.importUpload.single('file'), productController.importProducts);
router.put('/:id', verifyAdminToken, productController.upload.array('images', 10), productController.updateProduct);
router.delete('/:id', verifyAdminToken, productController.deleteProduct);
router.delete('/image/:imageId', verifyAdminToken, productController.deleteProductImage);

export default router;
