import knex from '../../../config/db.js';

// Get all products with pagination and search
export async function getAllProducts({ page = 1, limit = 10, search = '', categoryId = null, brandId = null } = {}) {
  let query = knex('byt_products')
    .leftJoin('byt_categories as parent_categories', 'byt_products.category_id', 'parent_categories.id')
    .leftJoin('byt_categories as sub_categories', 'byt_products.subcategory_id', 'sub_categories.id')
    .leftJoin('byt_brands', 'byt_products.brand_id', 'byt_brands.id')
    .select(
      'byt_products.*',
      'parent_categories.name as category_name',
      'sub_categories.name as subcategory_name',
      'byt_brands.name as brand_name'
    )
    .where('byt_products.deleted_at', null);

  // Add search functionality
  if (search) {
    query = query.where('byt_products.name', 'ilike', `%${search}%`);
  }

  // Add category filter
  if (categoryId) {
    query = query.where('byt_products.category_id', categoryId);
  }

  // Add brand filter
  if (brandId) {
    query = query.where('byt_products.brand_id', brandId);
  }

  // Add ordering
  query = query.orderBy('byt_products.name');

  // Add pagination
  const offset = (page - 1) * limit;
  query = query.limit(limit).offset(offset);

  return query;
}

// Get total count of products with filters
export async function getProductsCount({ search = '', categoryId = null, brandId = null } = {}) {
  let query = knex('byt_products')
    .where('byt_products.deleted_at', null)
    .count('* as count');

  // Add search functionality
  if (search) {
    query = query.where('byt_products.name', 'ilike', `%${search}%`);
  }

  // Add category filter
  if (categoryId) {
    query = query.where('byt_products.category_id', categoryId);
  }

  // Add brand filter
  if (brandId) {
    query = query.where('byt_products.brand_id', brandId);
  }

  const result = await query.first();
  return parseInt(result.count);
}

// Get product by ID with related data
export async function getProductById(id) {
  const product = await knex('byt_products')
    .leftJoin('byt_categories as parent_categories', 'byt_products.category_id', 'parent_categories.id')
    .leftJoin('byt_categories as sub_categories', 'byt_products.subcategory_id', 'sub_categories.id')
    .leftJoin('byt_brands', 'byt_products.brand_id', 'byt_brands.id')
    .select(
      'byt_products.*',
      'parent_categories.name as category_name',
      'sub_categories.name as subcategory_name',
      'byt_brands.name as brand_name'
    )
    .where('byt_products.id', id)
    .where('byt_products.deleted_at', null)
    .first();

  if (!product) {
    return null;
  }

  // Get product images
  const images = await knex('byt_product_images')
    .where('product_id', id)
    .orderBy('sort_order');

  // Get product variations
  const variations = await knex('byt_product_variations')
    .leftJoin('byt_variations', 'byt_product_variations.variation_id', 'byt_variations.id')
    .select(
      'byt_product_variations.*',
      'byt_variations.label as variation_label',
      'byt_variations.value as variation_value'
    )
    .where('byt_product_variations.product_id', id);

  // If this is a parent product, get child products
  let childProducts = [];
  if (product.product_type === 'parent') {
    childProducts = await knex('byt_product_parent_child as ppc')
      .leftJoin('byt_products as child', 'ppc.child_product_id', 'child.id')
      .select(
        'child.id',
        'child.name',
        'child.sku_code',
        'child.price',
        'child.stock'
      )
      .where('ppc.parent_product_id', id)
      .where('child.deleted_at', null);
  }

  // If this is a child product, get parent product
  let parentProduct = null;
  if (product.product_type === 'child' && product.parent_product_id) {
    parentProduct = await knex('byt_products')
      .select('id', 'name', 'sku_code')
      .where('id', product.parent_product_id)
      .where('deleted_at', null)
      .first();
  }

  return {
    ...product,
    images,
    variations,
    childProducts: childProducts || [],
    parentProduct: parentProduct || null
  };
}

// Create a new product
export async function createProduct(productData) {
  // Insert the product and get the ID
  const [result] = await knex('byt_products').insert(productData).returning('id');

  // Handle different return formats from different database drivers
  let productId;
  if (typeof result === 'object' && result !== null) {
    // If result is an object, extract the ID
    productId = result.id || result[0];
  } else {
    // If result is a scalar value
    productId = result;
  }

  // Return the full product object
  return getProductById(productId);
}

// Update product by ID
export async function updateProduct(id, productData) {
  // Update the product
  await knex('byt_products')
    .where({ id })
    .update({ ...productData, updated_at: knex.fn.now() });

  // Return the updated product
  return getProductById(id);
}

// Delete product by ID (soft delete)
export async function deleteProduct(id) {
  return knex('byt_products')
    .where({ id })
    .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() });
}

// Add images to product
export async function addProductImages(productId, images) {
  if (!images || images.length === 0) {
    return [];
  }

  const imageRecords = images.map((image, index) => ({
    product_id: productId,
    image_path: image.path,
    sort_order: index,
    is_primary: index === 0
  }));

  return knex('byt_product_images').insert(imageRecords);
}

// Update product images
export async function updateProductImages(productId, images) {
  // First delete existing images
  await knex('byt_product_images').where('product_id', productId).del();

  // Then add new images
  return addProductImages(productId, images);
}

// Add variations to product
export async function addProductVariations(productId, variations) {
  if (!variations || variations.length === 0) {
    return [];
  }

  const variationRecords = variations.map(variation => ({
    product_id: productId,
    variation_id: variation.variation_id,
    price: variation.price,
    stock: variation.stock
  }));

  return knex('byt_product_variations').insert(variationRecords);
}

// Update product variations
export async function updateProductVariations(productId, variations) {
  // First delete existing variations
  await knex('byt_product_variations').where('product_id', productId).del();

  // Then add new variations
  return addProductVariations(productId, variations);
}

// Delete a single product image by ID
export async function deleteProductImage(imageId) {
  return knex('byt_product_images').where({ id: imageId }).del();
}

// Add child products to a parent product
export async function addChildProducts(parentProductId, childProductIds) {
  // First, remove all existing child product relationships for this parent
  await knex('byt_product_parent_child').where('parent_product_id', parentProductId).del();
  
  // Then add the new child product relationships
  if (childProductIds && childProductIds.length > 0) {
    const relationships = childProductIds.map(childId => ({
      parent_product_id: parentProductId,
      child_product_id: childId
    }));
    return knex('byt_product_parent_child').insert(relationships);
  }
  
  return [];
}

// Get all child products for a parent product
export async function getChildProducts(parentProductId) {
  return knex('byt_product_parent_child as ppc')
    .leftJoin('byt_products as child', 'ppc.child_product_id', 'child.id')
    .select(
      'child.id',
      'child.name',
      'child.sku_code',
      'child.price',
      'child.stock'
    )
    .where('ppc.parent_product_id', parentProductId)
    .where('child.deleted_at', null);
}

// Get parent product for a child product
export async function getParentProduct(childProductId) {
  const result = await knex('byt_products as child')
    .leftJoin('byt_products as parent', 'child.parent_product_id', 'parent.id')
    .select(
      'parent.id',
      'parent.name',
      'parent.sku_code'
    )
    .where('child.id', childProductId)
    .where('parent.deleted_at', null)
    .first();
    
  return result || null;
}