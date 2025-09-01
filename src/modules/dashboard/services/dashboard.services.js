import * as models from '../models/dashboard.models.js';

export async function getDashboardSummary() {
  try {
    const result = await models.getDashboardSummary();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getOrdersAwaitingConfirmationCount() {
  try {
    const result = await models.getOrdersAwaitingConfirmationCount();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getLowStockProducts(limit = 10) {
  try {
    const result = await models.getLowStockProducts(limit);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getRecentSales(days = 30) {
  try {
    const result = await models.getRecentSales(days);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPopularProducts(limit = 10) {
  try {
    const result = await models.getPopularProducts(limit);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getMostUsedDeliveryVehicles() {
  try {
    const result = await models.getMostUsedDeliveryVehicles();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getTotalProductsCount() {
  try {
    const result = await models.getTotalProductsCount();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getTotalOrdersCount() {
  try {
    const result = await models.getTotalOrdersCount();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getTotalUsersCount() {
  try {
    const result = await models.getTotalUsersCount();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getTotalRevenue() {
  try {
    const result = await models.getTotalRevenue();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getMonthlyRevenue() {
  try {
    const result = await models.getMonthlyRevenue();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getOrderStatistics() {
  try {
    const result = await models.getOrderStatistics();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}
