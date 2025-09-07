import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

const router = express.Router();

// Get notifications
router.get('/', verifyDualAuth, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', verifyDualAuth, notificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', verifyDualAuth, notificationController.markAsRead);

export default router;
