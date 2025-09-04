import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

const router = Router();

// Routes for products
router.get('/', verifyDualAuth, productController.getAllProducts);
router.get('/:id', verifyDualAuth, productController.getProductById);
router.post('/', verifyDualAuth, productController.upload.array('images', 10), productController.createProduct);
router.post('/import', verifyDualAuth, productController.importUpload.single('file'), productController.importProducts);
router.put('/:id', verifyDualAuth, productController.upload.array('images', 10), productController.updateProduct);
router.delete('/:id', verifyDualAuth, productController.deleteProduct);
router.delete('/image/:imageId', verifyDualAuth, productController.deleteProductImage);

export default router;
