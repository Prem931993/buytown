import express from 'express';
import {
  getPublishedPageBySlug,
} from '../controllers/page.controller.js';
import { verifyUserToken } from '../../auth/middleware/apiAccessMiddleware.js';

const router = express.Router();

router.get('/slug/:slug', getPublishedPageBySlug);

export default router;