import { Router } from 'express';
import * as bannerController from '../controllers/banner.controller.js';

const router = Router();

// Routes for banners
router.get('/', bannerController.getAllBanners);
router.post('/upload', bannerController.uploadBanners);
router.put('/order', bannerController.updateBannerOrder);
router.delete('/:id', bannerController.deleteBanner);

export default router;
