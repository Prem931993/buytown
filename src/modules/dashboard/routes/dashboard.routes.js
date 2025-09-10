import express from 'express';
import * as controller from '../controllers/dashboard.controller.js';
import verifyDualAuth from '../../auth/middleware/dualAuthMiddleware.js';

const router = express.Router();

// Get dashboard summary
router.get('/summary', verifyDualAuth, controller.getDashboardSummary);

// Get orders awaiting confirmation count
router.get('/orders-awaiting-confirmation', verifyDualAuth, controller.getOrdersAwaitingConfirmationCount);

// Get orders awaiting confirmation list
router.get('/orders-awaiting-confirmation/list', verifyDualAuth, controller.getOrdersAwaitingConfirmationList);

// Get low stock products
router.get('/low-stock-products', verifyDualAuth, controller.getLowStockProducts);

// Get recent sales
router.get('/recent-sales', verifyDualAuth, controller.getRecentSales);

// Get popular products
router.get('/popular-products', verifyDualAuth, controller.getPopularProducts);

// Get most used delivery vehicles
router.get('/delivery-vehicles', verifyDualAuth, controller.getMostUsedDeliveryVehicles);

// Get top customers
router.get('/top-customers', verifyDualAuth, controller.getTopCustomers);

// Get all customers with orders (for debugging)
router.get('/all-customers-with-orders', verifyDualAuth, controller.getAllCustomersWithOrders);

// Get total products count
router.get('/total-products', verifyDualAuth, controller.getTotalProductsCount);

// Get total orders count
router.get('/total-orders', verifyDualAuth, controller.getTotalOrdersCount);

// Get total users count
router.get('/total-users', verifyDualAuth, controller.getTotalUsersCount);

// Get total revenue
router.get('/total-revenue', verifyDualAuth, controller.getTotalRevenue);

// Get monthly revenue
router.get('/monthly-revenue', verifyDualAuth, controller.getMonthlyRevenue);

// Get order statistics
router.get('/order-statistics', verifyDualAuth, controller.getOrderStatistics);

export default router;
