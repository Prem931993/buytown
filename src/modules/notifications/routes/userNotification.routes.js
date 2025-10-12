import express from 'express';
import * as userNotificationController from '../controllers/userNotification.controller.js';
import verifyUserDualAuth from '../../auth/middleware/userDualAuthMiddleware.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for support email attachments
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common file types for support attachments
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, and documents are allowed.'), false);
    }
  }
});

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

// Delete a notification by ID
router.delete('/:id', userNotificationController.deleteNotification);

// Mark all notifications as read
router.put('/mark-all-read', userNotificationController.markAllNotificationsAsRead);

// Send customer support email
router.post('/support-email', upload.array('attachments', 5), userNotificationController.sendSupportEmail);

export default router;
