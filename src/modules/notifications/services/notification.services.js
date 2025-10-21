import * as notificationModels from '../models/notification.models.js';
import * as emailService from '../../config/services/email.services.js';
import * as smsService from '../../auth/services/sms.services.js';
import * as generalSettingsModels from '../../general-settings/models/generalSettings.models.js';
import * as logoModels from '../../logos/models/logo.models.js';

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
      to: process.env.ADMIN_EMAIL || 'buytowncbe@gmail.com',
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

    // Send email to user using the modern template
    const fs = await import('fs');
    const path = await import('path');
    const knex = (await import('../../../config/db.js')).default;

    // Read the order confirmation template
    const templatePath = path.join(process.cwd(), 'templates', 'order-confirmation.html');
    let templateHtml = await fs.readFileSync(templatePath, 'utf8');

    // Get order items with product details
    const orderItems = await knex('byt_order_items as oi')
      .join('byt_products as p', 'oi.product_id', 'p.id')
      .select(
        'oi.quantity',
        'oi.price',
        'oi.total_price',
        'p.name as product_name',
      )
      .where('oi.order_id', order.id);

    // Format order items for template
    const itemsHtml = orderItems.map(item => `
      <div class="order-item">
        <div class="item-info">
          <div class="item-name">${item.product_name}</div>
          <div class="item-details">Quantity: ${item.quantity} × ₹${item.price}</div>
        </div>
        <div class="item-total">₹${item.total_price}</div>
      </div>
    `).join('');

    // Replace placeholders with actual data
    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    templateHtml = templateHtml
      .replace(/{{first_name}}/g, user.firstname || '')
      .replace(/{{last_name}}/g, user.lastname || '')
      .replace(/{{order_number}}/g, order.order_number)
      .replace(/{{order_date}}/g, orderDate)
      .replace(/{{status}}/g, order.status.replace('_', ' ').toUpperCase())
      .replace(/{{total_amount}}/g, order.total_amount.toString())
      .replace(/{{order_items}}/g, itemsHtml);

    const userEmailData = {
      to: user.email,
      subject: `Order Confirmed! - ${order.order_number}`,
      html: templateHtml
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
    const result = await notificationModels.getNotifications({
      recipient_type: 'user',
      recipient_id: userId,
      ...filters
    });

    return {
      notifications: result.notifications,
      pagination: result.pagination
    };
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
    // First check if the notification belongs to the user
    const notifications = await notificationModels.getNotifications({
      recipient_type: 'user',
      recipient_id: userId,
      limit: 1
    });

    if (!notifications.notifications || notifications.notifications.length === 0) {
      return null;
    }

    const notification = await notificationModels.markAsRead(notificationId);
    return notification;
  } catch (error) {
    throw new Error(`Error marking notification as read: ${error.message}`);
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

    await notificationModels.createNotification(notification);
    return { success: true };
  } catch (error) {
    throw new Error(`Error creating order status notification: ${error.message}`);
  }
};

// Pending notification functions
export const getPendingNotifications = async () => {
  try {
    const pendingNotifications = await notificationModels.getPendingNotifications();
    return pendingNotifications;
  } catch (error) {
    throw new Error(`Error fetching pending notifications: ${error.message}`);
  }
};

// Process pending notifications
export const processPendingNotifications = async () => {
  try {
    const result = await notificationModels.processPendingNotifications();
    return result;
  } catch (error) {
    throw new Error(`Error processing pending notifications: ${error.message}`);
  }
};

