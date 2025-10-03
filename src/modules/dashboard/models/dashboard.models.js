import db from '../../../config/db.js';

export async function getOrdersAwaitingConfirmationCount() {
  try {
    const result = await db('byt_orders')
      .where('status', 'awaiting_confirmation')
      .count('* as count')
      .first();

    return { success: true, count: parseInt(result.count) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get low stock products (products with stock <= 5)
export async function getLowStockProducts(limit = 10) {
  try {
    const products = await db('byt_products')
      .leftJoin('byt_categories', 'byt_products.category_id', 'byt_categories.id')
      .leftJoin('byt_brands', 'byt_products.brand_id', 'byt_brands.id')
      .select(
        'byt_products.id',
        'byt_products.name',
        'byt_products.sku_code',
        'byt_products.stock',
        'byt_products.price',
        'byt_categories.name as category_name',
        'byt_brands.name as brand_name'
      )
      .where('byt_products.stock', '<=', 5)
      .orderBy('byt_products.stock', 'asc')
      .limit(limit);

    return { success: true, products };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getRecentSales(days = 30) {
  try {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const sales = await db('byt_orders')
      .leftJoin('byt_users', 'byt_orders.user_id', 'byt_users.id')
      .select(
        'byt_orders.id',
        'byt_orders.order_number',
        'byt_orders.total_amount',
        'byt_orders.status',
        'byt_orders.created_at',
        'byt_users.firstname as customer_name'
      )
      .where('byt_orders.created_at', '>=', date)
      .orderBy('byt_orders.created_at', 'desc')
      .limit(10);

    return { success: true, sales };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get popular products (most sold based on order history)
export async function getPopularProducts(limit = 10) {
  try {
    const products = await db('byt_order_items')
      .leftJoin('byt_products', 'byt_order_items.product_id', 'byt_products.id')
      .leftJoin('byt_categories', 'byt_products.category_id', 'byt_categories.id')
      .leftJoin('byt_brands', 'byt_products.brand_id', 'byt_brands.id')
      .leftJoin('byt_orders', 'byt_order_items.order_id', 'byt_orders.id')
      .select(
        'byt_products.id',
        'byt_products.name',
        'byt_products.sku_code',
        'byt_products.price',
        'byt_products.stock',
        'byt_categories.name as category_name',
        'byt_brands.name as brand_name'
      )
      .sum('byt_order_items.quantity as total_sold')
      .count('byt_order_items.order_id as order_count')
      .where('byt_orders.status', '!=', 'cancelled') // Exclude cancelled orders
      .where('byt_orders.status', '!=', 'rejected') // Exclude rejected orders
      .groupBy(
        'byt_products.id',
        'byt_products.name',
        'byt_products.sku_code',
        'byt_products.price',
        'byt_products.stock',
        'byt_categories.name',
        'byt_brands.name'
      )
      .orderBy('total_sold', 'desc')
      .limit(limit);

    return { success: true, products };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get most used delivery vehicles
export async function getMostUsedDeliveryVehicles() {
  try {
    const vehicles = await db('byt_orders')
      .select('delivery_vehicle')
      .count('* as usage_count')
      .whereNotNull('delivery_vehicle')
      .where('delivery_vehicle', '!=', '')
      .groupBy('delivery_vehicle')
      .orderBy('usage_count', 'desc')
      .limit(10);

    return { success: true, vehicles };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get top customers by order count (only users with role_id = 2)
export async function getTopCustomers(limit = 10) {
  try {
    const customers = await db('byt_orders')
      .leftJoin('byt_users', 'byt_orders.user_id', 'byt_users.id')
      .select(
        'byt_users.id',
        'byt_users.firstname',
        'byt_users.lastname',
        'byt_users.email',
        'byt_users.phone_no',
        'byt_users.role_id'
      )
      .count('byt_orders.id as order_count')
      .sum('byt_orders.total_amount as total_spent')
      .whereNotNull('byt_orders.user_id')
      .where('byt_users.role_id', 2) // Only customers (role_id = 2)
      .groupBy('byt_users.id', 'byt_users.firstname', 'byt_users.lastname', 'byt_users.email', 'byt_users.phone_no', 'byt_users.role_id')
      .orderBy('order_count', 'desc')
      .limit(limit);

    return { success: true, customers };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get all customers with orders
export async function getAllCustomersWithOrders(limit = 10) {
  try {
    const customers = await db('byt_orders')
      .leftJoin('byt_users', 'byt_orders.user_id', 'byt_users.id')
      .select(
        'byt_users.id',
        'byt_users.firstname',
        'byt_users.lastname',
        'byt_users.email',
        'byt_users.phone_no',
        'byt_users.role_id'
      )
      .count('byt_orders.id as order_count')
      .sum('byt_orders.total_amount as total_spent')
      .whereNotNull('byt_orders.user_id')
      .groupBy('byt_users.id', 'byt_users.firstname', 'byt_users.lastname', 'byt_users.email', 'byt_users.phone_no', 'byt_users.role_id')
      .orderBy('order_count', 'desc')
      .limit(limit);

    return { success: true, customers };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get total products count
export async function getTotalProductsCount() {
  try {
    const result = await db('byt_products')
      .count('* as count')
      .first();

    return { success: true, count: parseInt(result.count) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get total orders count
export async function getTotalOrdersCount() {
  try {
    const result = await db('byt_orders')
      .count('* as count')
      .first();

    return { success: true, count: parseInt(result.count) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get total users count
export async function getTotalUsersCount() {
  try {
    const result = await db('byt_users')
      .count('* as count')
      .first();

    return { success: true, count: parseInt(result.count) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get total revenue
export async function getTotalRevenue() {
  try {
    const result = await db('byt_orders')
      .sum('total_amount as total')
      .first();

    return { success: true, revenue: parseFloat(result.total || 0) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get monthly revenue for the last 12 months
export async function getMonthlyRevenue() {
  try {
    const revenue = await db('byt_orders')
      .select(
        db.raw("DATE_TRUNC('month', created_at) as month"),
        db.raw('SUM(total_amount) as revenue'),
        db.raw('COUNT(*) as order_count')
      )
      .where('created_at', '>=', db.raw("DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')"))
      .groupBy(db.raw("DATE_TRUNC('month', created_at)"))
      .orderBy('month', 'desc');

    return { success: true, revenue };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get order statistics
export async function getOrderStatistics() {
  try {
    const stats = await db('byt_orders')
      .select(
        db.raw('COUNT(*) as total_orders'),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as awaiting_confirmation', ['awaiting_confirmation']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as confirmed', ['confirmed']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as processing', ['processing']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as shipped', ['shipped']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as delivered', ['delivered']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as cancelled', ['cancelled']),
        db.raw('SUM(total_amount) as total_revenue'),
        db.raw('AVG(total_amount) as average_order_value')
      )
      .first();

    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get dashboard summary
export async function getDashboardSummary() {
  try {
    const [
      ordersAwaiting,
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      lowStockProducts,
      recentSales,
      popularProducts,
      deliveryVehicles,
      topCustomers
    ] = await Promise.all([
      getOrdersAwaitingConfirmationCount(),
      getTotalProductsCount(),
      getTotalOrdersCount(),
      getTotalUsersCount(),
      getTotalRevenue(),
      getLowStockProducts(5),
      getRecentSales(30),
      getPopularProducts(5),
      getMostUsedDeliveryVehicles(),
      getTopCustomers(5)
    ]);

    return {
      success: true,
      summary: {
        ordersAwaitingConfirmation: ordersAwaiting.success ? ordersAwaiting.count : 0,
        totalProducts: totalProducts.success ? totalProducts.count : 0,
        totalOrders: totalOrders.success ? totalOrders.count : 0,
        totalUsers: totalUsers.success ? totalUsers.count : 0,
        totalRevenue: totalRevenue.success ? totalRevenue.revenue : 0,
        lowStockProducts: lowStockProducts.success ? lowStockProducts.products : [],
        recentSales: recentSales.success ? recentSales.sales : [],
        popularProducts: popularProducts.success ? popularProducts.products : [],
        deliveryVehicles: deliveryVehicles.success ? deliveryVehicles.vehicles : [],
        topCustomers: topCustomers.success ? topCustomers.customers : []
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get delivery person order statistics
export async function getDeliveryPersonOrderStats(deliveryPersonId) {
  try {
    const stats = await db('byt_orders')
      .select(
        db.raw('COUNT(*) as total_assigned'),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as completed', ['completed']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending', ['approved']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as rejected', ['rejected'])
      )
      .where('delivery_person_id', deliveryPersonId)
      .first();

    return {
      success: true,
      stats: {
        total_assigned: parseInt(stats.total_assigned) || 0,
        completed: parseInt(stats.completed) || 0,
        pending: parseInt(stats.pending) || 0,
        rejected: parseInt(stats.rejected) || 0
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get delivery person orders with details
export async function getDeliveryPersonOrders(deliveryPersonId) {
  try {
    const orders = await db('byt_orders')
      .leftJoin('byt_users', 'byt_orders.user_id', 'byt_users.id')
      .leftJoin('byt_order_items', 'byt_orders.id', 'byt_order_items.order_id')
      .leftJoin('byt_products', 'byt_order_items.product_id', 'byt_products.id')
      .select(
        'byt_orders.id',
        'byt_orders.order_number',
        'byt_orders.total_amount',
        'byt_orders.status',
        'byt_orders.created_at',
        'byt_orders.shipping_address',
        'byt_orders.billing_address',
        'byt_orders.delivery_vehicle',
        'byt_users.firstname as customer_firstname',
        'byt_users.lastname as customer_lastname',
        'byt_users.phone_no as customer_phone',
        'byt_order_items.quantity',
        'byt_order_items.price as item_price',
        'byt_products.name as product_name',
        'byt_products.sku_code'
      )
      .where('byt_orders.delivery_person_id', deliveryPersonId)
      .orderBy('byt_orders.created_at', 'desc');

    // Group order items by order
    const groupedOrders = orders.reduce((acc, item) => {
      const orderId = item.id;
      if (!acc[orderId]) {
        acc[orderId] = {
          id: item.id,
          order_number: item.order_number,
          total_amount: item.total_amount,
          status: item.status,
          created_at: item.created_at,
          delivery_address: item.shipping_address,
          delivery_vehicle: item.delivery_vehicle,
          customer: {
            firstname: item.customer_firstname,
            lastname: item.customer_lastname,
            phone_no: item.customer_phone
          },
          items: []
        };
      }
      if (item.product_name) {
        acc[orderId].items.push({
          product_name: item.product_name,
          sku_code: item.sku_code,
          quantity: item.quantity,
          price: item.item_price
        });
      }
      return acc;
    }, {});

    const orderList = Object.values(groupedOrders);

    return {
      success: true,
      orders: orderList
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
