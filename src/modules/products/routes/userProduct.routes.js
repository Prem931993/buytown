import { Router } from 'express';
import * as userProductController from '../controllers/userProduct.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = Router();

// User product listing with filters using POST method
router.post('/', verifyUserDualAuth, userProductController.getUserProducts);
router.post('/new-arrivals', verifyUserDualAuth, userProductController.getNewArrivalsProducts);
router.post('/top-selling-products', verifyUserDualAuth, userProductController.getTopSellingProducts);
router.post('/random-products', verifyUserDualAuth, userProductController.getRandomProducts);
router.post('/global-search', verifyUserDualAuth, userProductController.getGlobalSearch);
router.get('/filters', verifyUserDualAuth, userProductController.getProductFilterValues);
router.get('/dropdown', verifyUserDualAuth, userProductController.getProductsForDropdown);

// Get single product by ID for users
router.get('/:id', verifyUserDualAuth, userProductController.getUserProductById);

export default router;
