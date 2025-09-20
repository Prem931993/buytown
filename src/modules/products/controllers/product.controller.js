import * as services from '../services/product.services.js';
import * as brandServices from '../../brands/services/brand.services.js';
import * as brandModels from '../../brands/models/brand.models.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from '../../../config/cloudinary.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer storage for memory (for Cloudinary upload)
const productStorage = multer.memoryStorage();

// Configure multer storage for import uploads (to memory)
const importStorage = multer.memoryStorage();

const upload = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const importUpload = multer({
  storage: importStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for import files
});

// Get all products with pagination and search
export async function getAllProducts(req, res) {
  try {
    // Get pagination and search parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;
    const brandId = req.query.brand_id ? parseInt(req.query.brand_id) : null;

    const result = await services.getAllProductsService({ page, limit, search, categoryId, brandId });
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({
      statusCode: result.status,
      products: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get product by ID
export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const result = await services.getProductByIdService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, product: result.product });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Create a new product
export async function createProduct(req, res) {
  try {
    const productData = req.body;

    // Parse variations if provided
    let variations = [];
    if (productData.variations) {
      try {
        variations = JSON.parse(productData.variations);
      } catch (e) {
        variations = [];
      }
    }
    
    // Parse child product IDs if provided
    let childProductIds = [];
    if (productData.child_product_ids) {
      try {
        childProductIds = JSON.parse(productData.child_product_ids);
      } catch (e) {
        childProductIds = [];
      }
    }

    // Parse related product IDs if provided
    let relatedProductIds = [];
    if (productData.related_product_ids) {
      try {
        relatedProductIds = JSON.parse(productData.related_product_ids);
      } catch (e) {
        relatedProductIds = [];
      }
    }

    // Convert status string to integer if provided
    if (productData.status) {
      switch (productData.status) {
        case 'active':
          productData.status = 1;
          break;
        case 'out_of_stock':
          productData.status = 2;
          break;
        case 'discontinued':
          productData.status = 3;
          break;
        default:
          productData.status = 1; // default to active
      }
    }

    // Handle images if uploaded
    let images = [];
    if (req.files && req.files.length > 0) {
      try {
        // Upload images to Cloudinary
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          let fileData;
          if (file.buffer) {
            // Memory storage - use buffer
            fileData = file.buffer;
          } else if (file.path) {
            // Disk storage - use file path
            fileData = file.path;
          } else {
            throw new Error('No file data available');
          }

          const cloudinaryResult = await uploadToCloudinary(fileData, 'products');
          images.push({
            path: cloudinaryResult.secure_url,
            sort_order: i,
            is_primary: i === 0
          });
        }
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ statusCode: 500, error: 'Failed to upload images' });
      }
    }

    // Attach relatedProductIds to productData for service layer
    productData.related_product_ids = relatedProductIds;

    const result = await services.createProductService(productData, images, variations, childProductIds);
    if (result.error) {
      // If there's an error and files were uploaded to Cloudinary, delete them
      if (images.length > 0) {
        images.forEach(async (image) => {
          try {
            const publicId = extractPublicIdFromUrl(image.path);
            await deleteFromCloudinary(publicId);
          } catch (deleteError) {
            console.error('Error deleting from Cloudinary:', deleteError);
          }
        });
      }
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, product: result.product });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Data sanitization utility function
function sanitizeProductData(data) {
  const sanitized = { ...data };

  // Convert "undefined" strings to null for optional integer fields
  const integerFields = [
    'category_id', 'brand_id', 'variation_id', 'parent_product_id',
    'stock', 'min_order_qty', 'weight_kg'
  ];

  integerFields.forEach(field => {
    if (sanitized[field] === 'undefined' || sanitized[field] === undefined) {
      sanitized[field] = null;
    } else if (sanitized[field] !== null && sanitized[field] !== '') {
      // Convert to integer if it's a valid number
      const numValue = parseInt(sanitized[field]);
      sanitized[field] = isNaN(numValue) ? null : numValue;
    }
  });

  // Convert "undefined" strings to null for optional float fields
  const floatFields = ['selling_price', 'price', 'gst', 'discount'];
  floatFields.forEach(field => {
    if (sanitized[field] === 'undefined' || sanitized[field] === undefined) {
      sanitized[field] = null;
    } else if (sanitized[field] !== null && sanitized[field] !== '') {
      // Convert to float if it's a valid number
      const numValue = parseFloat(sanitized[field]);
      sanitized[field] = isNaN(numValue) ? null : numValue;
    }
  });

  // Convert "undefined" strings to empty arrays for optional array fields
  const arrayFields = ['images_to_remove', 'child_product_ids', 'related_product_ids'];
  arrayFields.forEach(field => {
    if (sanitized[field] === 'undefined') {
      sanitized[field] = [];
    } else if (sanitized[field] === undefined) {
      sanitized[field] = null;
    }
  });

  // Handle variations field
  if (sanitized.variations === 'undefined') {
    sanitized.variations = [];
  }

  // Handle delivery_flag conversion
  if (sanitized.delivery_flag === 'true') {
    sanitized.delivery_flag = true;
  } else if (sanitized.delivery_flag === 'false') {
    sanitized.delivery_flag = false;
  } else if (sanitized.delivery_flag === 'undefined' || sanitized.delivery_flag === undefined) {
    sanitized.delivery_flag = null;
  }

  return sanitized;
}

