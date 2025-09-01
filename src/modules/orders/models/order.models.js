import db from '../../../config/db.js';

export async function createOrder(orderData) {
  try {
    const [id] = await db('byt_orders').insert(orderData);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getOrderById(id) {
  try {
    const order = await db('byt_orders').where({ id }).first();
    return { success: true, order };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAllOrders() {
  try {
    const orders = await db('byt_orders').select();
    return { success: true, orders };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateOrder(id, updateData) {
  try {
    await db('byt_orders').where({ id }).update(updateData);
    const updatedOrder = await db('byt_orders').where({ id }).first();
    return { success: true, order: updatedOrder };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteOrder(id) {
  try {
    await db('byt_orders').where({ id }).del();
    return { success: true, message: 'Order deleted successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
