import knex from '../../../config/db.js';

// Get all banners ordered by order_index
export async function getAllBanners() {
  return knex('byt_banners')
    .where({ is_active: true })
    .orderBy('order_index');
}

// Get banner by ID
export async function getBannerById(id) {
  return knex('byt_banners')
    .where({ id, is_active: true })
    .first();
}

// Create a new banner
export async function createBanner(bannerData) {
  // Insert the banner and get the ID
  const [result] = await knex('byt_banners').insert(bannerData).returning('id');
  
  // Handle different return formats from different database drivers
  let bannerId;
  if (typeof result === 'object' && result !== null) {
    // If result is an object, extract the ID
    bannerId = result.id || result[0];
  } else {
    // If result is a scalar value
    bannerId = result;
  }
  
  // Return the full banner object
  const banner = await getBannerById(bannerId);
  return banner;
}

// Update banner order by ID
export async function updateBannerOrder(id, orderIndex) {
  return knex('byt_banners')
    .where({ id })
    .update({ order_index: orderIndex, updated_at: knex.fn.now() });
}

export async function updateBanner(id, bannerData) {
  return knex('byt_banners')
    .where({ id })
    .update(bannerData);
}

// Delete banner by ID (soft delete)
export async function deleteBanner(id) {
  return knex('byt_banners')
    .where({ id })
    .update({ is_active: false, updated_at: knex.fn.now() });
}

// Get the next order index for a new banner
export async function getNextOrderIndex() {
  const result = await knex('byt_banners')
    .where({ is_active: true })
    .max('order_index as maxOrder')
    .first();
    
  return result.maxOrder ? result.maxOrder + 1 : 0;
}