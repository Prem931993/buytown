import express from 'express';
import {
  getPublishedPageBySlug,
} from '../controllers/page.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = express.Router();

router.get('/slug/:slug', verifyUserDualAuth, getPublishedPageBySlug);

export default router;
