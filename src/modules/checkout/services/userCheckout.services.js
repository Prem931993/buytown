import knex from '../../../config/db.js';
import * as cartModels from '../../cart/models/cart.models.js';
import * as notificationService from '../../notifications/services/notification.services.js';
import * as orderService from '../../orders/services/order.services.js';

// Simplified delivery distance calculation
// In production, replace this with actual distance calculation using Google Maps API or similar
function calculateDeliveryDistance(address) {
  // This is a placeholder implementation
  // You should integrate with a mapping service like Google Maps API for accurate distance calculation

  // For now, return a random distance between 5-25 km as an example
  // In real implementation, calculate based on:
  // - Store/warehouse location vs customer shipping address
  // - Use latitude/longitude coordinates
  // - Consider traffic, road conditions, etc.

  // Example calculation based on address components
  let baseDistance = 10; // Base distance in km

  if (address && address.city) {
    // Add variation based on city (simplified)
    const cityHash = address.city.toLowerCase().split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    baseDistance += Math.abs(cityHash % 15); // Add 0-15 km variation
  }

  return Math.max(5, Math.min(50, baseDistance)); // Ensure distance is between 5-50 km
}

export async function createOrderService(userId, orderData) {
  const {
    shipping_address,
    billing_address,
    payment_method,
    notes,
    delivery_distance
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

    // Use provided delivery distance if available, else calculate
    let deliveryDistance = 0;

    if (typeof delivery_distance === 'number' && delivery_distance > 0) {
      deliveryDistance = delivery_distance;
    } else {
      try {
        if (shipping_address) {
          const parsedAddress = typeof shipping_address === 'string' ? JSON.parse(shipping_address) : shipping_address;

          // For now, we'll use a simplified distance calculation
          // In production, you would integrate with Google Maps API or similar service
          // This is a placeholder calculation - you should replace with actual distance calculation
          deliveryDistance = calculateDeliveryDistance(parsedAddress);
        }
      } catch (distanceError) {
        console.warn('Error calculating delivery distance:', distanceError);
        // Continue with order creation even if distance calculation fails
      }
    }

    // Delivery charges will be 0 during awaiting_confirmation status
    // They will be calculated and updated only when order is approved
    const deliveryCharges = 0;
    const total_amount = cartSummary.total_amount;

    // Generate order number using the proper format
    const orderNumber = await orderService.generateOrderNumber();

    // Create order record
    const [order] = await trx('byt_orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        subtotal,
        tax_amount,
        discount_amount,
        shipping_amount,
        delivery_distance: deliveryDistance,
        delivery_charges: deliveryCharges,
        total_amount,
        status: 'awaiting_confirmation',
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
    // Build base query for filtering
    const baseQuery = knex('byt_orders').where('user_id', userId);
    if (status) {
      baseQuery.andWhere('status', status);
    }

    // Get total count without ORDER BY (since COUNT doesn't need ordering)
    const totalOrders = await baseQuery.clone().count('id as count').first();
    const total = parseInt(totalOrders.count, 10);

    // Get paginated orders with ORDER BY
    const orders = await baseQuery
      .orderBy('created_at', 'desc')
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
