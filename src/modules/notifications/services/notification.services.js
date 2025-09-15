import * as notificationModels from '../models/notification.models.js';
import * as emailService from '../../config/services/email.services.js';
import * as smsService from '../../auth/services/sms.services.js';

export const createNotification = async (notificationData) => {
  try {
    return await notificationModels.createNotification(notificationData);
  } catch (error) {
    throw new Error(`Error creating notification: ${error.message}`);
  }
};

export const createOrderNotification = async (order, user) => {
  try {
    // Create notification for admin
    const adminNotification = {
      type: 'order',
      title: 'New Order Received',
      message: `New order #${order.order_number} received from ${user.first_name} ${user.last_name} for ₹${order.total_amount}`,
      recipient_type: 'admin',
      recipient_id: null,
      reference_type: 'order',
      reference_id: order.id
    };

    await notificationModels.createNotification(adminNotification);

    // Create notification for user
    const userNotification = {
      type: 'order',
      title: 'Order Placed Successfully',
      message: `Your order #${order.order_number} has been placed successfully and is awaiting approval.`,
      recipient_type: 'user',
      recipient_id: user.id,
      reference_type: 'order',
      reference_id: order.id
    };

    await notificationModels.createNotification(userNotification);

    return { success: true };
  } catch (error) {
    throw new Error(`Error creating order notifications: ${error.message}`);
  }
};