// Low stock notification service
export const checkAndNotifyLowStockProducts = async () => {
  try {
    // Get low stock threshold from general settings
    const settings = await generalSettingsModels.getSettings();
    const lowStockThreshold = settings?.low_stock_quantity || 5; // Default to 5 if not set

    const result = await notificationModels.createLowStockNotifications(lowStockThreshold);
    return result;
  } catch (error) {
    throw new Error(`Error checking low stock products: ${error.message}`);
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

// Order received notification
export const createOrderReceivedNotification = async (order, customer) => {
  try {
    const notification = {
      type: 'order',
      title: 'Order Received',
      message: `Customer ${customer.firstname} ${customer.lastname} has confirmed receipt of order #${order.order_number}`,
      recipient_type: 'admin',
      recipient_id: null,
      reference_type: 'order',
      reference_id: order.id
    };

    await notificationModels.createNotification(notification);
    return { success: true };
  } catch (error) {
    throw new Error(`Error creating order received notification: ${error.message}`);
  }
};

// Delete a notification by ID for a user
export const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await notificationModels.getNotifications({
      recipient_type: 'user',
      recipient_id: userId,
      limit: 1
    });

    if (!notification || notification.notifications.length === 0) {
      return null;
    }

    await notificationModels.deleteNotification(notificationId, userId);
    return true;
  } catch (error) {
    throw new Error(`Error deleting notification: ${error.message}`);
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId) => {
  try {
    await notificationModels.markAllAsRead(userId);
    return true;
  } catch (error) {
    throw new Error(`Error marking all notifications as read: ${error.message}`);
  }
};

// Send customer support email
export const sendSupportEmail = async (user, supportData) => {
  try {
    const { subject, message, attachments = [] } = supportData;

    // Get email configuration
    const emailConfigResult = await emailService.getEmailConfiguration();
    if (!emailConfigResult.success) {
      throw new Error('Email configuration not found. Please configure email settings first.');
    }

    // Get admin email and company details from general settings
    const settings = await generalSettingsModels.getSettings();
    const adminEmail = settings?.company_email || 'buytown@gmail.com';
    const companyName = settings?.company_name || 'BuyTown';
    const companyDetails = settings?.company_details || 'Your trusted online marketplace for quality products and services.';
    const companyPhone = settings?.company_phone_number || '+91-XXXXXXXXXX';

    // Get company logo
    const logos = await logoModels.getAllLogos();
    const logoUrl = logos.length > 0 ? logos[0].file_path : null;

    // Create modern fixed-width HTML email template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Customer Support Request - ${companyName}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.5;
            color: #333;
            width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }
          .header {
            background-color: #ffffff;
            color: #333333;
            padding: 30px 20px;
            border-radius: 12px 12px 0 0;
            text-align: center;
            margin: -30px -30px 30px -30px;
            border-bottom: 2px solid #e9ecef;
          }
          .logo-section {
            margin-bottom: 15px;
          }
          .logo {
            max-width: 120px;
            height: auto;
            border-radius: 8px;
            background-color: white;
            padding: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header h1 {
            margin: 10px 0 0 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .company-tagline {
            font-size: 14px;
            opacity: 0.9;
            margin: 8px 0 0 0;
            font-weight: 300;
          }
          .support-badge {
            background-color: #ffffff;
            color: #333333;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 20px;
            border: 2px solid #e9ecef;
          }
          .customer-info {
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 2px solid #f0f2f5;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          .customer-info h3 {
            margin-top: 0;
            color: #333333;
            font-size: 18px;
            font-weight: 600;
          }
          .info-row {
            display: flex;
            margin-bottom: 10px;
            align-items: center;
          }
          .info-label {
            font-weight: 600;
            min-width: 90px;
            color: #333333;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .info-value {
            color: #555555;
            flex: 1;
            font-weight: 500;
            font-size: 14px;
          }
          .message-section {
            background-color: #ffffff;
            border: 2px solid #f0f2f5;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          .message-section h3 {
            margin-top: 0;
            color: #667eea;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
            font-size: 18px;
            font-weight: 600;
          }
          .message-content {
            background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            margin-top: 15px;
            color: #333333;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #f0f2f5;
            color: #666666;
            font-size: 13px;
          }
          .footer p {
            margin: 8px 0;
          }
          .brand {
            color: #667eea;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .company-details {
            background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            font-style: italic;
            color: #333333;
            font-size: 13px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          .contact-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 15px 0;
            flex-wrap: wrap;
          }
          .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 500;
            color: #333333;
            background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
            padding: 8px 12px;
            border-radius: 20px;
            border: 1px solid #e1e8ed;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          .timestamp {
            color: #888888;
            font-size: 12px;
            margin-top: 15px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-section">
              ${logoUrl ? `<img src="${logoUrl}" alt="${companyName} Logo" class="logo">` : `<div style="width: 120px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">${companyName}</div>`}
            </div>
            <h1>🛠️ Support Request</h1>
            <div class="company-tagline">We value your feedback</div>
          </div>

          <div class="support-badge">Support Ticket</div>

          <div class="customer-info">
            <h3>👤 Customer Details</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${user.firstname || 'N/A'} ${user.lastname || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${user.phone_no || 'Not provided'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">User ID:</span>
              <span class="info-value">#${user.id}</span>
            </div>
          </div>

          <div class="message-section">
            <h3>📝 Request Details</h3>
            <div class="info-row" style="margin-bottom: 15px;">
              <span class="info-label">Subject:</span>
              <span class="info-value" style="font-weight: 600;">${subject}</span>
            </div>
            <div class="message-content">${message}</div>
          </div>

          <div class="company-details">
            <strong>About ${companyName}:</strong> ${companyDetails}
          </div>

          <div class="footer">
            <p><strong class="brand">${companyName}</strong> - Support System</p>
            <div class="contact-info">
              <div class="contact-item">📧 ${adminEmail}</div>
              <div class="contact-item">📞 ${companyPhone}</div>
            </div>
            <p>Please respond to this email to assist the customer.</p>
            <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email to admin
    const adminEmailData = {
      to: adminEmail,
      cc: user.email, // CC the customer
      subject: `Customer Support: ${subject}`,
      html: htmlTemplate,
      attachments: attachments
    };

    // Send the email
    const sendResult = await emailService.sendEmail(emailConfigResult.config, adminEmailData);

    if (!sendResult.success) {
      throw new Error(sendResult.error || 'Failed to send support email');
    }

    // Create admin notification for the support request
    const adminNotification = {
      type: 'support',
      title: 'New Customer Support Request',
      message: `Customer ${user.firstname} ${user.lastname} submitted a support request: ${subject}`,
      recipient_type: 'admin',
      recipient_id: null,
      reference_type: 'user',
      reference_id: user.id
    };

    await createNotification(adminNotification);

    return {
      success: true,
      message: 'Support email sent successfully',
      messageId: sendResult.messageId
    };

  } catch (error) {
    throw new Error(`Error sending support email: ${error.message}`);
  }
};
