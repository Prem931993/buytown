import * as models from '../models/order.models.js';
import db from '../../../config/db.js';

function getFinancialYear() {
  const today = new Date();
  let year = today.getFullYear();
  const month = today.getMonth() + 1; // January is 0
  // Financial year starts from April
  if (month < 4) {
    return `${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
  } else {
    return `${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
  }
}

async function getLastOrderNumberForFinancialYear(financialYear) {
  try {
    const likePattern = `BYT-${financialYear}-%`;
    const lastOrder = await db('byt_orders')
      .where('order_number', 'like', likePattern)
      .orderBy('order_number', 'desc')
      .first();

    if (!lastOrder || !lastOrder.order_number) {
      return null;
    }
    return lastOrder.order_number;
  } catch (error) {
    console.error('Error fetching last order number:', error);
    return null;
  }
}

function extractSequenceNumber(orderNumber) {
  // orderNumber format: BYT-24-25-000000001
  const parts = orderNumber.split('-');
  if (parts.length === 4) {
    return parseInt(parts[3], 10);
  }
  return 0;
}

export async function generateOrderNumber() {
  const financialYear = getFinancialYear();
  const lastOrderNumber = await getLastOrderNumberForFinancialYear(financialYear);

  let nextSequence = 1;
  if (lastOrderNumber) {
    const lastSeq = extractSequenceNumber(lastOrderNumber);
    nextSequence = lastSeq + 1;
  }

  const sequenceStr = nextSequence.toString().padStart(9, '0');
  return `BYT-${financialYear}-${sequenceStr}`;
}

export async function createOrder(orderData) {
  try {
    // Generate order number if not provided
    if (!orderData.order_number) {
      orderData.order_number = await generateOrderNumber();
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
      paymentStatus: firstRow.payment_status || 'Pending',
      subtotal: parseFloat(firstRow.subtotal) || 0,
      shippingCost: parseFloat(firstRow.shipping_amount) || 0,
      tax: parseFloat(firstRow.tax_amount) || 0,
      discount: parseFloat(firstRow.discount_amount) || 0,
      total: parseFloat(firstRow.total_amount) || 0,
      deliveryDistance: parseFloat(firstRow.delivery_distance) || 0,
      deliveryCharges: parseFloat(firstRow.delivery_charges) || 0,
      deliveryPersonId: firstRow.delivery_person_id || null,
      deliveryDriver: firstRow.delivery_driver || null,
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
          total: parseFloat(row.item_total) || 0,
          type: 'product' // Mark as product item
        });
      }
    });

    // Note: Delivery charges are now handled separately in the total calculation, not as an order item

    // Add delivery charges as a separate field in the order summary breakup
    orderDetails.deliveryChargesBreakup = {
      subtotal: orderDetails.subtotal,
      shipping: orderDetails.shippingCost,
      tax: orderDetails.tax,
      deliveryCharges: orderDetails.deliveryCharges,
      discount: orderDetails.discount,
      total: orderDetails.total
    };

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
          total: parseFloat(row.total_amount) || 0,
          status: row.status || 'Pending',
          payment_method: row.payment_method || 'N/A',
          payment_status: 'Paid', // Default assumption
          shipping_method: 'Standard', // Default assumption
          tracking_number: null,
          subtotal: parseFloat(row.subtotal) || 0,
          shipping_cost: parseFloat(row.shipping_amount) || 0,
          tax: parseFloat(row.tax_amount) || 0,
          discount: parseFloat(row.discount_amount) || 0,
          delivery_distance: parseFloat(row.delivery_distance) || 0,
          delivery_charges: parseFloat(row.delivery_charges) || 0,
          delivery_person_id: row.delivery_person_id || null,
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
          variation: row.variation_name || null,
          type: 'product' // Mark as product item
        });
      }
    });

    // Note: Delivery charges are now handled separately in the total calculation, not as order items

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

