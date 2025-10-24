import * as models from '../models/order.models.js';
import db from '../../../config/db.js';
import * as notificationServices from '../../notifications/services/notification.services.js';
import * as notificationModels from '../../notifications/models/notification.models.js';

// Helper function to update product status based on stock availability
async function updateProductStatus(productId, variationId = null) {
  try {

      // For products, check actual stock (not available stock)
      const product = await db('byt_products')
        .where('id', productId)
        .select('stock')
        .first();

      if (product) {
        // If stock is 0, mark as out of stock (inactive), otherwise active
        await db('byt_products')
          .where('id', productId)
          .update({ status: product.stock > 0 ? 1 : 2 });
      }
  } catch (error) {
    console.error('Error updating product status:', error);
  }
}

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
    // First, get order with items and basic info
    const orderRows = await db('byt_orders')
      .leftJoin('byt_users', 'byt_orders.user_id', 'byt_users.id')
      .leftJoin('byt_order_items', 'byt_orders.id', 'byt_order_items.order_id')
      .leftJoin('byt_products', 'byt_order_items.product_id', 'byt_products.id')
      .leftJoin('byt_product_variations', 'byt_order_items.variation_id', 'byt_product_variations.id')
      .leftJoin('byt_variations', 'byt_product_variations.variation_id', 'byt_variations.id')
      .leftJoin('byt_users as delivery_user', 'byt_orders.delivery_person_id', 'delivery_user.id')
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
        'byt_products.hsn_code as product_hsn',
        'byt_products.gst as product_gst',
        'byt_variations.label as variation_name',
        'delivery_user.firstname as delivery_firstname',
        'delivery_user.lastname as delivery_lastname',
        'delivery_user.vehicle_number as delivery_vehicle_number'
      );

    if (orderRows.length === 0) {
      return { success: false, error: 'Order not found' };
    }

    // Get vehicle information separately to avoid duplication
    const vehicleInfo = await db('byt_orders')
      .leftJoin('byt_users as delivery_user', 'byt_orders.delivery_person_id', 'delivery_user.id')
      .leftJoin('byt_user_vehicle', 'delivery_user.id', 'byt_user_vehicle.user_id')
      .leftJoin('byt_vehicle_management', 'byt_user_vehicle.vehicle_id', 'byt_vehicle_management.id')
      .where('byt_orders.id', id)
      .whereNotNull('byt_orders.delivery_person_id')
      .select(
        'byt_vehicle_management.vehicle_type as delivery_vehicle_type',
        'byt_user_vehicle.vehicle_number as assigned_vehicle_number'
      )
      .first();

    // Add vehicle info to the first row
    const firstRow = {
      ...orderRows[0],
      delivery_vehicle_type: vehicleInfo?.delivery_vehicle_type,
      assigned_vehicle_number: vehicleInfo?.assigned_vehicle_number
    };

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
      user_id: firstRow.user_id,
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
      rejection_reason: firstRow.rejection_reason || null,
      notes: firstRow.notes || null,
      vehicle: firstRow.delivery_person_id ? {
        vehicle_number: firstRow.assigned_vehicle_number || firstRow.delivery_vehicle_number || 'N/A',
        vehicle_type: firstRow.delivery_vehicle_type || 'N/A'
      } : null,
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
        const gstRate = parseFloat(row.product_gst) || 0;
        const basePrice = parseFloat(row.item_price) || 0;
        const quantity = row.quantity || 0;
        const taxAmount = basePrice * gstRate / 100 * quantity;

        orderDetails.items.push({
          id: row.item_id,
          name: row.product_name || 'Unknown Product',
          sku: row.product_sku || 'N/A',
          hsn_code: row.product_hsn || 'N/A',
          price: basePrice,
          quantity: quantity,
          total: parseFloat(row.item_total) || 0,
          gst_rate: gstRate,
          tax_amount: taxAmount,
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
    // First, get orders with items and basic info
    const ordersWithItems = await db('byt_orders')
      .leftJoin('byt_users', 'byt_orders.user_id', 'byt_users.id')
      .leftJoin('byt_order_items', 'byt_orders.id', 'byt_order_items.order_id')
      .leftJoin('byt_products', 'byt_order_items.product_id', 'byt_products.id')
      .leftJoin('byt_product_variations', 'byt_order_items.variation_id', 'byt_product_variations.id')
      .leftJoin('byt_variations', 'byt_product_variations.variation_id', 'byt_product_variations.id')
      .leftJoin('byt_users as delivery_user', 'byt_orders.delivery_person_id', 'delivery_user.id')
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
        'byt_products.hsn_code as product_hsn',
        'byt_products.gst as product_gst',
        'byt_variations.label as variation_name',
        'delivery_user.firstname as delivery_firstname',
        'delivery_user.lastname as delivery_lastname',
        'delivery_user.vehicle_number as delivery_vehicle_number'
      )
      .orderBy('byt_orders.created_at', 'desc');

    // Get vehicle information separately to avoid duplication
    const vehicleInfo = await db('byt_orders')
      .leftJoin('byt_users as delivery_user', 'byt_orders.delivery_person_id', 'delivery_user.id')
      .leftJoin('byt_user_vehicle', 'delivery_user.id', 'byt_user_vehicle.user_id')
      .leftJoin('byt_vehicle_management', 'byt_user_vehicle.vehicle_id', 'byt_vehicle_management.id')
      .whereNotNull('byt_orders.delivery_person_id')
      .select(
        'byt_orders.id as order_id',
        'byt_vehicle_management.vehicle_type as delivery_vehicle_type',
        'byt_user_vehicle.vehicle_number as assigned_vehicle_number'
      )
      .distinct('byt_orders.id');

    // Create a map of order_id to vehicle info
    const vehicleMap = new Map();
    vehicleInfo.forEach(vehicle => {
      vehicleMap.set(vehicle.order_id, {
        vehicle_type: vehicle.delivery_vehicle_type,
        vehicle_number: vehicle.assigned_vehicle_number
      });
    });

    // Now process orders with vehicle info
    const orders = ordersWithItems.map(row => ({
      ...row,
      delivery_vehicle_type: vehicleMap.get(row.id)?.vehicle_type,
      assigned_vehicle_number: vehicleMap.get(row.id)?.vehicle_number
    }));

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
          delivery_driver: row.delivery_driver || null,
          rejection_reason: row.rejection_reason || null,
          notes: row.notes || null,
          vehicle: row.delivery_person_id ? {
            vehicle_number: row.assigned_vehicle_number || row.delivery_vehicle_number || 'N/A',
            vehicle_type: row.delivery_vehicle_type || 'N/A'
          } : null,
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
          hsn_code: row.product_hsn || 'N/A',
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
    // Import vehicle model to calculate delivery charges
    const { calculateDeliveryCharge } = await import('../../vehicles/models/vehicle.models.js');

    // Validate delivery person exists and has correct role
    if (deliveryPersonId) {
      const deliveryPerson = await db('byt_users')
        .join('byt_roles', 'byt_users.role_id', 'byt_roles.id')
        .where('byt_users.id', deliveryPersonId)
        .andWhere('byt_roles.name', 'delivery_person')
        .select('byt_users.firstname', 'byt_users.lastname', 'byt_users.id')
        .first();

      if (!deliveryPerson) {
        return { success: false, error: 'Invalid delivery person selected' };
      }
    }

    // Calculate delivery charges using new vehicle-based logic
    const chargeDetails = await calculateDeliveryCharge(vehicleId, deliveryDistance);

    // Get current order details to calculate new total
    const currentOrder = await db('byt_orders')
      .where('id', orderId)
      .select('subtotal', 'shipping_amount', 'tax_amount', 'discount_amount', 'total_amount', 'user_id', 'id', 'order_number', 'delivery_charges', 'delivery_distance', 'delivery_driver')
      .first();

    if (!currentOrder) {
      return { success: false, error: 'Order not found' };
    }

    // Calculate new total including delivery charges
    const newTotal = parseFloat(currentOrder.subtotal) +
                     parseFloat(currentOrder.shipping_amount) +
                     parseFloat(currentOrder.tax_amount) -
                     parseFloat(currentOrder.discount_amount) +
                     chargeDetails.total_charge;

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
      delivery_charges: chargeDetails.total_charge,
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
      await notificationServices.createOrderApprovalNotification(orderResult.order);

      // Send notification for order approval
      try {
        const user = {
          id: orderResult.order.user_id,
          first_name: orderResult.order.customer.name.split(' ')[0] || 'Customer',
          last_name: orderResult.order.customer.name.split(' ').slice(1).join(' ') || '',
          email: orderResult.order.customer.email,
          phone: orderResult.order.customer.phone
        };
        await notificationServices.createOrderStatusNotification(orderResult.order, user, 'confirmed');

      } catch (notificationError) {
        console.error('Error sending order approval notification:', notificationError);
      }

      return { success: true, order: orderResult.order };
    } else {
      return { success: false, error: 'Order not found or could not be updated' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function rejectOrder(orderId, rejectionReason, rejectedByUserId = null) {
  try {
    // Get order items to restore stock before rejecting
    const orderItems = await db('byt_order_items')
      .where('order_id', orderId)
      .select('product_id', 'variation_id', 'quantity');

    // Restore stock for rejected order
    for (const item of orderItems) {
        // For products, decrease held_quantity (since stock is released)
        await db('byt_products')
          .where('id', item.product_id)
          .decrement('held_quantity', item.quantity);
        // Update product status if stock becomes available
        await updateProductStatus(item.product_id);
    }

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

      // Send notification for order cancellation
      try {
        const user = {
          id: orderResult.order.customer.id || orderResult.order.user_id,
          first_name: orderResult.order.customer.name.split(' ')[0] || 'Customer',
          last_name: orderResult.order.customer.name.split(' ').slice(1).join(' ') || '',
          email: orderResult.order.customer.email,
          phone: orderResult.order.customer.phone
        };
        await notificationServices.createOrderStatusNotification(orderResult.order, user, 'cancelled');

        // Send detailed rejection notification with reference to who rejected
        if (rejectedByUserId) {
          const rejectedByUser = await db('byt_users')
            .where('id', rejectedByUserId)
            .select('firstname', 'lastname', 'role')
            .first();

          if (rejectedByUser) {
            await notificationServices.createOrderRejectionNotification(
              orderResult.order,
              {
                firstname: rejectedByUser.firstname,
                lastname: rejectedByUser.lastname,
                role: rejectedByUser.role
              },
              rejectionReason
            );
          }
        }
      } catch (notificationError) {
        console.error('Error sending order rejection notification:', notificationError);
      }

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
    // First, get the delivery person's vehicle information
    const deliveryPerson = await db('byt_users')
      .join('byt_user_vehicle', 'byt_users.id', 'byt_user_vehicle.user_id')
      .join('byt_vehicle_management', 'byt_user_vehicle.vehicle_id', 'byt_vehicle_management.id')
      .where('byt_users.id', deliveryPersonId)
      .select('byt_users.firstname', 'byt_users.lastname', 'byt_vehicle_management.id as vehicle_id')
      .first();

    if (!deliveryPerson) {
      return { success: false, error: 'Delivery person not found or no vehicle assigned' };
    }

    // Import vehicle model to calculate delivery charges using new logic
    const { calculateDeliveryCharge } = await import('../../vehicles/models/vehicle.models.js');

    // Calculate delivery charges using new vehicle-based logic
    const chargeDetails = await calculateDeliveryCharge(deliveryPerson.vehicle_id, deliveryDistance);

    // Create delivery person name
    const deliveryPersonName = `${deliveryPerson.firstname || ''} ${deliveryPerson.lastname || ''}`.trim();

    // Update order with delivery assignment details
    const updateData = {
      delivery_person_id: deliveryPersonId,
      delivery_driver: deliveryPersonName,
      delivery_distance: deliveryDistance,
      delivery_charges: chargeDetails.total_charge,
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
    // Get order items to reduce stock before marking as completed
    const orderItems = await db('byt_order_items')
      .where('order_id', orderId)
      .select('product_id', 'variation_id', 'quantity');

    // Reduce stock permanently for completed order
    for (const item of orderItems) {
      // For products, decrease stock and decrease held_quantity
      await db('byt_products')
        .where('id', item.product_id)
        .decrement('stock', item.quantity)
        .decrement('held_quantity', item.quantity);
      // Update product status if stock becomes 0
      await updateProductStatus(item.product_id);
    }

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

      // Send notification for order approval
      try {
        const user = {
          id: orderResult.order.user_id,
          first_name: orderResult.order.customer.name.split(' ')[0] || 'Customer',
          last_name: orderResult.order.customer.name.split(' ').slice(1).join(' ') || '',
          email: orderResult.order.customer.email,
          phone: orderResult.order.customer.phone
        };
        await notificationServices.createOrderStatusNotification(orderResult.order, user, 'delivered');

      } catch (notificationError) {
        console.error('Error sending order approval notification:', notificationError);
      }
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

    // Import vehicle model to calculate delivery charges using new logic
    const { calculateDeliveryCharge: calculateVehicleCharge } = await import('../../vehicles/models/vehicle.models.js');

    // Calculate delivery charges using new vehicle-based logic
    const chargeDetails = await calculateVehicleCharge(vehicleId, order.delivery_distance);

    return {
      success: true,
      delivery_charge: chargeDetails.total_charge,
      delivery_distance: order.delivery_distance,
      base_charge: chargeDetails.base_charge,
      max_distance_km: chargeDetails.max_distance_km,
      additional_charge_per_km: chargeDetails.additional_charge_per_km,
      vehicle_type: chargeDetails.vehicle_type || 'N/A'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function cancelOrderByCustomer(orderId, customerId, cancellationReason) {
  try {
    // Verify the order belongs to the customer
    const order = await db('byt_orders')
      .where('id', orderId)
      .andWhere('user_id', customerId)
      .first();

    if (!order) {
      return { success: false, error: 'Order not found or does not belong to this customer' };
    }

    // Check if order can be cancelled (not already completed or delivered)
    if (['completed', 'delivered', 'cancelled'].includes(order.status)) {
      return { success: false, error: 'Order cannot be cancelled at this stage' };
    }

    // Get order items to restore stock
    const orderItems = await db('byt_order_items')
      .where('order_id', orderId)
      .select('product_id', 'variation_id', 'quantity');

    // Restore stock for cancelled order
    for (const item of orderItems) {
        // For products, decrease held_quantity (since stock is released)
        await db('byt_products')
          .where('id', item.product_id)
          .decrement('held_quantity', item.quantity);
        // Update product status if stock becomes available
        await updateProductStatus(item.product_id);
    }

    const updateData = {
      status: 'cancelled',
      rejection_reason: cancellationReason,
      updated_at: new Date(),
      payment_status: 'cancelled'
    };

    const result = await db('byt_orders')
      .where('id', orderId)
      .update(updateData);

    if (result > 0) {
      // Get updated order details
      const orderResult = await getOrderById(orderId);

      // Send notification for customer cancellation
      try {
        const customer = await db('byt_users')
          .where('id', customerId)
          .select('firstname', 'lastname')
          .first();

        if (customer) {
          await notificationServices.createOrderCancellationNotification(orderResult.order, customer);
        }
      } catch (notificationError) {
        console.error('Error sending order cancellation notification:', notificationError);
      }

      return { success: true, order: orderResult.order };
    } else {
      return { success: false, error: 'Order not found or could not be updated' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
  }

export async function completeOrderByDelivery(orderId, deliveryPersonId) {
  try {
    // Verify order assigned to deliveryPersonId
    const order = await getOrderById(orderId);
    if (!order.success || !order.order) {
      return { success: false, error: 'Order not found' };
    }
    if (order.order.deliveryPersonId !== deliveryPersonId) {
      return { success: false, error: 'Unauthorized: Order not assigned to this delivery person' };
    }

    // Get order items to reduce stock before marking as completed
    const orderItems = await db('byt_order_items')
      .where('order_id', orderId)
      .select('product_id', 'variation_id', 'quantity');

    // Reduce stock permanently for completed order
    for (const item of orderItems) {
      // For products, decrease stock and decrease held_quantity
      await db('byt_products')
        .where('id', item.product_id)
        .decrement('stock', item.quantity)
        .decrement('held_quantity', item.quantity);
      // Update product status if stock becomes 0
      await updateProductStatus(item.product_id);
    }

    // Update order status to completed
    const updatedOrder = await updateOrder(orderId, { status: 'completed', status_updated_by: deliveryPersonId });

    // Send notifications to admin and customer
    const adminNotification = {
      type: 'order',
      title: 'Order Completed',
      message: `Order #${orderId} has been completed by delivery personnel.`,
      recipient_type: 'admin',
      recipient_id: null,
      reference_type: 'order',
      reference_id: orderId
    };
    const userNotification = {
      type: 'order',
      title: 'Order Completed',
      message: `Your order #${orderId} has been marked as completed.`,
      recipient_type: 'user',
      recipient_id: order.order.user_id,
      reference_type: 'order',
      reference_id: orderId
    };
    await notificationModels.createNotification(adminNotification);
    await notificationModels.createNotification(userNotification);

    return { success: true, order: updatedOrder };
  } catch (error) {
    throw new Error(`Error completing order: ${error.message}`);
  }
}

export async function rejectOrderByDelivery(orderId, deliveryPersonId, rejectionReason) {
  try {
    // Verify order assigned to deliveryPersonId
    const order = await getOrderById(orderId);
    if (!order.success || !order.order) {
      return { success: false, error: 'Order not found' };
    }
    if (order.order.deliveryPersonId !== deliveryPersonId) {
      return { success: false, error: 'Unauthorized: Order not assigned to this delivery person' };
    }

    // Get order items to restore stock before rejecting
    const orderItems = await db('byt_order_items')
      .where('order_id', orderId)
      .select('product_id', 'variation_id', 'quantity');

    // Restore stock for rejected order
    for (const item of orderItems) {
        // For products, decrease held_quantity (since stock is released)
        await db('byt_products')
          .where('id', item.product_id)
          .decrement('held_quantity', item.quantity);
        // Update product status if stock becomes available
        await updateProductStatus(item.product_id);
    }

    // Update order status to rejected with reason
    const updatedOrder = await updateOrder(orderId, { status: 'rejected', rejection_reason: rejectionReason, status_updated_by: deliveryPersonId });

    // Send notifications to admin and customer
    const adminNotification = {
      type: 'order',
      title: 'Order Rejected',
      message: `Order #${orderId} has been rejected by delivery personnel. Reason: ${rejectionReason}`,
      recipient_type: 'admin',
      recipient_id: null,
      reference_type: 'order',
      reference_id: orderId
    };
    const userNotification = {
      type: 'order',
      title: 'Order Rejected',
      message: `Your order #${orderId} has been rejected. Reason: ${rejectionReason}`,
      recipient_type: 'user',
      recipient_id: order.order.user_id,
      reference_type: 'order',
      reference_id: orderId
    };
    await notificationModels.createNotification(adminNotification);
    await notificationModels.createNotification(userNotification);

    return { success: true, order: updatedOrder };
  } catch (error) {
    throw new Error(`Error rejecting order: ${error.message}`);
  }
}

export async function markOrderReceivedByUser(orderId, customerId) {
  try {
    // Verify the order belongs to the customer
    const order = await db('byt_orders')
      .where('id', orderId)
      .andWhere('user_id', customerId)
      .first();

    if (!order) {
      return { success: false, error: 'Order not found or does not belong to this customer' };
    }

    // Check if order can be marked as received (must be completed or delivered)
    if (!['completed', 'delivered'].includes(order.status)) {
      return { success: false, error: 'Order cannot be marked as received at this stage' };
    }

    // Update order status to received
    const updateData = {
      status: 'received',
      updated_at: new Date()
    };

    const result = await db('byt_orders')
      .where('id', orderId)
      .update(updateData);

    if (result > 0) {
      // Get updated order details
      const orderResult = await getOrderById(orderId);

      // Send notification for order received
      try {
        const customer = await db('byt_users')
          .where('id', customerId)
          .select('firstname', 'lastname')
          .first();

        if (customer) {
          await notificationServices.createOrderReceivedNotification(orderResult.order, customer);
        }
      } catch (notificationError) {
        console.error('Error sending order received notification:', notificationError);
      }

      return { success: true, order: orderResult.order };
    } else {
      return { success: false, error: 'Order not found or could not be updated' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}


