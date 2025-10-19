import * as services from '../services/userCart.services.js';

// Controller for scheduled cart cleanup
export async function scheduledCartCleanup() {
  try {
    console.log('Starting scheduled cart cleanup...');

    const result = await services.deleteExpiredCartItemsService();

    if (result.error) {
      console.error('Scheduled cart cleanup failed:', result.error);
      return;
    }

    console.log(`Scheduled cart cleanup completed: ${result.message}`);
  } catch (error) {
    console.error('Error in scheduled cart cleanup:', error);
  }
}
