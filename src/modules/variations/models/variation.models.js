import knex from '../../../config/db.js';

// Get all variations
export async function getAllVariations() {
  return knex('byt_variations')
    .where({ is_active: true })
    .orderBy('label');
}

// Get variation by ID
export async function getVariationById(id) {
  return knex('byt_variations')
    .where({ id, is_active: true })
    .first();
}

// Create a new variation
export async function createVariation(variationData) {
  // Insert the variation and get the ID
  const [result] = await knex('byt_variations').insert(variationData).returning('id');
  
  // Handle different return formats from different database drivers
  let variationId;
  if (typeof result === 'object' && result !== null) {
    // If result is an object, extract the ID
    variationId = result.id || result[0];
  } else {
    // If result is a scalar value
    variationId = result;
  }
  
  // Return the full variation object
  const variation = await getVariationById(variationId);
  return variation;
}

// Update variation by ID
export async function updateVariation(id, variationData) {
  // Update the variation
  await knex('byt_variations')
    .where({ id })
    .update({ ...variationData, updated_at: knex.fn.now() });
  
  // Return the updated variation
  return getVariationById(id);
}

// Delete variation by ID (soft delete)
export async function deleteVariation(id) {
  return knex('byt_variations')
    .where({ id })
    .update({ is_active: false, updated_at: knex.fn.now() });
}

// Get total count of variations with search filter
export async function getVariationsCount({ search = '' } = {}) {
  let query = knex('byt_variations').where({ is_active: true }).count('* as count');
  
  // Add search functionality
  if (search) {
    query = query.where('label', 'ilike', `%${search}%`);
  }
  
  const result = await query.first();
  return parseInt(result.count);
}

// Get all variations with pagination and search
export async function getAllVariationsPaginated({ page = 1, limit = 10, search = '' } = {}) {
  let query = knex('byt_variations').where({ is_active: true });
  
  // Add search functionality
  if (search) {
    query = query.where('label', 'ilike', `%${search}%`);
  }
  
  // Add ordering
  query = query.orderBy('label');
  
  // Add pagination
  const offset = (page - 1) * limit;
  query = query.limit(limit).offset(offset);
  
  return query;
}