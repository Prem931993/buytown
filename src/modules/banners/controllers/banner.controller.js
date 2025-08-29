import * as services from '../services/banner.services.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

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

    // Validate media_type, link_url, link_target in req.body
    const { mediaType, linkUrl, linkTarget } = req.body;
    if (mediaType && !['image', 'video', 'youtube'].includes(mediaType)) {
      return res.status(400).json({ statusCode: 400, error: 'Invalid media type' });
    }
    if (linkTarget && !['_blank', '_self'].includes(linkTarget)) {
      return res.status(400).json({ statusCode: 400, error: 'Invalid link target' });
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
    
    // Get the existing banner to check if there's an image to remove
    const existingBanner = await services.getBannerByIdService(id);
    
    const result = await services.deleteBannerService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    // If the deletion was successful and there was an image, remove the image file
    if (existingBanner.banner && existingBanner.banner.file_path) {
      const frontendPublicPath = path.join(__dirname, '../../../../../frontend/public');
      const imagePath = path.join(frontendPublicPath, existingBanner.banner.file_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.status(result.status).json({ statusCode: result.status, message: result.message });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Export multer upload middleware
export { upload };