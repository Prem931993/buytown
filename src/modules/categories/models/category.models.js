import knex from '../../../config/db.js';

// Get all categories with pagination and search
export async function getAllCategories({ page = 1, limit = 10, search = '' } = {}) {
  let query = knex('byt_categories').where({ is_active: true });
  
  // Add search functionality
  if (search) {
    query = query.where('name', 'ilike', `%${search}%`);
  }
  
  // Add ordering
  query = query.orderBy('name');
  
  // Add pagination
  const offset = (page - 1) * limit;
  query = query.limit(limit).offset(offset);
  
  return query;
}

// Get total count of categories with search filter
export async function getCategoriesCount({ search = '' } = {}) {
  let query = knex('byt_categories').where({ is_active: true }).count('* as count');
  
  // Add search functionality
  if (search) {
    query = query.where('name', 'ilike', `%${search}%`);
  }
  
  const result = await query.first();
  return parseInt(result.count);
}

// Get category by ID
export async function getCategoryById(id) {
  return knex('byt_categories')
    .where({ id, is_active: true })
    .first();
}

// Create a new category
export async function createCategory(categoryData) {  
  // Insert the category and get the ID
  const [result] = await knex('byt_categories').insert(categoryData).returning('id');
  
  // Handle different return formats from different database drivers
  let categoryId;
  if (typeof result === 'object' && result !== null) {
    // If result is an object, extract the ID
    categoryId = result.id || result[0];
  } else {
    // If result is a scalar value
    categoryId = result;
  }
  
  
  // Return the full category object
  const category = await getCategoryById(categoryId);
  return category;
}

// Update category by ID
export async function updateCategory(id, categoryData) {
  // Update the category
  await knex('byt_categories')
    .where({ id })
    .update({ ...categoryData, updated_at: knex.fn.now() });
  
  // Return the updated category
  return getCategoryById(id);
}

// Delete category by ID (soft delete)
export async function deleteCategory(id) {
  return knex('byt_categories')
    .where({ id })
    .update({ is_active: false, updated_at: knex.fn.now() });
}

// Get child categories by parent ID
export async function getChildCategories(parentId) {
  return knex('byt_categories')
    .where({ parent_id: parentId, is_active: true })
    .orderBy('name');
}

// Get root categories (categories with no parent)
export async function getRootCategories() {
  return knex('byt_categories')
    .where({ parent_id: null, is_active: true })
    .orderBy('name');
}