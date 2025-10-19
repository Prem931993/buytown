import * as services from '../services/banner.services.js';
import { deleteFromFTP, extractPublicIdFromUrl, isFTPUrl } from '../../../config/ftp.js';

// Get all banners
export async function getAllBanners(req, res) {
  try {
    const result = await services.getAllBannersService();
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ 
      statusCode: result.status, 
      banners: result.banners
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Upload banners
export async function uploadBanners(req, res) {
  try {
    // Check if metadata is provided
    if (!req.body || !req.body.fileName) {
      return res.status(400).json({ statusCode: 400, error: 'No file metadata provided' });
    }

    // Validate media_type, link_type, link_id in req.body
    const { mediaType, linkType, linkId } = req.body;
    if (mediaType && !['image', 'video', 'youtube'].includes(mediaType)) {
      return res.status(400).json({ statusCode: 400, error: 'Invalid media type' });
    }
    if (linkType && !['external', 'product', 'category', 'brand', 'page'].includes(linkType)) {
      return res.status(400).json({ statusCode: 400, error: 'Invalid link type' });
    }
    if (linkType && linkId && !Number.isInteger(Number(linkId))) {
      return res.status(400).json({ statusCode: 400, error: 'Invalid link ID' });
    }

    const result = await services.uploadBannersService(req.body);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    res.status(result.status).json({ 
      statusCode: result.status, 
      message: result.message,
      banners: result.banners
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Update banner order
export async function updateBannerOrder(req, res) {
  try {
    const { order } = req.body;
    
    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ statusCode: 400, error: 'Invalid order data' });
    }
    
    const result = await services.updateBannerOrderService(order);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    res.status(result.status).json({ 
      statusCode: result.status, 
      message: result.message
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Delete banner by ID
export async function deleteBanner(req, res) {
  try {
    const { id } = req.params;

    // Get the existing banner to check if there's an image to remove from FTP
    const existingBanner = await services.getBannerByIdService(id);

    const result = await services.deleteBannerService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    // If the deletion was successful and there was an image, remove the image from FTP
    if (existingBanner.banner && existingBanner.banner.file_path) {
      // Check if it's an FTP URL
      if (isFTPUrl(existingBanner.banner.file_path)) {
        const publicId = extractPublicIdFromUrl(existingBanner.banner.file_path);
        if (publicId) {
          try {
            await deleteFromFTP(publicId, existingBanner.banner.media_type === 'video' ? 'video' : 'image');
          } catch (ftpError) {
            console.error('Failed to delete from FTP:', ftpError);
            // Continue with the response even if FTP deletion fails
          }
        }
      }
    }

    res.status(result.status).json({ statusCode: result.status, message: result.message });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get categories for dropdown
export async function getCategoriesForDropdown(req, res) {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || null;

    const result = await services.getCategoriesForDropdownService({ search, limit });
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({
      statusCode: result.status,
      categories: result.categories
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get products for dropdown
export async function getProductsForDropdown(req, res) {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 50;

    const result = await services.getProductsForDropdownService({ search, limit });
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({
      statusCode: result.status,
      products: result.products
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}
