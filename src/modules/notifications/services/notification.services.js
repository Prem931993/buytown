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
