import * as notificationService from '../services/notification.services.js';

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from authentication middleware
    const { is_read, page, limit } = req.query;

    const filters = {
      is_read: is_read ? is_read === 'true' : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    };

    const result = await notificationService.getUserNotifications(userId, filters);

    res.status(200).json({
      success: true,
      data: result,
      message: 'User notifications retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve user notifications'
    });
  }
};

export const markUserNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Assuming user ID is available from authentication middleware

    const notification = await notificationService.markUserNotificationAsRead(parseInt(id), userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or does not belong to user'
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to mark notification as read'
    });
  }
};

export const getUserUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from authentication middleware

    const count = await notificationService.getUserUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
      message: 'User unread count retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve user unread count'
    });
  }
};

// Get pending notifications
export const getPendingNotifications = async (req, res) => {
  try {
    const pendingNotifications = await notificationService.getPendingNotifications();

    res.status(200).json({
      success: true,
      data: pendingNotifications,
      message: 'Pending notifications retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve pending notifications'
    });
  }
};

// Cronjob API for processing pending notifications
export const processPendingNotifications = async (req, res) => {
  try {
    const result = await notificationService.processPendingNotifications();

    res.status(200).json({
      success: true,
      message: 'Pending notifications processed successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process pending notifications',
      error: error.message
    });
  }
};

// Delete a notification by ID
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await notificationService.deleteNotification(id, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or does not belong to user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete notification'
    });
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await notificationService.markAllNotificationsAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Send customer support email
export const sendSupportEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, message } = req.body;
    const attachments = req.files || []; // Files from multer

    // Validate required fields
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    // Get user details (assuming user info is available from middleware)
    const user = req.user; // Assuming middleware populates user info

    // Process attachments for email service
    const processedAttachments = attachments.map(file => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype
    }));

    // Send support email
    const result = await notificationService.sendSupportEmail(user, {
      subject,
      message,
      attachments: processedAttachments
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        messageId: result.messageId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send support email'
    });
  }
};
