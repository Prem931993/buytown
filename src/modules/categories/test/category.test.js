// Test script for categories API
// This script demonstrates how to use the categories API endpoints

import knex from '../../../config/db.js';

async function testCategoriesAPI() {
  try {
    console.log('Testing Categories API');
    
    // Test creating a category
    console.log('\n1. Creating a new category...');
    const newCategory = {
      name: 'Electronics',
      description: 'Electronic devices and accessories'
    };
    
    // In a real test, you would make HTTP requests to your API endpoints
    // For now, we'll test the database operations directly
    
    console.log('Creating category in database...');
    const [categoryId] = await knex('byt_categories').insert(newCategory).returning('id');
    console.log('Created category with ID:', categoryId);
    
    // Test retrieving the category
    console.log('\n2. Retrieving category...');
    const category = await knex('byt_categories').where({ id: categoryId }).first();
    console.log('Retrieved category:', category);
    
    // Test updating the category
    console.log('\n3. Updating category...');
    await knex('byt_categories').where({ id: categoryId }).update({
      name: 'Electronics & Gadgets',
      description: 'Electronic devices, gadgets and accessories',
      updated_at: knex.fn.now()
    });
    
    const updatedCategory = await knex('byt_categories').where({ id: categoryId }).first();
    console.log('Updated category:', updatedCategory);
    
    // Test creating a child category
    console.log('\n4. Creating child category...');
    const childCategory = {
      name: 'Smartphones',
      description: 'Mobile phones and smartphones',
      parent_id: categoryId
    };
    
    const [childCategoryId] = await knex('byt_categories').insert(childCategory).returning('id');
    console.log('Created child category with ID:', childCategoryId);
    
    // Test retrieving child categories
    console.log('\n5. Retrieving child categories...');
    const childCategories = await knex('byt_categories').where({ parent_id: categoryId });
    console.log('Child categories:', childCategories);
    
    // Test retrieving root categories
    console.log('\n6. Retrieving root categories...');
    const rootCategories = await knex('byt_categories').where({ parent_id: null });
    console.log('Root categories count:', rootCategories.length);
    
    // Test soft deleting a category
    console.log('\n7. Deleting category...');
    await knex('byt_categories').where({ id: childCategoryId }).update({
      is_active: false,
      updated_at: knex.fn.now()
    });
    
    const deletedCategory = await knex('byt_categories').where({ id: childCategoryId }).first();
    console.log('Deleted category (soft delete):', deletedCategory);
    
    console.log('\nAll tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file:${process.argv[1]}`) {
  testCategoriesAPI();
}

export default testCategoriesAPI;