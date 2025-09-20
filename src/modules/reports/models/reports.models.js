import knex from '../../../config/db.js';

// Get top products by sales and revenue
export async function getTopProducts({ limit = 10, timeRange = 'last30days' } = {}) {
  try {
    let dateFilter = '';
    const now = new Date();

    switch (timeRange) {
      case 'today':
        dateFilter = `AND DATE(o.created_at) = DATE('${now.toISOString().split('T')[0]}')`;
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter = `AND DATE(o.created_at) = DATE('${yesterday.toISOString().split('T')[0]}')`;
        break;
      case 'last7days':
        dateFilter = `AND o.created_at >= NOW() - INTERVAL '7 days'`;
        break;
      case 'last30days':
        dateFilter = `AND o.created_at >= NOW() - INTERVAL '30 days'`;
        break;
      case 'thisMonth':
        dateFilter = `AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      case 'lastMonth':
        dateFilter = `AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month') AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')`;
        break;
      case 'thisYear':
        dateFilter = `AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      default:
        dateFilter = `AND o.created_at >= NOW() - INTERVAL '30 days'`;
    }

    const query = `
      SELECT
        p.id,
        p.name,
        p.sku_code,
        COUNT(oi.id) as sales,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue,
        0 as growth
      FROM byt_products p
      LEFT JOIN byt_order_items oi ON p.id = oi.product_id
      LEFT JOIN byt_orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      AND o.status != 'rejected'
      ${dateFilter}
      GROUP BY p.id, p.name, p.sku_code
      ORDER BY revenue DESC
      LIMIT ?
    `;

    const results = await knex.raw(query, [limit]);
    return results.rows;
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    throw error;
  }
}

// Get top categories by sales and revenue
export async function getTopCategories({ limit = 10, timeRange = 'last30days' } = {}) {
  try {
    let dateFilter = '';
    const now = new Date();

    switch (timeRange) {
      case 'today':
        dateFilter = `AND DATE(o.created_at) = DATE('${now.toISOString().split('T')[0]}')`;
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter = `AND DATE(o.created_at) = DATE('${yesterday.toISOString().split('T')[0]}')`;
        break;
      case 'last7days':
        dateFilter = `AND o.created_at >= NOW() - INTERVAL '7 days'`;
        break;
      case 'last30days':
        dateFilter = `AND o.created_at >= NOW() - INTERVAL '30 days'`;
        break;
      case 'thisMonth':
        dateFilter = `AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      case 'lastMonth':
        dateFilter = `AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month') AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')`;
        break;
      case 'thisYear':
        dateFilter = `AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      default:
        dateFilter = `AND o.created_at >= NOW() - INTERVAL '30 days'`;
    }

    const query = `
      SELECT
        c.id,
        c.name,
        COUNT(oi.id) as sales,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue,
        0 as growth
      FROM byt_categories c
      LEFT JOIN byt_products p ON c.id = p.category_id
      LEFT JOIN byt_order_items oi ON p.id = oi.product_id
      LEFT JOIN byt_orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      AND o.status != 'rejected'
      AND c.is_active = true
      ${dateFilter}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT ?
    `;

    const results = await knex.raw(query, [limit]);
    return results.rows;
  } catch (error) {
    console.error('Error in getTopCategories:', error);
    throw error;
  }
}