export async function approveOrder(orderId, vehicleId, deliveryDistance, deliveryPersonId = null) {
  try {
    // Get vehicle information directly
    const vehicle = await db('byt_vehicle_management')
      .where('id', vehicleId)
      .select('rate_per_km', 'vehicle_type')
      .first();

    if (!vehicle) {
      return { success: false, error: 'Vehicle not found' };
    }

    // Calculate delivery charges
    const deliveryCharges = deliveryDistance * parseFloat(vehicle.rate_per_km);

    // Get current order details to calculate new total
    const currentOrder = await db('byt_orders')
      .where('id', orderId)
      .select('subtotal', 'shipping_amount', 'tax_amount', 'discount_amount', 'total_amount')
      .first();

    if (!currentOrder) {
      return { success: false, error: 'Order not found' };
    }

    // Calculate new total including delivery charges
    const newTotal = parseFloat(currentOrder.subtotal) +
                     parseFloat(currentOrder.shipping_amount) +
                     parseFloat(currentOrder.tax_amount) -
                     parseFloat(currentOrder.discount_amount) +
                     deliveryCharges;

    // Get delivery person name if deliveryPersonId is provided
    let deliveryPersonName = null;
    if (deliveryPersonId) {
      const deliveryPerson = await db('byt_users')
        .where('id', deliveryPersonId)
        .select('firstname', 'lastname')
        .first();

      if (deliveryPerson) {
        deliveryPersonName = `${deliveryPerson.firstname || ''} ${deliveryPerson.lastname || ''}`.trim();
      }
    }

    // Update order with approval details and recalculated total
    const updateData = {
      status: 'approved',
      delivery_distance: deliveryDistance,
      delivery_charges: deliveryCharges,
      delivery_vehicle: vehicle.vehicle_type,
      delivery_person_id: deliveryPersonId,
      delivery_driver: deliveryPersonName,
      total_amount: newTotal,
      updated_at: new Date()
    };

    const result = await db('byt_orders')
      .where('id', orderId)
      .update(updateData);

    if (result > 0) {
      // Get updated order details
      const orderResult = await getOrderById(orderId);
      return { success: true, order: orderResult.order };
    } else {
      return { success: false, error: 'Order not found or could not be updated' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function rejectOrder(orderId, rejectionReason) {
  try {
    const updateData = {
      status: 'rejected',
      rejection_reason: rejectionReason,
      updated_at: new Date()
    };

    const result = await db('byt_orders')
      .where('id', orderId)
      .update(updateData);

    if (result > 0) {
      // Get updated order details
      const orderResult = await getOrderById(orderId);
      return { success: true, order: orderResult.order };
    } else {
      return { success: false, error: 'Order not found or could not be updated' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function assignDeliveryPerson(orderId, deliveryPersonId, deliveryDistance) {
  try {
    // First, get the delivery person's vehicle information to calculate delivery charges
    const deliveryPerson = await db('byt_users')
      .join('byt_user_vehicle', 'byt_users.id', 'byt_user_vehicle.user_id')
      .join('byt_vehicle_management', 'byt_user_vehicle.vehicle_id', 'byt_vehicle_management.id')
      .where('byt_users.id', deliveryPersonId)
      .select('byt_users.firstname', 'byt_users.lastname', 'byt_vehicle_management.rate_per_km')
      .first();

    if (!deliveryPerson) {
      return { success: false, error: 'Delivery person not found or no vehicle assigned' };
    }

    // Calculate delivery charges
    const deliveryCharges = deliveryDistance * deliveryPerson.rate_per_km;

    // Create delivery person name
    const deliveryPersonName = `${deliveryPerson.firstname || ''} ${deliveryPerson.lastname || ''}`.trim();

    // Update order with delivery assignment details
    const updateData = {
      delivery_person_id: deliveryPersonId,
      delivery_driver: deliveryPersonName,
      delivery_distance: deliveryDistance,
      delivery_charges: deliveryCharges,
      updated_at: new Date()
    };

    const result = await db('byt_orders')
      .where('id', orderId)
      .update(updateData);

    if (result > 0) {
      // Get updated order details
      const orderResult = await getOrderById(orderId);
      return { success: true, order: orderResult.order };
    } else {
      return { success: false, error: 'Order not found or could not be updated' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function markOrderCompleted(orderId) {
  try {
    const updateData = {
      status: 'completed',
      updated_at: new Date()
    };

    const result = await db('byt_orders')
      .where('id', orderId)
      .update(updateData);

    if (result > 0) {
      // Get updated order details
      const orderResult = await getOrderById(orderId);
      return { success: true, order: orderResult.order };
    } else {
      return { success: false, error: 'Order not found or could not be updated' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function calculateDeliveryCharge(orderId, vehicleId) {
  try {
    // Get order details to get delivery distance
    const order = await db('byt_orders')
      .where('id', orderId)
      .select('delivery_distance')
      .first();

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (!order.delivery_distance || order.delivery_distance <= 0) {
      return { success: false, error: 'Delivery distance not calculated for this order' };
    }

    // Get vehicle information directly
    const vehicle = await db('byt_vehicle_management')
      .where('id', vehicleId)
      .select(
        'rate_per_km',
        'vehicle_type',
      )
      .first();

    if (!vehicle) {
      return { success: false, error: 'Vehicle not found' };
    }

    // Calculate delivery charge
    const deliveryCharge = order.delivery_distance * parseFloat(vehicle.rate_per_km);

    return {
      success: true,
      delivery_charge: deliveryCharge,
      delivery_distance: order.delivery_distance,
      vehicle_rate: parseFloat(vehicle.rate_per_km),
      vehicle_type: vehicle.vehicle_type
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
