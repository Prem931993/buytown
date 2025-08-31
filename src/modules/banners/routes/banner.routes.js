import { Router } from 'express';
import * as bannerController from '../controllers/banner.controller.js';
import { verifyAdminToken } from '../../auth/middleware/apiAccessMiddleware.js';

const router = Router();

// Routes for banners
router.get('/', verifyAdminToken, bannerController.getAllBanners);
router.post('/upload', verifyAdminToken, bannerController.uploadBanners);
router.put('/order', verifyAdminToken, bannerController.updateBannerOrder);
router.delete('/:id', verifyAdminToken, bannerController.deleteBanner);

export default router;
