import { Router } from 'express';
import * as bannerController from '../controllers/banner.controller.js';
import { verifyApiToken, auditTrail } from '../../auth/middleware/apiAccessMiddleware.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

const router = Router();

// Routes for banners
router.get('/', verifyDualAuth, bannerController.getAllBanners);
router.post('/upload', verifyDualAuth, bannerController.uploadBanners);
router.put('/order', verifyDualAuth, bannerController.updateBannerOrder);
router.delete('/:id', verifyDualAuth, bannerController.deleteBanner);

// Dropdown data endpoints
router.get('/dropdown/categories', verifyDualAuth, bannerController.getCategoriesForDropdown);
router.get('/dropdown/products', verifyDualAuth, bannerController.getProductsForDropdown);

export default router;

