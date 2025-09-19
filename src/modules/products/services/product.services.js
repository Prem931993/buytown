import * as models from '../models/product.models.js';
import knex from '../../../config/db.js';
import fs from 'fs';
import path from 'path';
import * as notificationService from '../../notifications/services/notification.services.js';
import * as variationServices from '../../variations/services/variation.services.js';

// Get all products with pagination and search
export async function getAllProductsService({ page = 1, limit = 10, search = '', categoryId = null, brandId = null } = {}) {
  try {
    const products = await models.getAllProducts({ page, limit, search, categoryId, brandId });
    const totalCount = await models.getProductsCount({ search, categoryId, brandId });
    const totalPages = Math.ceil(totalCount / limit);

    return {
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      status: 200
    };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Get product by ID
export async function getProductByIdService(id) {
  try {
    const product = await models.getProductById(id);
    if (!product) {
      return { error: 'Product not found', status: 404 };
    }
    return { product, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Create a new product
export async function createProductService(productData, images = [], variations = [], childProductIds = []) {
  try {
    // Validate required fields
    if (!productData.name) {
      return { error: 'Product name is required', status: 400 };
    }
    // Set default price if not provided (required by database constraint)
    if (productData.price === undefined || productData.price === null || productData.price === '') {
      productData.price = 0;
    }
    
    // Set default status if not provided
    if (productData.status === undefined) {
      productData.status = 1; // active
    }

    // Check if product with same name already exists
    const existingProduct = await knex('byt_products')
      .where({ name: productData.name })
      .first();

    if (existingProduct) {
      return { error: 'Product with this name already exists', status: 409 };
    }

    // Set product type based on whether it has child products or a parent
    // Check if product_type is explicitly set to 'parent' or if childProductIds are provided
    if (productData.product_type === 'parent' || (childProductIds && childProductIds.length > 0)) {
      productData.product_type = 'parent';
    } else if (productData.parent_product_id) {
      productData.product_type = 'child';
    } else {
      productData.product_type = 'simple';
    }

    // Remove child_product_ids, images_to_remove, and related_product_ids from productData as they're not columns in the table
    // Keep variation_id as it's now a column in the products table
    const { child_product_ids, images_to_remove, related_product_ids, ...productDataWithoutSpecialFields } = productData;

    // Create the product
    const product = await models.createProduct(productDataWithoutSpecialFields);

    // Add images if provided
    if (images && images.length > 0) {
      await models.addProductImages(product.id, images);
    }

    // Add variations if provided
    if (variations && variations.length > 0) {
      // variations can be array of strings (labels) or objects with variation_id
      const variationIds = [];
      for (const v of variations) {
        if (typeof v === 'string') {
          // Check if variation exists by label
          let existingVariation = await knex('byt_variations')
            .where('label', v)
            .first();
          if (!existingVariation) {
            // Create new variation with label and default value
            existingVariation = await variationServices.createVariationService({ label: v, value: 'default' });
          }
          variationIds.push(existingVariation.id);
        } else if (v.variation_id) {
          // Check if variation exists by ID
          const existingVariation = await knex('byt_variations')
            .where('id', v.variation_id)
            .first();
          if (!existingVariation) {
            return { error: `Variation with ID ${v.variation_id} not found`, status: 400 };
          }
          variationIds.push(v.variation_id);
        }
      }
      // Add product variations with variation_id only, price and stock can be defaulted or handled separately
      const variationRecords = variationIds.map(id => ({
        product_id: product.id,
        variation_id: id,
        price: 0,
        stock: 0
      }));
      await knex('byt_product_variations').insert(variationRecords);
    }

    // Add child products if this is a parent product
    if (productData.product_type === 'parent' && childProductIds && childProductIds.length > 0) {
      await models.addChildProducts(product.id, childProductIds);

      // Update child products to set their parent_product_id
      await knex('byt_products')
        .whereIn('id', childProductIds)
        .update({
          product_type: 'child',
          parent_product_id: product.id,
          updated_at: knex.fn.now()
        });
    }

    // If this is a child product with a parent_product_id, add the relationship to the junction table
    if (productData.product_type === 'child' && productData.parent_product_id) {
      // Check if the relationship already exists
      const existingRelationship = await knex('byt_product_parent_child')
        .where({
          parent_product_id: productData.parent_product_id,
          child_product_id: product.id
        })
        .first();

      // If the relationship doesn't exist, create it
      if (!existingRelationship) {
        await knex('byt_product_parent_child').insert({
          parent_product_id: productData.parent_product_id,
          child_product_id: product.id
        });
      }

      // Update the child product to set its parent_product_id
      await knex('byt_products')
        .where('id', product.id)
        .update({
          product_type: 'child',
          parent_product_id: productData.parent_product_id,
          updated_at: knex.fn.now()
        });
    }

    // Add related products if provided
    if (productData.related_product_ids && productData.related_product_ids.length > 0) {
      await models.addRelatedProducts(product.id, productData.related_product_ids);
    }

    // Create notification for new product (queue for cronjob processing)
    try {
      await notificationService.createNewProductNotification(product);
    } catch (notificationError) {
      console.error('Error creating new product notification:', notificationError);
      // Don't fail the product creation if notification fails
    }

    // Return the complete product with images and variations
    return await getProductByIdService(product.id);
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Update product by ID
export async function updateProductService(id, productData, images = null, variations = null, imagesToRemove = null, childProductIds = null) {
  try {
    // Check if product exists
    // Set default price if not provided (required by database constraint)
    if (productData.price === undefined || productData.price === null || productData.price === '') {
      productData.price = 0;
    }

    const existingProduct = await models.getProductById(id);
    if (!existingProduct) {
      return { error: 'Product not found', status: 404 };
    }

    // Check if another product with same name already exists
    if (productData.name) {
      const duplicateProduct = await knex('byt_products')
        .where({ name: productData.name })
        .whereNot({ id })
        .first();

      if (duplicateProduct) {
        return { error: 'Product with this name already exists', status: 409 };
      }
    }
    
    // Set default status if not provided
    if (productData.status === undefined) {
      productData.status = 1; // active
    }

    // Set product type based on whether it has child products or a parent
    if (childProductIds !== null && childProductIds.length > 0) {
      productData.product_type = 'parent';
    } else if (productData.parent_product_id) {
      productData.product_type = 'child';
    } else if (childProductIds !== null && childProductIds.length === 0) {
      // If explicitly setting empty child products, make it a simple product
      productData.product_type = 'simple';
      productData.parent_product_id = null;
    }

    // Remove child_product_ids, images_to_remove, and related_product_ids from productData as they're not columns in the table
    // Keep variation_id as it's now a column in the products table
    const { child_product_ids, images_to_remove, related_product_ids, ...productDataWithoutSpecialFields } = productData;

    // Update the product
    const product = await models.updateProduct(id, productDataWithoutSpecialFields);

    // Update images if provided
    if (images !== null) {
      await models.updateProductImages(id, images);
    }

    // Update variations if provided
    if (variations !== null) {
      if (variations.length > 0) {
        // variations can be array of strings (labels) or objects with variation_id
        const variationIds = [];
        for (const v of variations) {
          if (typeof v === 'string') {
            // Check if variation exists by label
            let existingVariation = await knex('byt_variations')
              .where('label', v)
              .first();
            if (!existingVariation) {
              // Create new variation with label and default value
              existingVariation = await variationServices.createVariationService({ label: v, value: 'default' });
            }
            variationIds.push(existingVariation.id);
          } else if (v.variation_id) {
            variationIds.push(v.variation_id);
          }
        }
        // First delete existing variations for this product
        await knex('byt_product_variations').where('product_id', id).del();
        // Then add new variations
        const variationRecords = variationIds.map(variationId => ({
          product_id: id,
          variation_id: variationId,
          price: 0,
          stock: 0
        }));
        await knex('byt_product_variations').insert(variationRecords);
      } else {
        // If empty array, remove all variations
        await knex('byt_product_variations').where('product_id', id).del();
      }
    }
    
    // Delete images marked for removal
    if (imagesToRemove && imagesToRemove.length > 0) {
      for (const imageId of imagesToRemove) {
        await models.deleteProductImage(imageId);
      }
    }

    // Update child products if provided
    if (childProductIds !== null) {
      await models.addChildProducts(id, childProductIds);
      
      // Update child products to set their parent_product_id
      // First, reset parent_product_id for all products that had this product as parent
      await knex('byt_products')
        .where('parent_product_id', id)
        .update({
          product_type: 'simple',
          parent_product_id: null,
          updated_at: knex.fn.now()
        });
      
      // Then set parent_product_id for new child products
      if (childProductIds.length > 0) {
        await knex('byt_products')
          .whereIn('id', childProductIds)
          .update({
            product_type: 'child',
            parent_product_id: id,
            updated_at: knex.fn.now()
          });
      }
    }

    // If this is a child product with a parent_product_id, add the relationship to the junction table
    if (productData.product_type === 'child' && productData.parent_product_id) {
      // Check if the relationship already exists
      const existingRelationship = await knex('byt_product_parent_child')
        .where({
          parent_product_id: productData.parent_product_id,
          child_product_id: id
        })
        .first();

      // If the relationship doesn't exist, create it
      if (!existingRelationship) {
        await knex('byt_product_parent_child').insert({
          parent_product_id: productData.parent_product_id,
          child_product_id: id
        });
      }
    }

    // Update related products if provided
    if (productData.related_product_ids !== undefined) {
      await models.updateRelatedProducts(id, productData.related_product_ids);
    }

    // Return the complete product with images and variations
    return await getProductByIdService(id);
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Delete product by ID
export async function deleteProductService(id) {
  try {
    // Check if product exists
    const existingProduct = await models.getProductById(id);
    if (!existingProduct) {
      return { error: 'Product not found', status: 404 };
    }

    // Delete the product (soft delete)
    await models.deleteProduct(id);

    // Delete associated images from filesystem
    const productImages = await knex('byt_product_images')
      .where('product_id', id)
      .select('image_path');

    // Delete image files from filesystem
    for (const image of productImages) {
      try {
        const imagePath = path.join(process.cwd(), 'frontend/public', image.image_path);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (err) {
        console.error('Error deleting image file:', err);
      }
    }

    // Delete image records from database
    await knex('byt_product_images').where('product_id', id).del();

    // Delete variation records from database
    await knex('byt_product_variations').where('product_id', id).del();

    return { message: 'Product deleted successfully', status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Get product images
export async function getProductImagesService(productId) {
  try {
    const images = await knex('byt_product_images')
      .where('product_id', productId)
      .orderBy('sort_order');

    return { images, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Get product variations
export async function getProductVariationsService(productId) {
  try {
    const variations = await knex('byt_product_variations')
      .leftJoin('byt_variations', 'byt_product_variations.variation_id', 'byt_variations.id')
      .select(
        'byt_product_variations.*',
        'byt_variations.label as variation_label',
        'byt_variations.value as variation_value'
      )
      .where('byt_product_variations.product_id', productId);
    
    return { variations, status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

// Delete a single product image by ID
export async function deleteProductImageService(imageId) {
  try {
    // Delete the image record from database
    await models.deleteProductImage(imageId);
    
    return { message: 'Image deleted successfully', status: 200 };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}