// Get sales by region (using shipping address or billing address)
export async function getSalesByRegion({ limit = 10, timeRange = 'last30days' } = {}) {
  try {
    let dateFilter = '';
    const now = new Date();

    switch (timeRange) {
      case 'today':
        dateFilter = `AND DATE(o.created_at) = DATE('${now.toISOString().split('T')[0]}')`;
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter = `AND DATE(o.created_at) = DATE('${yesterday.toISOString().split('T')[0]}')`;
        break;
      case 'last7days':
        dateFilter = `AND o.created_at >= NOW() - INTERVAL '7 days'`;
        break;
      case 'last30days':
        dateFilter = `AND o.created_at >= NOW() - INTERVAL '30 days'`;
        break;
      case 'thisMonth':
        dateFilter = `AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      case 'lastMonth':
        dateFilter = `AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month') AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')`;
        break;
      case 'thisYear':
        dateFilter = `AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      default:
        dateFilter = `AND o.created_at >= NOW() - INTERVAL '30 days'`;
    }

    const query = `
      SELECT
        COALESCE(
          NULLIF(TRIM(o.shipping_address), ''),
          NULLIF(TRIM(o.billing_address), ''),
          'Unknown'
        ) as region,
        COUNT(o.id) as sales,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        0 as growth
      FROM byt_orders o
      WHERE o.status != 'cancelled'
      AND o.status != 'rejected'
      ${dateFilter}
      GROUP BY region
      ORDER BY revenue DESC
      LIMIT ?
    `;

    const results = await knex.raw(query, [limit]);
    return results.rows;
  } catch (error) {
    console.error('Error in getSalesByRegion:', error);
    throw error;
  }
}

// Get dashboard summary statistics
export async function getDashboardSummary({ timeRange = 'last30days' } = {}) {
  try {
    let dateFilter = '';
    const now = new Date();

    switch (timeRange) {
      case 'today':
        dateFilter = `AND DATE(created_at) = DATE('${now.toISOString().split('T')[0]}')`;
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter = `AND DATE(created_at) = DATE('${yesterday.toISOString().split('T')[0]}')`;
        break;
      case 'last7days':
        dateFilter = `AND created_at >= NOW() - INTERVAL '7 days'`;
        break;
      case 'last30days':
        dateFilter = `AND created_at >= NOW() - INTERVAL '30 days'`;
        break;
      case 'thisMonth':
        dateFilter = `AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      case 'lastMonth':
        dateFilter = `AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month') AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')`;
        break;
      case 'thisYear':
        dateFilter = `AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      default:
        dateFilter = `AND created_at >= NOW() - INTERVAL '30 days'`;
    }

    // Get total sales
    const totalSalesQuery = `
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM byt_orders
      WHERE status != 'cancelled'
      AND status != 'rejected'
      ${dateFilter}
    `;
    const totalSalesResult = await knex.raw(totalSalesQuery);
    const totalSales = parseFloat(totalSalesResult.rows[0]?.total || 0);

    // Get total orders
    const totalOrdersQuery = `
      SELECT COUNT(*) as total
      FROM byt_orders
      WHERE status != 'cancelled'
      AND status != 'rejected'
      ${dateFilter}
    `;
    const totalOrdersResult = await knex.raw(totalOrdersQuery);
    const totalOrders = parseInt(totalOrdersResult.rows[0]?.total || 0);

    // Get products sold
    const productsSoldQuery = `
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM byt_order_items oi
      JOIN byt_orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      AND o.status != 'rejected'
      AND o.created_at >= NOW() - INTERVAL '30 days'
    `;
    const productsSoldResult = await knex.raw(productsSoldQuery);
    const productsSold = parseInt(productsSoldResult.rows[0]?.total || 0);

    // Get new customers (removed role filter since column doesn't exist)
    const newCustomersQuery = `
      SELECT COUNT(*) as total
      FROM byt_users
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;
    const newCustomersResult = await knex.raw(newCustomersQuery);
    const newCustomers = parseInt(newCustomersResult.rows[0]?.total || 0);

    // Get previous period data for growth calculations
    const prevDateFilter = timeRange === 'last30days'
      ? `AND created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'`
      : dateFilter.replace(`>= NOW() - INTERVAL '30 days'`, `>= NOW() - INTERVAL '60 days'`).replace(`< NOW() - INTERVAL '30 days'`, '');

    const prevTotalSalesQuery = `
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM byt_orders
      WHERE status != 'cancelled'
      AND status != 'rejected'
      ${prevDateFilter}
    `;
    const prevTotalSalesResult = await knex.raw(prevTotalSalesQuery);
    const prevTotalSales = parseFloat(prevTotalSalesResult.rows[0]?.total || 0);

    const prevTotalOrdersQuery = `
      SELECT COUNT(*) as total
      FROM byt_orders
      WHERE status != 'cancelled'
      AND status != 'rejected'
      ${prevDateFilter}
    `;
    const prevTotalOrdersResult = await knex.raw(prevTotalOrdersQuery);
    const prevTotalOrders = parseInt(prevTotalOrdersResult.rows[0]?.total || 0);

    // Calculate growth percentages
    const salesGrowth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
    const ordersGrowth = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;

    return {
      totalSales,
      totalOrders,
      productsSold,
      newCustomers,
      salesGrowth,
      ordersGrowth
    };
  } catch (error) {
    console.error('Error in getDashboardSummary:', error);
    throw error;
  }
}

