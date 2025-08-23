import * as productModels from './src/modules/products/models/product.models.js';
import knex from './src/config/db.js';

async function testDeleteModel() {
  try {
    console.log('Testing delete model function...');
    
    // Try to delete a product using the model function
    const result = await productModels.deleteProduct(4);
    console.log('Delete result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

testDeleteModel();