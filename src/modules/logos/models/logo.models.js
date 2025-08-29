import knex from '../../../config/db.js';

// Get all logos
export async function getAllLogos() {
  return knex('byt_logos')
    .where({ is_active: true })
    .orderBy('id');
}

// Get logo by ID
export async function getLogoById(id) {
  return knex('byt_logos')
    .where({ id, is_active: true })
    .first();
}

// Create a new logo
export async function createLogo(logoData) {
  // Insert the logo and get the ID
  const [result] = await knex('byt_logos').insert(logoData).returning('id');
  
  // Handle different return formats from different database drivers
  let logoId;
  if (typeof result === 'object' && result !== null) {
    // If result is an object, extract the ID
    logoId = result.id || result[0];
  } else {
    // If result is a scalar value
    logoId = result;
  }
  
  // Return the full logo object
  const logo = await getLogoById(logoId);
  return logo;
}

// Delete logo by ID (soft delete)
export async function deleteLogo(id) {
  return knex('byt_logos')
    .where({ id })
    .update({ is_active: false, updated_at: knex.fn.now() });
}