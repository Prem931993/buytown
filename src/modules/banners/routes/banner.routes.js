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

export default router;
