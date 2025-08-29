import * as models from '../models/banner.models.js';
import knex from '../../../config/db.js';

// Get all banners
export async function getAllBannersService() {
  try {
    const banners = await models.getAllBanners();
    return { banners, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Upload banners
export async function uploadBannersService(metadata) {
  try {
    const banners = [];
    
    // Process each file metadata
    const bannerData = {
      name: metadata.fileName,
      file_path: metadata.filePath, // Use the actual uploaded file path
      media_type: metadata.mediaType || 'image',
      link_url: metadata.linkUrl || null,
      link_target: metadata.linkTarget || null
    };
    
    let banner;
    if (metadata.id) {
      // Update existing banner
      // Remove order_index from bannerData when updating
      delete bannerData.order_index;
      await models.updateBanner(metadata.id, bannerData);
      banner = await models.getBannerById(metadata.id);
      banners.push(banner);
      return { 
        banners, 
        message: `Banner updated successfully`,
        status: 200 
      };
    } else {
      // Create new banner
      bannerData.order_index = await models.getNextOrderIndex();
      banner = await models.createBanner(bannerData);
      banners.push(banner);
      return { 
        banners, 
        message: `Banner uploaded successfully`,
        status: 201 
      };
    }
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Update banner order
export async function updateBannerOrderService(order) {
  try {
    // Validate order data
    if (!Array.isArray(order)) {
      return { error: 'Invalid order data', status: 400 };
    }
    
    // Update each banner's order_index (fix to use order_index)
    for (const item of order) {
      await models.updateBannerOrder(item.id, item.order_index);
    }
    
    return { message: 'Banner order updated successfully', status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Get banner by ID
export async function getBannerByIdService(id) {
  try {
    const banner = await models.getBannerById(id);
    if (!banner) {
      return { error: 'Banner not found', status: 404 };
    }
    return { banner, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Delete banner by ID
export async function deleteBannerService(id) {
  try {
    // Check if banner exists
    const existingBanner = await models.getBannerById(id);
    if (!existingBanner) {
      return { error: 'Banner not found', status: 404 };
    }

    await models.deleteBanner(id);
    return { message: 'Banner deleted successfully', status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}