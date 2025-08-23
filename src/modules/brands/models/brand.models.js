import knex from '../../../config/db.js';

// Get all brands
export async function getAllBrands() {
  return knex('byt_brands')
    .where({ is_active: true })
    .orderBy('name');
}

// Get brand by ID
export async function getBrandById(id) {
  return knex('byt_brands')
    .where({ id, is_active: true })
    .first();
}

// Get brand by name
export async function getBrandByName(name) {
  return knex('byt_brands')
    .where({ name, is_active: true })
    .first();
}

// Create a new brand
export async function createBrand(brandData) {
  // Insert the brand and get the ID
  const [result] = await knex('byt_brands').insert(brandData).returning('id');
  
  // Handle different return formats from different database drivers
  let brandId;
  if (typeof result === 'object' && result !== null) {
    // If result is an object, extract the ID
    brandId = result.id || result[0];
  } else {
    // If result is a scalar value
    brandId = result;
  }
  
  // Return the full brand object
  const brand = await getBrandById(brandId);
  return brand;
}

// Update brand by ID
export async function updateBrand(id, brandData) {
  // Update the brand
  await knex('byt_brands')
    .where({ id })
    .update({ ...brandData, updated_at: knex.fn.now() });
  
  // Return the updated brand
  return getBrandById(id);
}

// Delete brand by ID (soft delete)
export async function deleteBrand(id) {
  return knex('byt_brands')
    .where({ id })
    .update({ is_active: false, updated_at: knex.fn.now() });
}

// Get total count of brands with search filter
export async function getBrandsCount({ search = '' } = {}) {
  let query = knex('byt_brands').where({ is_active: true }).count('* as count');
  
  // Add search functionality
  if (search) {
    query = query.where('name', 'ilike', `%${search}%`);
  }
  
  const result = await query.first();
  return parseInt(result.count);
}

// Get all brands with pagination and search
export async function getAllBrandsPaginated({ page = 1, limit = 10, search = '' } = {}) {
  let query = knex('byt_brands').where({ is_active: true });
  
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