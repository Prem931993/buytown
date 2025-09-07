import express from 'express';
import {
  getPages,
  getPage,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  getPublishedPages,
  getDraftPages
} from '../controllers/page.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

const router = express.Router();

// Define page-related routes with admin middleware
// More specific routes must come before parameterized routes
router.get('/published', verifyDualAuth, getPublishedPages);
router.get('/drafts', verifyDualAuth, getDraftPages);
router.get('/slug/:slug', getPageBySlug); // Public route for viewing published pages
router.get('/', verifyDualAuth, getPages);
router.get('/:id', verifyDualAuth, getPage);
router.post('/', verifyDualAuth, createPage);
router.put('/:id', verifyDualAuth, updatePage);
router.delete('/:id', verifyDualAuth, deletePage);

export default router;