// Get payment methods distribution
export async function getPaymentMethodsDistribution({ timeRange = 'last30days' } = {}) {
  try {
    let dateFilter = '';
    const now = new Date();

    switch (timeRange) {
      case 'today':
        dateFilter = `AND DATE(created_at) = DATE('${now.toISOString().split('T')[0]}')`;
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter = `AND DATE(created_at) = DATE('${yesterday.toISOString().split('T')[0]}')`;
        break;
      case 'last7days':
        dateFilter = `AND created_at >= NOW() - INTERVAL '7 days'`;
        break;
      case 'last30days':
        dateFilter = `AND created_at >= NOW() - INTERVAL '30 days'`;
        break;
      case 'thisMonth':
        dateFilter = `AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      case 'lastMonth':
        dateFilter = `AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month') AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')`;
        break;
      case 'thisYear':
        dateFilter = `AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      default:
        dateFilter = `AND created_at >= NOW() - INTERVAL '30 days'`;
    }

    const query = `
      SELECT
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue,
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM byt_orders WHERE status != 'cancelled' AND status != 'rejected' ${dateFilter})) as percentage
      FROM byt_orders
      WHERE status != 'cancelled'
      AND status != 'rejected'
      AND payment_method IS NOT NULL
      ${dateFilter}
      GROUP BY payment_method
      ORDER BY count DESC
    `;

    const results = await knex.raw(query);
    return results.rows;
  } catch (error) {
    console.error('Error in getPaymentMethodsDistribution:', error);
    throw error;
  }
}

// Get order status distribution
export async function getOrderStatusDistribution({ timeRange = 'last30days' } = {}) {
  try {
    let dateFilter = '';
    const now = new Date();

    switch (timeRange) {
      case 'today':
        dateFilter = `AND DATE(created_at) = DATE('${now.toISOString().split('T')[0]}')`;
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter = `AND DATE(created_at) = DATE('${yesterday.toISOString().split('T')[0]}')`;
        break;
      case 'last7days':
        dateFilter = `AND created_at >= NOW() - INTERVAL '7 days'`;
        break;
      case 'last30days':
        dateFilter = `AND created_at >= NOW() - INTERVAL '30 days'`;
        break;
      case 'thisMonth':
        dateFilter = `AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      case 'lastMonth':
        dateFilter = `AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month') AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')`;
        break;
      case 'thisYear':
        dateFilter = `AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`;
        break;
      default:
        dateFilter = `AND created_at >= NOW() - INTERVAL '30 days'`;
    }

    const query = `
      SELECT
        status,
        COUNT(*) as count,
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM byt_orders WHERE 1=1 ${dateFilter})) as percentage
      FROM byt_orders
      WHERE 1=1
      ${dateFilter}
      GROUP BY status
      ORDER BY count DESC
    `;

    const results = await knex.raw(query);
    return results.rows;
  } catch (error) {
    console.error('Error in getOrderStatusDistribution:', error);
    throw error;
  }
}