export const sendOrderEmails = async (order, user) => {
  try {
    // Send email to admin
    const adminEmailData = {
      to: process.env.ADMIN_EMAIL || 'admin@buytown.com',
      subject: `New Order #${order.order_number} Received`,
      html: `
        <h2>New Order Received</h2>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Customer:</strong> ${user.first_name} ${user.last_name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Phone:</strong> ${user.phone}</p>
        <p><strong>Total Amount:</strong> ₹${order.total_amount}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p>Please review and approve the order.</p>
      `
    };

    // Send email to user
    const userEmailData = {
      to: user.email,
      subject: `Order Confirmation - ${order.order_number}`,
      html: `
        <h2>Order Confirmation</h2>
        <p>Dear ${user.first_name} ${user.last_name},</p>
        <p>Thank you for your order! Your order has been received and is being processed.</p>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Total Amount:</strong> ₹${order.total_amount}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p>You will receive updates on your order status via email and SMS.</p>
        <br>
        <p>Best regards,<br>BuyTown Team</p>
      `
    };

    // Send emails using the email service
    const emailConfigResult = await emailService.getEmailConfiguration();
    if (emailConfigResult.success) {
      await emailService.sendEmail(emailConfigResult.config, adminEmailData);
      await emailService.sendEmail(emailConfigResult.config, userEmailData);
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Error sending order emails: ${error.message}`);
  }
};

export const sendOrderSMS = async (order, user) => {
  try {
    // Send SMS to admin
    const adminPhone = process.env.ADMIN_PHONE || '+1234567890';
    const adminSMSMessage = `New order #${order.order_number} received from ${user.first_name} ${user.last_name} for ₹${order.total_amount}`;

    // Send SMS to user
    const userSMSMessage = `Your order #${order.order_number} has been placed successfully. Total: ₹${order.total_amount}. Status: ${order.status}`;

    // Send SMS (assuming smsService has sendSMS method)
    if (smsService.sendSMS) {
      await smsService.sendSMS(adminPhone, adminSMSMessage);
      if (user.phone) {
        await smsService.sendSMS(user.phone, userSMSMessage);
      }
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Error sending order SMS: ${error.message}`);
  }
};

export const getNotifications = async (filters) => {
  try {
    return await notificationModels.getNotifications(filters);
  } catch (error) {
    throw new Error(`Error fetching notifications: ${error.message}`);
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    return await notificationModels.markAsRead(notificationId);
  } catch (error) {
    throw new Error(`Error marking notification as read: ${error.message}`);
  }
};

export const getUnreadNotificationCount = async (recipient_type, recipient_id) => {
  try {
    return await notificationModels.getUnreadCount(recipient_type, recipient_id);
  } catch (error) {
    throw new Error(`Error getting unread count: ${error.message}`);
  }
};

// User-specific notification functions
export const getUserNotifications = async (userId, filters = {}) => {
  try {
    const userFilters = {
      ...filters,
      recipient_type: 'user',
      recipient_id: userId
    };
    return await notificationModels.getNotifications(userFilters);
  } catch (error) {
    throw new Error(`Error fetching user notifications: ${error.message}`);
  }
};

export const getUserUnreadCount = async (userId) => {
  try {
    return await notificationModels.getUnreadCount('user', userId);
  } catch (error) {
    throw new Error(`Error getting user unread count: ${error.message}`);
  }
};

export const markUserNotificationAsRead = async (notificationId, userId) => {
  try {
    // First verify the notification belongs to the user
    const notification = await notificationModels.getNotifications({
      recipient_type: 'user',
      recipient_id: userId,
      limit: 1
    });

    if (!notification || notification.length === 0) {
      throw new Error('Notification not found or does not belong to user');
    }

    return await notificationModels.markAsRead(notificationId);
  } catch (error) {
    throw new Error(`Error marking user notification as read: ${error.message}`);
  }
};

// Product-related notification functions (now create pending notifications for cronjob processing)
export const createNewProductNotification = async (product) => {
  try {
    // Create pending notification for cronjob processing
    const pendingNotification = {
      type: 'product',
      title: 'New Product Available!',
      message: `Check out our new product: ${product.name} - ₹${product.price}`,
      reference_type: 'product',
      reference_id: product.id,
      notification_type: 'broadcast' // Send to all users
    };

    await notificationModels.createPendingNotification(pendingNotification);

    return { success: true, message: 'New product notification queued for processing' };
  } catch (error) {
    throw new Error(`Error creating new product pending notification: ${error.message}`);
  }
};

export const createTrendingProductNotification = async (product) => {
  try {
    // Create pending notification for cronjob processing
    const pendingNotification = {
      type: 'product',
      title: 'Trending Product!',
      message: `${product.name} is trending now! Don't miss out - ₹${product.price}`,
      reference_type: 'product',
      reference_id: product.id,
      notification_type: 'broadcast' // Send to all users
    };

    await notificationModels.createPendingNotification(pendingNotification);

    return { success: true, message: 'Trending product notification queued for processing' };
  } catch (error) {
    throw new Error(`Error creating trending product pending notification: ${error.message}`);
  }
};

export const createBackInStockNotification = async (product) => {
  try {
    // Get users who have this product in their wishlist
    const wishlistUsers = await notificationModels.getUsersWithProductInWishlist(product.id);

    if (wishlistUsers.length === 0) {
      return { success: true, notifiedUsers: 0, message: 'No users have this product in wishlist' };
    }

    const notifications = wishlistUsers.map(user => ({
      type: 'product',
      title: 'Product Back in Stock!',
      message: `Great news! ${product.name} is back in stock. Order now - ₹${product.price}`,
      recipient_type: 'user',
      recipient_id: user.id,
      reference_type: 'product',
      reference_id: product.id
    }));

    // Create notifications for wishlist users
    for (const notification of notifications) {
      await notificationModels.createNotification(notification);
    }

    return { success: true, notifiedUsers: wishlistUsers.length };
  } catch (error) {
    throw new Error(`Error creating back in stock notifications: ${error.message}`);
  }
};

// Order status notification for users
export const createOrderStatusNotification = async (order, user, status) => {
  try {
    let title, message;

    switch (status) {
      case 'confirmed':
        title = 'Order Confirmed!';
        message = `Your order #${order.order_number} has been confirmed and is being prepared.`;
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = `Your order #${order.order_number} has been cancelled. Please contact support for more details.`;
        break;
      case 'shipped':
        title = 'Order Shipped!';
        message = `Your order #${order.order_number} has been shipped and is on its way.`;
        break;
      case 'delivered':
        title = 'Order Delivered!';
        message = `Your order #${order.order_number} has been successfully delivered.`;
        break;
      default:
        title = 'Order Update';
        message = `Your order #${order.order_number} status has been updated to: ${status}`;
    }

    const notification = {
      type: 'order',
      title,
      message,
      recipient_type: 'user',
      recipient_id: user.id,
      reference_type: 'order',
      reference_id: order.id
    };
    console.log('Creating Order Status Notification:', notification);

    await notificationModels.createNotification(notification);
    return { success: true };
  } catch (error) {
    throw new Error(`Error creating order status notification: ${error.message}`);
  }
};

// Pending notification functions
export const getPendingNotifications = async () => {
  try {
    return await notificationModels.getPendingNotifications();
  } catch (error) {
    throw new Error(`Error getting pending notifications: ${error.message}`);
  }
};

export const processPendingNotifications = async () => {
  try {
    return await notificationModels.processPendingNotifications();
  } catch (error) {
    throw new Error(`Error processing pending notifications: ${error.message}`);
  }
};

// Order approval notification for admin when delivery person is selected
export const createOrderApprovalNotification = async (order) => {
  try {
    const notification = {
      type: 'order',
      title: 'Order Approved - Delivery Person Assigned',
      message: `Order #${order.order_number} has been approved. Delivery person: ${order.deliveryDriver}. Distance: ${order.deliveryDistance}km, Charges: ₹${order.deliveryCharges}`,
      recipient_type: 'admin',
      recipient_id: null,
      reference_type: 'order',
      reference_id: order.id
    };

    await notificationModels.createNotification(notification);
    return { success: true };
  } catch (error) {
    throw new Error(`Error creating order approval notification: ${error.message}`);
  }
};

// Order rejection notification with reference to who rejected
export const createOrderRejectionNotification = async (order, rejectedBy, rejectionReason) => {
  try {
    let title, message, recipientType, recipientId;

    // Determine who rejected the order
    if (rejectedBy.role === 'admin') {
      title = 'Order Rejected by Admin';
      message = `Order #${order.order_number} has been rejected by Admin. Reason: ${rejectionReason}`;
      recipientType = 'user';
      recipientId = order.user_id;
    } else if (rejectedBy.role === 'delivery_person') {
      title = 'Order Rejected by Delivery Person';
      message = `Order #${order.order_number} has been rejected by delivery person ${rejectedBy.firstname} ${rejectedBy.lastname}. Reason: ${rejectionReason}`;
      recipientType = 'admin';
      recipientId = null; // Admin notification
    } else {
      title = 'Order Rejected';
      message = `Order #${order.order_number} has been rejected. Reason: ${rejectionReason}`;
      recipientType = 'user';
      recipientId = order.user_id;
    }

    const notification = {
      type: 'order',
      title,
      message,
      recipient_type: recipientType,
      recipient_id: recipientId,
      reference_type: 'order',
      reference_id: order.id
    };

    await notificationModels.createNotification(notification);
    return { success: true };
  } catch (error) {
    throw new Error(`Error creating order rejection notification: ${error.message}`);
  }
};

// Customer cancellation notification
export const createOrderCancellationNotification = async (order, customer) => {
  try {
    const notification = {
      type: 'order',
      title: 'Order Cancelled by Customer',
      message: `Order #${order.order_number} has been cancelled by customer ${customer.firstname} ${customer.lastname}`,
      recipient_type: 'admin',
      recipient_id: null,
      reference_type: 'order',
      reference_id: order.id
    };

    await notificationModels.createNotification(notification);
    return { success: true };
  } catch (error) {
    throw new Error(`Error creating order cancellation notification: ${error.message}`);
  }
};
