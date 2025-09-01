import db from '../../../config/db.js';

// Get orders awaiting confirmation count
export async function getOrdersAwaitingConfirmationCount() {
  try {
    const result = await db('byt_orders')
      .where('status', 'awaiting_confirmation')
      .where('deleted_at', null)
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
      .where('byt_products.deleted_at', null)
      .orderBy('byt_products.stock', 'asc')
      .limit(limit);

    return { success: true, products };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get recent sales (last 30 days)
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
        'byt_users.name as customer_name'
      )
      .where('byt_orders.created_at', '>=', date)
      .where('byt_orders.deleted_at', null)
      .orderBy('byt_orders.created_at', 'desc')
      .limit(20);

    return { success: true, sales };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get popular products (most sold based on order history - simplified version)
export async function getPopularProducts(limit = 10) {
  try {
    // This is a simplified version - in a real scenario, you'd have order items table
    // For now, we'll return products with highest stock (assuming popular products)
    const products = await db('byt_products')
      .leftJoin('byt_categories', 'byt_products.category_id', 'byt_categories.id')
      .leftJoin('byt_brands', 'byt_products.brand_id', 'byt_brands.id')
      .select(
        'byt_products.id',
        'byt_products.name',
        'byt_products.sku_code',
        'byt_products.price',
        'byt_products.stock',
        'byt_categories.name as category_name',
        'byt_brands.name as brand_name'
      )
      .where('byt_products.deleted_at', null)
      .orderBy('byt_products.stock', 'desc')
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
      .where('deleted_at', null)
      .groupBy('delivery_vehicle')
      .orderBy('usage_count', 'desc')
      .limit(10);

    return { success: true, vehicles };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get total products count
export async function getTotalProductsCount() {
  try {
    const result = await db('byt_products')
      .where('deleted_at', null)
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
      .where('deleted_at', null)
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
      .where('deleted_at', null)
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
      .where('deleted_at', null)
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
      .where('deleted_at', null)
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
      deliveryVehicles
    ] = await Promise.all([
      getOrdersAwaitingConfirmationCount(),
      getTotalProductsCount(),
      getTotalOrdersCount(),
      getTotalUsersCount(),
      getTotalRevenue(),
      getLowStockProducts(5),
      getRecentSales(30),
      getPopularProducts(5),
      getMostUsedDeliveryVehicles()
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
        deliveryVehicles: deliveryVehicles.success ? deliveryVehicles.vehicles : []
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
