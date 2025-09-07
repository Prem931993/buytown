import * as models from '../models/order.models.js';
import db from '../../../config/db.js';

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
    const orderRows = await db('byt_orders')
      .leftJoin('byt_users', 'byt_orders.user_id', 'byt_users.id')
      .leftJoin('byt_order_items', 'byt_orders.id', 'byt_order_items.order_id')
      .leftJoin('byt_products', 'byt_order_items.product_id', 'byt_products.id')
      .leftJoin('byt_product_variations', 'byt_order_items.variation_id', 'byt_product_variations.id')
      .leftJoin('byt_variations', 'byt_product_variations.variation_id', 'byt_variations.id')
      .where('byt_orders.id', id)
      .select(
        'byt_orders.*',
        'byt_users.firstname',
        'byt_users.lastname',
        'byt_users.email',
        'byt_users.phone_no',
        'byt_order_items.id as item_id',
        'byt_order_items.quantity',
        'byt_order_items.price as item_price',
        'byt_order_items.total_price as item_total',
        'byt_products.name as product_name',
        'byt_products.sku_code as product_sku',
        'byt_variations.label as variation_name'
      );

    if (orderRows.length === 0) {
      return { success: false, error: 'Order not found' };
    }

    const firstRow = orderRows[0];

    // Parse addresses if they exist
    let shippingAddress = null;
    let billingAddress = null;

    try {
      if (firstRow.shipping_address) {
        shippingAddress = JSON.parse(firstRow.shipping_address);
      }
      if (firstRow.billing_address) {
        billingAddress = JSON.parse(firstRow.billing_address);
      }
    } catch (e) {
      console.warn('Error parsing address JSON:', e);
    }

    // Build order details
    const orderDetails = {
      id: firstRow.id,
      order_number: firstRow.order_number,
      customer: {
        name: `${firstRow.firstname || ''} ${firstRow.lastname || ''}`.trim() || 'N/A',
        email: firstRow.email || 'N/A',
        phone: firstRow.phone_no || 'N/A'
      },
      orderDate: firstRow.created_at ? new Date(firstRow.created_at).toISOString() : new Date().toISOString(),
      status: firstRow.status || 'Pending',
      paymentMethod: firstRow.payment_method || 'N/A',
      paymentStatus: 'Paid', // Default assumption
      shippingMethod: 'Standard', // Default assumption
      trackingNumber: null,
      subtotal: parseFloat(firstRow.subtotal) || 0,
      shippingCost: parseFloat(firstRow.shipping_amount) || 0,
      tax: parseFloat(firstRow.tax_amount) || 0,
      discount: parseFloat(firstRow.discount_amount) || 0,
      total: parseFloat(firstRow.total) || 0,
      shippingAddress: shippingAddress,
      billingAddress: billingAddress,
      items: [],
      timeline: [
        {
          status: 'Order Placed',
          date: firstRow.created_at ? new Date(firstRow.created_at).toISOString() : new Date().toISOString(),
          note: 'Order was placed by customer'
        }
      ]
    };

    // Add items
    orderRows.forEach(row => {
      if (row.item_id) {
        orderDetails.items.push({
          id: row.item_id,
          name: row.product_name || 'Unknown Product',
          sku: row.product_sku || 'N/A',
          price: parseFloat(row.item_price) || 0,
          quantity: row.quantity || 0,
          total: parseFloat(row.item_total) || 0
        });
      }
    });

    return { success: true, order: orderDetails };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAllOrders() {
  try {
    const orders = await db('byt_orders')
      .leftJoin('byt_users', 'byt_orders.user_id', 'byt_users.id')
      .leftJoin('byt_order_items', 'byt_orders.id', 'byt_order_items.order_id')
      .leftJoin('byt_products', 'byt_order_items.product_id', 'byt_products.id')
      .leftJoin('byt_product_variations', 'byt_order_items.variation_id', 'byt_product_variations.id')
      .leftJoin('byt_variations', 'byt_product_variations.variation_id', 'byt_variations.id')
      .select(
        'byt_orders.*',
        'byt_users.firstname',
        'byt_users.lastname',
        'byt_users.email',
        'byt_users.phone_no',
        'byt_order_items.id as item_id',
        'byt_order_items.quantity',
        'byt_order_items.price as item_price',
        'byt_order_items.total_price as item_total',
        'byt_products.name as product_name',
        'byt_products.sku_code as product_sku',
        'byt_variations.label as variation_name'
      )
      .orderBy('byt_orders.created_at', 'desc');

    // Group orders and their items
    const ordersMap = new Map();

    orders.forEach(row => {
      const orderId = row.id;

      if (!ordersMap.has(orderId)) {
        // Parse addresses if they exist
        let shippingAddress = null;
        let billingAddress = null;

        try {
          if (row.shipping_address) {
            shippingAddress = JSON.parse(row.shipping_address);
          }
          if (row.billing_address) {
            billingAddress = JSON.parse(row.billing_address);
          }
        } catch (e) {
          console.warn('Error parsing address JSON:', e);
        }

        ordersMap.set(orderId, {
          id: row.id,
          order_number: row.order_number,
          customer: `${row.firstname || ''} ${row.lastname || ''}`.trim() || 'N/A',
          customer_name: `${row.firstname || ''} ${row.lastname || ''}`.trim() || 'N/A',
          customer_email: row.email || 'N/A',
          customer_phone: row.phone_no || 'N/A',
          date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : 'N/A',
          total: parseFloat(row.total) || 0,
          status: row.status || 'Pending',
          payment_method: row.payment_method || 'N/A',
          payment_status: 'Paid', // Default assumption
          shipping_method: 'Standard', // Default assumption
          tracking_number: null,
          subtotal: parseFloat(row.subtotal) || 0,
          shipping_cost: parseFloat(row.shipping_amount) || 0,
          tax: parseFloat(row.tax_amount) || 0,
          discount: parseFloat(row.discount_amount) || 0,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          items: [],
          timeline: [
            {
              status: 'Order Placed',
              date: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
              note: 'Order was placed by customer'
            }
          ]
        });
      }

      // Add item if it exists
      if (row.item_id) {
        const order = ordersMap.get(orderId);
        order.items.push({
          id: row.item_id,
          name: row.product_name || 'Unknown Product',
          sku: row.product_sku || 'N/A',
          price: parseFloat(row.item_price) || 0,
          quantity: row.quantity || 0,
          total: parseFloat(row.item_total) || 0,
          variation: row.variation_name || null
        });
      }
    });

    const detailedOrders = Array.from(ordersMap.values());

    return { success: true, orders: detailedOrders };
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
