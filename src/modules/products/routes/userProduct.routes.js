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

export default router;
