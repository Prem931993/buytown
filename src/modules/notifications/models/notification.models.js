import knex from '../../../config/db.js';

export const createNotification = async (notificationData) => {
  try {
    const [notification] = await knex('byt_notifications')
      .insert(notificationData)
      .returning('*');
    return notification;
  } catch (error) {
    throw new Error(`Error creating notification: ${error.message}`);
  }
};

export const getNotifications = async (filters = {}) => {
  try {
    const { recipient_type, recipient_id, is_read, limit = 50, offset = 0 } = filters;

    let query = knex('byt_notifications')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (recipient_type) {
      query = query.where('recipient_type', recipient_type);
    }

    if (recipient_id) {
      query = query.where('recipient_id', recipient_id);
    }

    if (is_read !== undefined) {
      query = query.where('is_read', is_read);
    }

    const notifications = await query;
    return notifications;
  } catch (error) {
    throw new Error(`Error fetching notifications: ${error.message}`);
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const [notification] = await knex('byt_notifications')
      .where('id', notificationId)
      .update({ is_read: true, updated_at: knex.fn.now() })
      .returning('*');
    return notification;
  } catch (error) {
    throw new Error(`Error marking notification as read: ${error.message}`);
  }
};

export const getUnreadCount = async (recipient_type, recipient_id = null) => {
  try {
    let query = knex('byt_notifications')
      .where('is_read', false)
      .andWhere('recipient_type', recipient_type);

    if (recipient_id) {
      query = query.andWhere('recipient_id', recipient_id);
    }

    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  } catch (error) {
    throw new Error(`Error getting unread count: ${error.message}`);
  }
};
