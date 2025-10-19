import * as services from '../services/brand.services.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { uploadToFTP, deleteFromFTP, extractPublicIdFromUrl } from '../../../config/ftp.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for memory storage (for FTP upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all brands with pagination and search
export async function getAllBrands(req, res) {
  try {
    // Get pagination and search parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const result = await services.getAllBrandsService({ page, limit, search });
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ 
      statusCode: result.status, 
      brands: result.brands,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get brand by ID
export async function getBrandById(req, res) {
  try {
    const { id } = req.params;
    const result = await services.getBrandByIdService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, brand: result.brand });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Create a new brand
export async function createBrand(req, res) {
  try {
    const brandData = req.body;
    
    // If image file is uploaded, upload to FTP
    if (req.file) {
      try {
        const ftpResult = await uploadToFTP(req.file.buffer, 'brands');
        brandData.image = ftpResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading to FTP:', uploadError);
        return res.status(500).json({ statusCode: 500, error: 'Failed to upload image' });
      }
    }
    
    const result = await services.createBrandService(brandData);
    if (result.error) {
      // If there's an error and a file was uploaded to FTP, delete it
      if (req.file && brandData.image) {
        try {
          const publicId = extractPublicIdFromUrl(brandData.image);
          await deleteFromFTP(publicId);
        } catch (deleteError) {
          console.error('Error deleting from FTP:', deleteError);
        }
      }
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, brand: result.brand });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Update brand by ID
export async function updateBrand(req, res) {
  try {
    const { id } = req.params;
    const brandData = req.body;
    
    // Get the existing brand to check if there's an old image to remove
    const existingBrand = await services.getBrandByIdService(id);
    
    // If image file is uploaded, upload to FTP
    if (req.file) {
      try {
        const ftpResult = await uploadToFTP(req.file.buffer, 'brands');
        brandData.image = ftpResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading to FTP:', uploadError);
        return res.status(500).json({ statusCode: 500, error: 'Failed to upload image' });
      }
    }
    
    const result = await services.updateBrandService(id, brandData);
    if (result.error) {
      // If there's an error and a new file was uploaded to FTP, delete it
      if (req.file && brandData.image) {
        try {
          const publicId = extractPublicIdFromUrl(brandData.image);
          await deleteFromFTP(publicId);
        } catch (deleteError) {
          console.error('Error deleting from FTP:', deleteError);
        }
      }
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    // If the update was successful and a new image was uploaded, remove the old image
    if (req.file && existingBrand.brand && existingBrand.brand.image) {
      try {
        const oldPublicId = extractPublicIdFromUrl(existingBrand.brand.image);
        await deleteFromFTP(oldPublicId);
      } catch (deleteError) {
        console.error('Error deleting old image from FTP:', deleteError);
      }
    }
    
    res.status(result.status).json({ statusCode: result.status, brand: result.brand });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Delete brand by ID
export async function deleteBrand(req, res) {
  try {
    const { id } = req.params;
    
    // Get the existing brand to check if there's an image to remove
    const existingBrand = await services.getBrandByIdService(id);
    
    const result = await services.deleteBrandService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    // If the deletion was successful and there was an image, remove the image file from FTP
    if (existingBrand.brand && existingBrand.brand.image) {
      try {
        const publicId = extractPublicIdFromUrl(existingBrand.brand.image);
        await deleteFromFTP(publicId);
      } catch (deleteError) {
        console.error('Error deleting image from FTP:', deleteError);
      }
    }
    
    res.status(result.status).json({ statusCode: result.status, message: result.message });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get brands for dropdown (no pagination, just id and name)
export async function getBrandsForDropdown(req, res) {
  try {
    const result = await services.getBrandsForDropdownService();
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, brands: result.brands });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Import brands from Excel file
export async function importBrandsFromExcel(req, res) {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ statusCode: 400, error: 'No file uploaded' });
    }

    // Check if file is Excel
    if (!req.file.originalname.match(/\.(xlsx|xls)$/)) {
      return res.status(400).json({ statusCode: 400, error: 'Please upload an Excel file' });
    }

    const result = await services.importBrandsFromExcelService(req.file.buffer);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    const response = {
      statusCode: result.status,
      message: result.message,
      brands: result.brands
    };
    
    if (result.errors) {
      response.errors = result.errors;
    }
    
    res.status(result.status).json(response);
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Export multer upload middleware
