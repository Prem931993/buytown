import * as productServices from './src/modules/products/services/product.services.js';
import knex from './src/config/db.js';

async function testDeleteService() {
  try {
    console.log('Testing delete service function...');
    
    // First create a product to delete
    const createResult = await productServices.createProductService({
      name: 'Test Product for Deletion',
      description: 'This is a test product for deletion',
      price: 29.99,
      category_id: 45,
      brand_id: 1,
      sku_code: 'TESTDEL001',
      stock: 15,
      status: 'active'
    });
    
    console.log('Create result:', createResult);
    
    if (createResult.product) {
      // Try to delete the product using the service function
      const deleteResult = await productServices.deleteProductService(createResult.product.id);
      console.log('Delete result:', deleteResult);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

testDeleteService();