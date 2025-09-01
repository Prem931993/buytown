import express from 'express';
import * as controller from '../controllers/dashboard.controller.js';

const router = express.Router();

// Get dashboard summary
router.get('/summary', controller.getDashboardSummary);

// Get orders awaiting confirmation count
router.get('/orders-awaiting-confirmation', controller.getOrdersAwaitingConfirmationCount);

// Get low stock products
router.get('/low-stock-products', controller.getLowStockProducts);

// Get recent sales
router.get('/recent-sales', controller.getRecentSales);

// Get popular products
router.get('/popular-products', controller.getPopularProducts);

// Get most used delivery vehicles
router.get('/delivery-vehicles', controller.getMostUsedDeliveryVehicles);

// Get total products count
router.get('/total-products', controller.getTotalProductsCount);

// Get total orders count
router.get('/total-orders', controller.getTotalOrdersCount);

// Get total users count
router.get('/total-users', controller.getTotalUsersCount);

// Get total revenue
router.get('/total-revenue', controller.getTotalRevenue);

// Get monthly revenue
router.get('/monthly-revenue', controller.getMonthlyRevenue);

// Get order statistics
router.get('/order-statistics', controller.getOrderStatistics);

export default router;
