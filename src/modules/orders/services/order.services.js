import * as models from '../models/order.models.js';

export async function createOrder(orderData) {
  try {
    // Generate order number if not provided
    if (!orderData.order_number) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      orderData.order_number = `ORD-${timestamp}-${random}`;
    }

    const result = await models.createOrder(orderData);
    if (result.success) {
      const order = await models.getOrderById(result.id);
      return { success: true, order: order.order };
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getOrderById(id) {
  try {
    const result = await models.getOrderById(id);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAllOrders() {
  try {
    const result = await models.getAllOrders();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateOrder(id, updateData) {
  try {
    const result = await models.updateOrder(id, updateData);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteOrder(id) {
  try {
    const result = await models.deleteOrder(id);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getOrdersByStatus(status) {
  try {
    const result = await models.getAllOrders();
    if (!result.success) return result;

    const filteredOrders = result.orders.filter(order => order.status === status);
    return { success: true, orders: filteredOrders };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getOrdersByUser(userId) {
  try {
    const result = await models.getAllOrders();
    if (!result.success) return result;

    const filteredOrders = result.orders.filter(order => order.user_id === userId);
    return { success: true, orders: filteredOrders };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
