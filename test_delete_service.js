import * as productServices from './src/modules/products/services/product.services.js';
import knex from './src/config/db.js';

async function testDeleteService() {
  try {
    console.log('Testing delete service function...');
    
    // Try to delete a product using the service function
    const result = await productServices.deleteProductService(5);
    console.log('Delete result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

testDeleteService();