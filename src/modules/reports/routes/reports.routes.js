import express from 'express';
import * as reportsController from '../controllers/reports.controller.js';

const router = express.Router();

// Get top products
router.get('/top-products', reportsController.getTopProducts);

// Get top categories
router.get('/top-categories', reportsController.getTopCategories);

// Get sales by region
router.get('/sales-by-region', reportsController.getSalesByRegion);

// Get dashboard summary
router.get('/dashboard-summary', reportsController.getDashboardSummary);

// Get payment methods distribution
router.get('/payment-methods', reportsController.getPaymentMethodsDistribution);

// Get order status distribution
router.get('/order-statuses', reportsController.getOrderStatusDistribution);

// Get comprehensive reports data
router.get('/comprehensive', reportsController.getComprehensiveReports);

export default router;
