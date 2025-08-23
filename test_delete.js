import knex from './src/config/db.js';

async function testDelete() {
  try {
    console.log('Testing delete function...');
    
    // Try to update a product status to 'discontinued'
    const result = await knex('byt_products')
      .where({ id: 3 })
      .update({ status: 'discontinued', updated_at: knex.fn.now() });
    
    console.log('Update result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

testDelete();