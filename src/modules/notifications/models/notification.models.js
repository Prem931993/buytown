
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

// New model functions

export const getUsers = async () => {
  try {
    const users = await knex('byt_users').select('id', 'firstname', 'lastname');
    return users;
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
};

export const getUsersWithProductInWishlist = async (productId) => {
  try {
    const users = await knex('byt_wishlist_items')
      .join('byt_users', 'byt_wishlist_items.user_id', 'byt_users.id')
      .where('byt_wishlist_items.product_id', productId)
      .select('byt_users.id', 'byt_users.firstname', 'byt_users.lastname');
    return users;
  } catch (error) {
    throw new Error(`Error fetching users with product in wishlist: ${error.message}`);
  }
};

// Pending notification functions

export const createPendingNotification = async (pendingNotificationData) => {
  try {
    const [pendingNotification] = await knex('byt_pending_notifications')
      .insert(pendingNotificationData)
      .returning('*');
    return pendingNotification;
  } catch (error) {
    throw new Error(`Error creating pending notification: ${error.message}`);
  }
};

export const getPendingNotifications = async () => {
  try {
    const pendingNotifications = await knex('byt_pending_notifications')
      .where('processed', false)
      .orderBy('created_at', 'asc');
    return pendingNotifications;
  } catch (error) {
    throw new Error(`Error fetching pending notifications: ${error.message}`);
  }
};

export const processPendingNotifications = async () => {
  try {
    const pendingNotifications = await getPendingNotifications();
    let processedCount = 0;
    let createdNotificationsCount = 0;

    for (const pending of pendingNotifications) {
      let targetUsers = [];

      if (pending.notification_type === 'broadcast') {
        // Get all users
        targetUsers = await getUsers();
      } else if (pending.notification_type === 'wishlist_users') {
        // Get users with product in wishlist
        targetUsers = await getUsersWithProductInWishlist(pending.reference_id);
      } else if (pending.notification_type === 'specific_users' && pending.target_user_ids) {
        // Get specific users (future enhancement)
        const userIds = JSON.parse(pending.target_user_ids);
        targetUsers = await knex('byt_users')
          .whereIn('id', userIds)
          .select('id', 'firstname', 'lastname');
      }

      // Create notifications for target users
      for (const user of targetUsers) {
        const notificationData = {
          type: pending.type,
          title: pending.title,
          message: pending.message,
          recipient_type: 'user',
          recipient_id: user.id,
          reference_type: pending.reference_type,
          reference_id: pending.reference_id
        };

        await createNotification(notificationData);
        createdNotificationsCount++;
      }

      // Mark pending notification as processed
      await knex('byt_pending_notifications')
        .where('id', pending.id)
        .update({
          processed: true,
          processed_at: knex.fn.now()
        });

      processedCount++;
    }

    return {
      processedPendingNotifications: processedCount,
      createdNotifications: createdNotificationsCount
    };
  } catch (error) {
    throw new Error(`Error processing pending notifications: ${error.message}`);
  }
};