// Update product by ID
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    let productData = req.body;

    // Sanitize the input data to handle "undefined" strings
    productData = sanitizeProductData(productData);
    
    // Extract images to remove if provided
    let imagesToRemove = null;
    if (productData.images_to_remove) {
      // Handle both array and comma-separated string formats
      if (typeof productData.images_to_remove === 'string') {
        // Convert comma-separated string to array of integers
        imagesToRemove = productData.images_to_remove.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      } else if (Array.isArray(productData.images_to_remove)) {
        // Already an array, convert to integers
        imagesToRemove = productData.images_to_remove.map(id => parseInt(id)).filter(id => !isNaN(id));
      }
      delete productData.images_to_remove; // Remove from product data
    }

    // Parse variations if provided
    let variations = null;
    if (productData.variations) {
      try {
        variations = JSON.parse(productData.variations);
      } catch (e) {
        variations = [];
      }
    }

    // Parse child product IDs if provided
    let childProductIds = null;
    if (productData.child_product_ids) {
      try {
        childProductIds = JSON.parse(productData.child_product_ids);
      } catch (e) {
        childProductIds = [];
      }
    }

    // Parse related product IDs if provided
    let relatedProductIds = null;
    if (productData.related_product_ids) {
      try {
        relatedProductIds = JSON.parse(productData.related_product_ids);
      } catch (e) {
        relatedProductIds = [];
      }
    }

    // Handle images if uploaded
    // Only update images if files were actually uploaded
    let images = null;
    if (req.files && req.files.length > 0) {
      try {
        // Upload images to Cloudinary
        images = [];
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          let fileData;
          if (file.buffer) {
            // Memory storage - use buffer
            fileData = file.buffer;
          } else if (file.path) {
            // Disk storage - use file path
            fileData = file.path;
          } else {
            throw new Error('No file data available');
          }

          const cloudinaryResult = await uploadToCloudinary(fileData, 'products');
          images.push({
            path: cloudinaryResult.secure_url,
            sort_order: i,
            is_primary: i === 0
          });
        }
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ statusCode: 500, error: 'Failed to upload images' });
      }
    }

    // Attach relatedProductIds to productData for service layer
    productData.related_product_ids = relatedProductIds;

    const result = await services.updateProductService(id, productData, images, variations, imagesToRemove, childProductIds);
    if (result.error) {
      // If there's an error and files were uploaded to Cloudinary, delete them
      if (images && images.length > 0) {
        images.forEach(async (image) => {
          try {
            const publicId = extractPublicIdFromUrl(image.path);
            await deleteFromCloudinary(publicId);
          } catch (deleteError) {
            console.error('Error deleting from Cloudinary:', deleteError);
          }
        });
      }
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, product: result.product });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Delete product by ID
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const result = await services.deleteProductService(id);
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    res.status(result.status).json({ statusCode: result.status, message: result.message });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Import products from Excel file
export async function importProducts(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ statusCode: 400, error: 'No file uploaded' });
    }

    const xlsx = await import('xlsx');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const products = xlsx.utils.sheet_to_json(worksheet);

    // First pass: Create all products without parent-child relationships
    let successCount = 0;
    const errors = [];
    const productMap = new Map(); // Map to store product SKU to ID mappings

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      try {
        // Validate required fields
        if (!productData.name || !productData.price) {
          errors.push({ row: i + 2, message: 'Missing required fields: name or price' });
          continue;
        }

        // Handle brand mapping - if brand name is provided, try to find the brand ID
        let brandId = null;
        if (productData.brand_id) {
          brandId = parseInt(productData.brand_id);
        } else if (productData.brand) {
          // Try to find brand by name
          const brand = await brandModels.getBrandByName(productData.brand);
          if (brand) {
            brandId = brand.id;
          }
        }
        
        // Create the product
        const result = await services.createProductService({
          name: productData.name,
          description: productData.description || '',
          price: parseFloat(productData.price),
          category_id: productData.category_id ? parseInt(productData.category_id) : null,
          brand_id: brandId,
          sku_code: productData.sku_code || null,
          hsn_code: productData.hsn_code || null,
          color: productData.color || null,
          size_dimension: productData.size_dimension || null,
          weight_kg: productData.weight_kg ? parseFloat(productData.weight_kg) : null,
          length_mm: productData.length_mm ? parseFloat(productData.length_mm) : null,
          width_mm: productData.width_mm ? parseFloat(productData.width_mm) : null,
          height_mm: productData.height_mm ? parseFloat(productData.height_mm) : null,
          selling_price: productData.selling_price ? parseFloat(productData.selling_price) : null,
          discount: productData.discount ? parseFloat(productData.discount) : null,
          gst: productData.gst ? parseFloat(productData.gst) : null,
          unit: productData.unit || null,
          stock: productData.stock ? parseInt(productData.stock) : 0,
          status: productData.status || 1,
          product_type: productData.parent_sku ? 'child' : 'simple'
        });
        
        if (result.error) {
          errors.push({ row: i + 2, message: result.error });
          continue;
        }
        
        // Store product ID in map for parent-child relationship mapping
        if (productData.sku_code) {
          productMap.set(productData.sku_code, result.product.id);
        }
        
        successCount++;
      } catch (error) {
        errors.push({ row: i + 2, message: error.message });
      }
    }
    
    // Second pass: Update parent-child relationships
    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      try {
        // Skip if no parent SKU is specified
        if (!productData.parent_sku) {
          continue;
        }
        
        // Get child product ID
        const childProductId = productMap.get(productData.sku_code);
        if (!childProductId) {
          continue;
        }
        
        // Get parent product ID
        const parentProductId = productMap.get(productData.parent_sku);
        if (!parentProductId) {
          errors.push({ row: i + 2, message: `Parent product with SKU ${productData.parent_sku} not found` });
          continue;
        }
        
        // Update child product to set parent_product_id
        await services.updateProductService(childProductId, {
          product_type: 'child',
          parent_product_id: parentProductId
        });
        
        // Update parent product to set product_type as parent
        await services.updateProductService(parentProductId, {
          product_type: 'parent'
        });
      } catch (error) {
        errors.push({ row: i + 2, message: error.message });
      }
    }
    
    // Third pass: Handle parent products (products with child products but no parent_sku)
    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      try {
        // Skip if parent SKU is specified (already handled) or if this product is not a parent
        if (productData.parent_sku) {
          continue;
        }
        
        // Check if this product is referenced as a parent in any other product
        const isParent = products.some(p => p.parent_sku === productData.sku_code);
        if (!isParent) {
          continue;
        }
        
        // Get parent product ID
        const parentProductId = productMap.get(productData.sku_code);
        if (!parentProductId) {
          continue;
        }
        
        // Update parent product to set product_type as parent
        await services.updateProductService(parentProductId, {
          product_type: 'parent'
        });
      } catch (error) {
        errors.push({ row: i + 2, message: error.message });
      }
    }

    res.status(200).json({
      statusCode: 200,
      message: `${successCount} products imported successfully`,
      success: successCount,
      errors: errors
    });
  } catch (error) {
    console.error('Error importing products:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Delete a single product image by ID
export async function deleteProductImage(req, res) {
  try {
    const { imageId } = req.params;
    
    // Call the service to delete the image
    const result = await services.deleteProductImageService(imageId);
    
    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }
    
    res.status(result.status).json({ statusCode: result.status, message: result.message });
  } catch (error) {
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Export multer upload middleware
export { upload, importUpload };
