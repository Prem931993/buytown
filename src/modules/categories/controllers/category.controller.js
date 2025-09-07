import * as services from '../services/category.services.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from '../../../config/cloudinary.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for memory storage (for Cloudinary upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all categories with pagination and search
export async function getAllCategories(req, res) {
  try {
    // Get pagination and search parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const result = await services.getAllCategoriesService({ page, limit, search });
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({
      statusCode: result.status,
      categories: result.categories,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get category by ID
export async function getCategoryById(req, res) {
  try {
    const { id } = req.params;
    const result = await services.getCategoryByIdService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, category: result.category });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Create a new category
export async function createCategory(req, res) {
  try {
    const categoryData = req.body;

    // Convert status smallint to is_active boolean
    if (categoryData.status !== undefined) {
      categoryData.is_active = categoryData.status === '1' || categoryData.status === 1;
      delete categoryData.status;
    }

    // If image file is uploaded, upload to Cloudinary
    if (req.file) {
      try {
        let fileData;
        if (req.file.buffer) {
          // Memory storage - use buffer
          fileData = req.file.buffer;
        } else if (req.file.path) {
          // Disk storage - use file path
          fileData = req.file.path;
        } else {
          throw new Error('No file data available');
        }

        const cloudinaryResult = await uploadToCloudinary(fileData, 'categories');
        categoryData.image = cloudinaryResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ statusCode: 500, error: 'Failed to upload image' });
      }
    }

    const result = await services.createCategoryService(categoryData);
    if (result.error) {
      // If there's an error and a file was uploaded to Cloudinary, delete it
      if (req.file && categoryData.image) {
        try {
          const publicId = extractPublicIdFromUrl(categoryData.image);
          await deleteFromCloudinary(publicId);
        } catch (deleteError) {
          console.error('Error deleting from Cloudinary:', deleteError);
        }
      }
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, category: result.category });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Update category by ID
export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const categoryData = req.body;

    // Convert status smallint to is_active boolean
    if (categoryData.status !== undefined) {
      categoryData.is_active = categoryData.status === '1' || categoryData.status === 1;
      delete categoryData.status;
    }

    // Get the existing category to check if there's an old image to remove
    const existingCategory = await services.getCategoryByIdService(id);

    // If image file is uploaded, upload to Cloudinary
    if (req.file) {
      try {
        let fileData;
        if (req.file.buffer) {
          // Memory storage - use buffer
          fileData = req.file.buffer;
        } else if (req.file.path) {
          // Disk storage - use file path
          fileData = req.file.path;
        } else {
          throw new Error('No file data available');
        }

        const cloudinaryResult = await uploadToCloudinary(fileData, 'categories');
        categoryData.image = cloudinaryResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ statusCode: 500, error: 'Failed to upload image' });
      }
    }

    const result = await services.updateCategoryService(id, categoryData);
    if (result.error) {
      // If there's an error and a new file was uploaded to Cloudinary, delete it
      if (req.file && categoryData.image) {
        try {
          const publicId = extractPublicIdFromUrl(categoryData.image);
          await deleteFromCloudinary(publicId);
        } catch (deleteError) {
          console.error('Error deleting from Cloudinary:', deleteError);
        }
      }
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    // If the update was successful and a new image was uploaded, remove the old image from Cloudinary
    if (req.file && existingCategory.category && existingCategory.category.image) {
      try {
        const publicId = extractPublicIdFromUrl(existingCategory.category.image);
        await deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.error('Error deleting old image from Cloudinary:', deleteError);
      }
    }

    res.status(result.status).json({ statusCode: result.status, category: result.category });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Delete category by ID
export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    // Get the existing category to check if there's an image to remove
    const existingCategory = await services.getCategoryByIdService(id);

    const result = await services.deleteCategoryService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    // If the deletion was successful and there was an image, remove the image from Cloudinary
    if (existingCategory.category && existingCategory.category.image) {
      try {
        const publicId = extractPublicIdFromUrl(existingCategory.category.image);
        await deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.error('Error deleting image from Cloudinary:', deleteError);
      }
    }

    res.status(result.status).json({ statusCode: result.status, message: result.message });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Import categories from Excel file
export async function importCategoriesFromExcel(req, res) {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ statusCode: 400, error: 'No file uploaded' });
    }

    // Check if file is Excel
    if (!req.file.originalname.match(/\.(xlsx|xls)$/)) {
      return res.status(400).json({ statusCode: 400, error: 'Please upload an Excel file' });
    }

    const result = await services.importCategoriesFromExcelService(req.file.buffer);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    const response = {
      statusCode: result.status,
      message: result.message,
      categories: result.categories
    };
    
    if (result.errors) {
      response.errors = result.errors;
    }
    
    res.status(result.status).json(response);
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get child categories by parent ID
export async function getChildCategories(req, res) {
  try {
    const { parentId } = req.params;
    const result = await services.getChildCategoriesService(parentId);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, categories: result.categories });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get categories for dropdown (no pagination, just id and name)
export async function getCategoriesForDropdown(req, res) {
  try {
    const result = await services.getCategoriesForDropdownService();
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, categories: result.categories });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get root categories (categories with no parent)
export async function getRootCategories(req, res) {
  try {
    const result = await services.getRootCategoriesService();
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, categories: result.categories });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get all enabled categories with images for users
export async function getAllEnabledCategoriesWithImages(req, res) {
  try {
    const result = await services.getAllEnabledCategoriesWithImagesService();
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

// Export multer upload middleware
export { upload };
