import express from 'express';
import * as userNotificationController from '../controllers/userNotification.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';

const router = express.Router();

router.post('/process-pending', userNotificationController.processPendingNotifications);
// All routes require authentication and user role
router.use(verifyUserDualAuth);

// Get pending notifications (for admin interface)
router.get('/pending', userNotificationController.getPendingNotifications);

// Get user notifications
router.get('/', userNotificationController.getUserNotifications);

// Get user unread count
router.get('/unread-count', userNotificationController.getUserUnreadCount);

// Mark user notification as read
router.put('/:id/read', userNotificationController.markUserNotificationAsRead);

export default router;
