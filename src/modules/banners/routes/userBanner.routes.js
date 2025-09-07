import { Router } from 'express';
import * as bannerController from '../controllers/banner.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = Router();

// User API route to get banners in order with dual authentication (JWT + X-User-Token)
router.get('/', verifyUserDualAuth, bannerController.getAllBanners);

export default router;
