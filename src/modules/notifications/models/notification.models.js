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
    const { recipient_type, recipient_id, is_read, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    // Get total count for pagination
    let countQuery = knex('byt_notifications');

    if (recipient_type) {
      countQuery = countQuery.where('recipient_type', recipient_type);
    }

    if (recipient_id) {
      countQuery = countQuery.where('recipient_id', recipient_id);
    }

    if (is_read !== undefined) {
      countQuery = countQuery.where('is_read', is_read);
    }

    const totalCount = await countQuery.count('id as count').first();

    // Get notifications with pagination
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

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount.count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      notifications,
      pagination: {
        current_page: page,
        per_page: limit,
        total_count: totalCount.count,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      }
    };
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

// Delete a notification by ID
export const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await knex('byt_notifications')
      .where('id', notificationId)
      .where('recipient_type', 'user')
      .where('recipient_id', userId)
      .del();
    return result > 0;
  } catch (error) {
    throw new Error(`Error deleting notification: ${error.message}`);
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId) => {
  try {
    const result = await knex('byt_notifications')
      .where('recipient_type', 'user')
      .where('recipient_id', userId)
      .where('is_read', false)
      .update({ is_read: true, updated_at: knex.fn.now() });
    return result > 0;
  } catch (error) {
    throw new Error(`Error marking all notifications as read: ${error.message}`);
  }
};

// Low stock notification functions
export const getLowStockProducts = async (lowStockThreshold) => {
  try {
    const products = await knex('byt_products')
      .select('id', 'name', 'stock', 'sku_code')
      .where('stock', '<=', lowStockThreshold)
      .andWhere('stock', '>', 0) // Only products that are not out of stock
      .andWhere('status', 1) // Only active products (1 = active status)
      .andWhere('deleted_at', null); // Only non-deleted products
    return products;
  } catch (error) {
    throw new Error(`Error fetching low stock products: ${error.message}`);
  }
};

export const createLowStockNotifications = async (lowStockThreshold) => {
  try {
    const lowStockProducts = await getLowStockProducts(lowStockThreshold);

    if (lowStockProducts.length === 0) {
      return { success: true, notifiedProducts: 0, message: 'No products are low on stock' };
    }

    let totalNotificationsCreated = 0;

    for (const product of lowStockProducts) {
      // Check if we already have a low stock notification for this product in the last 24 hours
      const recentNotification = await knex('byt_notifications')
        .where('type', 'low_stock')
        .andWhere('reference_type', 'product')
        .andWhere('reference_id', product.id)
        .andWhere('created_at', '>=', knex.raw("NOW() - INTERVAL '24 hours'"))
        .first();

      if (recentNotification) {
        // Skip if we already notified about this product recently
        continue;
      }

      // Create notification for admin
      const notificationData = {
        type: 'low_stock',
        title: 'Low Stock Alert!',
        message: `Product "${product.name}" (SKU: ${product.sku_code}) has low stock. Current quantity: ${product.stock}`,
        recipient_type: 'admin',
        recipient_id: null,
        reference_type: 'product',
        reference_id: product.id
      };

      await createNotification(notificationData);
      totalNotificationsCreated++;
    }

    return {
      success: true,
      notifiedProducts: totalNotificationsCreated,
      totalLowStockProducts: lowStockProducts.length
    };
  } catch (error) {
    throw new Error(`Error creating low stock notifications: ${error.message}`);
  }
};
