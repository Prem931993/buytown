import * as notificationService from '../services/notification.services.js';

export const getNotifications = async (req, res) => {
  try {
    const { recipient_type, recipient_id, is_read, limit, offset } = req.query;

    const filters = {
      recipient_type: recipient_type || 'admin',
      recipient_id: recipient_id ? parseInt(recipient_id) : null,
      is_read: is_read ? is_read === 'true' : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    };

    const notifications = await notificationService.getNotifications(filters);

    res.status(200).json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve notifications'
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notificationService.markNotificationAsRead(parseInt(id));

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
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

export const getUnreadCount = async (req, res) => {
  try {
    const { recipient_type, recipient_id } = req.query;

    const count = await notificationService.getUnreadNotificationCount(
      recipient_type || 'admin',
      recipient_id ? parseInt(recipient_id) : null
    );

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
      message: 'Unread count retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve unread count'
    });
  }
};
