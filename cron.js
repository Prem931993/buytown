import cron from 'node-cron';
import { scheduledCartCleanup } from './src/modules/cart/controllers/cartCleanup.controller.js';
import { processPendingNotifications, checkAndNotifyLowStockProducts } from './src/modules/notifications/services/notification.services.js';

// Initialize all cron jobs
export function initializeCronJobs() {
  console.log('Initializing cron jobs...');

  // Schedule cart cleanup to run every minute
  cron.schedule('0 * * * *', () => {
    console.log('Running scheduled cart cleanup...');
    scheduledCartCleanup();
  });

  // Schedule pending notifications processing to run every minute
  cron.schedule('0 * * * *', () => {
    console.log('Running scheduled pending notifications processing...');
    processPendingNotifications()
      .then(result => {
        console.log(`Processed ${result.processedPendingNotifications} pending notifications, created ${result.createdNotifications} notifications`);
      })
      .catch(error => {
        console.error('Error processing pending notifications:', error);
      });
  });

  // Schedule low stock notifications to run every minute
  cron.schedule('0 * * * *', () => {
    console.log('Running scheduled low stock notifications check...');
    checkAndNotifyLowStockProducts()
      .then(result => {
        if (result.notifiedProducts > 0) {
          console.log(`Created low stock notifications for ${result.notifiedProducts} products`);
        }
      })
      .catch(error => {
        console.error('Error checking low stock products:', error);
      });
  });

  console.log('Scheduled cart cleanup, pending notifications processing, and low stock notifications jobs initialized (all run every minute)');
}

// Export individual cron jobs for testing or manual execution
export const cronJobs = {
  cartCleanup: scheduledCartCleanup,
  processPendingNotifications: processPendingNotifications,
  checkAndNotifyLowStockProducts: checkAndNotifyLowStockProducts
};
