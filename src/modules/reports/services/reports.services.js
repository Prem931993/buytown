import * as reportsModels from '../models/reports.models.js';

// Get top products service
export async function getTopProductsService({ limit = 10, timeRange = 'last30days' } = {}) {
  try {
    const products = await reportsModels.getTopProducts({ limit, timeRange });

    return {
      status: 200,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        sku_code: product.sku_code,
        sales: parseInt(product.sales || 0),
        revenue: parseFloat(product.revenue || 0),
        growth: parseFloat(product.growth || 0)
      }))
    };
  } catch (error) {
    console.error('Error in getTopProductsService:', error);
    return {
      status: 500,
      error: 'Failed to fetch top products'
    };
  }
}

// Get top categories service
export async function getTopCategoriesService({ limit = 10, timeRange = 'last30days' } = {}) {
  try {
    const categories = await reportsModels.getTopCategories({ limit, timeRange });

    return {
      status: 200,
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        sales: parseInt(category.sales || 0),
        revenue: parseFloat(category.revenue || 0),
        growth: parseFloat(category.growth || 0)
      }))
    };
  } catch (error) {
    console.error('Error in getTopCategoriesService:', error);
    return {
      status: 500,
      error: 'Failed to fetch top categories'
    };
  }
}

// Get sales by region service
export async function getSalesByRegionService({ limit = 10, timeRange = 'last30days' } = {}) {
  try {
    const regions = await reportsModels.getSalesByRegion({ limit, timeRange });

    return {
      status: 200,
      regions: regions.map(region => ({
        region: region.region,
        sales: parseInt(region.sales || 0),
        revenue: parseFloat(region.revenue || 0),
        growth: parseFloat(region.growth || 0)
      }))
    };
  } catch (error) {
    console.error('Error in getSalesByRegionService:', error);
    return {
      status: 500,
      error: 'Failed to fetch sales by region'
    };
  }
}

// Get dashboard summary service
export async function getDashboardSummaryService({ timeRange = 'last30days' } = {}) {
  try {
    const summary = await reportsModels.getDashboardSummary({ timeRange });

    return {
      status: 200,
      summary: {
        totalSales: summary.totalSales,
        totalOrders: summary.totalOrders,
        productsSold: summary.productsSold,
        newCustomers: summary.newCustomers,
        salesGrowth: summary.salesGrowth,
        ordersGrowth: summary.ordersGrowth
      }
    };
  } catch (error) {
    console.error('Error in getDashboardSummaryService:', error);
    return {
      status: 500,
      error: 'Failed to fetch dashboard summary'
    };
  }
}

// Get payment methods distribution service
export async function getPaymentMethodsDistributionService({ timeRange = 'last30days' } = {}) {
  try {
    const paymentMethods = await reportsModels.getPaymentMethodsDistribution({ timeRange });

    return {
      status: 200,
      paymentMethods: paymentMethods.map(method => ({
        method: method.payment_method,
        count: parseInt(method.count || 0),
        revenue: parseFloat(method.revenue || 0),
        percentage: parseFloat(method.percentage || 0)
      }))
    };
  } catch (error) {
    console.error('Error in getPaymentMethodsDistributionService:', error);
    return {
      status: 500,
      error: 'Failed to fetch payment methods distribution'
    };
  }
}

// Get order status distribution service
export async function getOrderStatusDistributionService({ timeRange = 'last30days' } = {}) {
  try {
    const orderStatuses = await reportsModels.getOrderStatusDistribution({ timeRange });

    return {
      status: 200,
      orderStatuses: orderStatuses.map(status => ({
        status: status.status,
        count: parseInt(status.count || 0),
        percentage: parseFloat(status.percentage || 0)
      }))
    };
  } catch (error) {
    console.error('Error in getOrderStatusDistributionService:', error);
    return {
      status: 500,
      error: 'Failed to fetch order status distribution'
    };
  }
}

// Get comprehensive reports data service
export async function getComprehensiveReportsService({ timeRange = 'last30days', limit = 10 } = {}) {
  try {
    const [topProducts, topCategories, salesByRegion, summary, paymentMethods, orderStatuses] = await Promise.all([
      reportsModels.getTopProducts({ limit, timeRange }),
      reportsModels.getTopCategories({ limit, timeRange }),
      reportsModels.getSalesByRegion({ limit, timeRange }),
      reportsModels.getDashboardSummary({ timeRange }),
      reportsModels.getPaymentMethodsDistribution({ timeRange }),
      reportsModels.getOrderStatusDistribution({ timeRange })
    ]);

    return {
      status: 200,
      reports: {
        topProducts: topProducts.map(product => ({
          id: product.id,
          name: product.name,
          sku_code: product.sku_code,
          sales: parseInt(product.sales || 0),
          revenue: parseFloat(product.revenue || 0),
          growth: parseFloat(product.growth || 0)
        })),
        topCategories: topCategories.map(category => ({
          id: category.id,
          name: category.name,
          sales: parseInt(category.sales || 0),
          revenue: parseFloat(category.revenue || 0),
          growth: parseFloat(category.growth || 0)
        })),
        salesByRegion: salesByRegion.map(region => ({
          region: region.region,
          sales: parseInt(region.sales || 0),
          revenue: parseFloat(region.revenue || 0),
          growth: parseFloat(region.growth || 0)
        })),
        summary: {
          totalSales: summary.totalSales,
          totalOrders: summary.totalOrders,
          productsSold: summary.productsSold,
          newCustomers: summary.newCustomers,
          salesGrowth: summary.salesGrowth,
          ordersGrowth: summary.ordersGrowth
        },
        paymentMethods: paymentMethods.map(method => ({
          method: method.payment_method,
          count: parseInt(method.count || 0),
          revenue: parseFloat(method.revenue || 0),
          percentage: parseFloat(method.percentage || 0)
        })),
        orderStatuses: orderStatuses.map(status => ({
          status: status.status,
          count: parseInt(status.count || 0),
          percentage: parseFloat(status.percentage || 0)
        }))
      }
    };
  } catch (error) {
    console.error('Error in getComprehensiveReportsService:', error);
    return {
      status: 500,
      error: 'Failed to fetch comprehensive reports data'
    };
  }
}
