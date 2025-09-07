import knex from '../../../config/db.js';
import * as cartModels from '../../cart/models/cart.models.js';
import * as notificationService from '../../notifications/services/notification.services.js';

function generateOrderNumber() {
  return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

export async function createOrderService(userId, orderData) {
  const {
    shipping_address,
    billing_address,
    payment_method,
    notes
  } = orderData;

  // Start transaction
  const trx = await knex.transaction();

  try {
    // Get cart items for user
    const cartItems = await cartModels.getUserCartItems(userId);

    if (!cartItems || cartItems.length === 0) {
      await trx.rollback();
      return { error: 'Cart is empty', status: 400 };
    }

    // Get cart summary with product-specific tax calculation
    const cartSummary = await cartModels.getCartSummary(userId);

    const subtotal = cartSummary.subtotal;
    const tax_amount = cartSummary.tax_amount;
    const discount_amount = 0; // Can be implemented later for coupons/discounts
    const shipping_amount = 0; // Can be implemented later for shipping calculations
    const total_amount = cartSummary.total_amount;

    // Create order record
    const [order] = await trx('byt_orders')
      .insert({
        user_id: userId,
        order_number: generateOrderNumber(),
        subtotal,
        tax_amount,
        discount_amount,
        shipping_amount,
        total_amount,
        status: 'awaiting_approval',
        payment_status: 'pending',
        payment_method,
        shipping_address,
        billing_address,
        notes
      })
      .returning('*');

    // Insert order items
    const orderItemsData = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      variation_id: item.variation ? item.variation.id : null,
      quantity: item.quantity,
      price: item.price,
      total_price: item.total_price
    }));

    await trx('byt_order_items').insert(orderItemsData);

    // Clear user's cart
    await cartModels.clearUserCart(userId);

    await trx.commit();

    // Get user information for notifications
    const user = await knex('byt_users').where('id', userId).first();

    // Create notifications and send emails/SMS (non-blocking)
    try {
      await notificationService.createOrderNotification(order, user);
      await notificationService.sendOrderEmails(order, user);
      await notificationService.sendOrderSMS(order, user);
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the order creation if notifications fail
    }

    return { order, message: 'Order created successfully', status: 201 };
  } catch (error) {
    await trx.rollback();
    return { error: error.message, status: 500 };
  }
}

export async function getUserOrdersService(userId, options) {
  const { page = 1, limit = 10, status } = options;

  try {
    const query = knex('byt_orders')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    if (status) {
      query.andWhere('status', status);
    }

    const totalOrders = await query.clone().count('id as count').first();
    const total = parseInt(totalOrders.count, 10);

    const orders = await query
      .offset((page - 1) * limit)
      .limit(limit)
      .select('*');

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      status: 200
    };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}
