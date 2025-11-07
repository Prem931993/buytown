import knex from '../../../config/db.js';

// Get all products with pagination and search
export async function getAllProducts({ page = 1, limit = 10, search = '', categoryIds = [], brandIds = [], minPrice = null, maxPrice = null, sizeDimensions = [], colors = [], variationIds = [], status} = {}) {
  let query = knex('byt_products')
    .leftJoin('byt_categories as parent_categories', 'byt_products.category_id', 'parent_categories.id')
    .leftJoin('byt_categories as sub_categories', 'byt_products.subcategory_id', 'sub_categories.id')
    .leftJoin('byt_brands', 'byt_products.brand_id', 'byt_brands.id')
    .leftJoin('byt_variations', 'byt_products.variation_id', 'byt_variations.id')
    .select(
      'byt_products.id',
      'byt_products.name',
      'byt_products.sku_code',
      'byt_products.description',
      'byt_products.price',
      'byt_products.selling_price',
      'byt_products.gst',
      'byt_products.hsn_code',
      'byt_products.status',
      'byt_products.category_id',
      'byt_products.subcategory_id',
      'byt_products.brand_id',
      'byt_products.variation_id',
      'byt_products.product_type',
      'byt_products.parent_product_id',
      'byt_products.color',
      'byt_products.size_dimension',
      'byt_products.created_at',
      'byt_products.updated_at',
      'byt_products.deleted_at',
      knex.raw('byt_products.stock - COALESCE(byt_products.held_quantity, 0) as stock'),
      'parent_categories.name as category_name',
      'sub_categories.name as subcategory_name',
      'byt_brands.name as brand_name',
      'byt_variations.label as variation_label',
      'byt_variations.value as variation_value'
    )
    .where('byt_products.deleted_at', null);

  // Add search functionality
  if (search) {
    query = query.where('byt_products.name', 'ilike', `%${search}%`);
  }

  // Add category filters (multiple categories)
  if (categoryIds && categoryIds.length > 0) {
    query = query.whereIn('byt_products.category_id', categoryIds);
  }

  // Add brand filters (multiple brands)
  if (brandIds && brandIds.length > 0) {
    query = query.whereIn('byt_products.brand_id', brandIds);
  }

  // Add price range filters
  if (minPrice !== null) {
    query = query.where('byt_products.price', '>=', minPrice);
  }

  if (maxPrice !== null) {
    query = query.where('byt_products.price', '<=', maxPrice);
  }

  // Add size dimension filters (multiple size dimensions)
  if (sizeDimensions && sizeDimensions.length > 0) {
    query = query.where(function() {
      sizeDimensions.forEach((size, index) => {
        if (index === 0) {
          this.where('byt_products.size_dimension', 'ilike', `%${size}%`);
        } else {
          this.orWhere('byt_products.size_dimension', 'ilike', `%${size}%`);
        }
      });
    });
  }

  // Add color filters (multiple colors)
  if (colors && colors.length > 0) {
    query = query.where(function() {
      colors.forEach((color, index) => {
        if (index === 0) {
          this.where('byt_products.color', 'ilike', `%${color}%`);
        } else {
          this.orWhere('byt_products.color', 'ilike', `%${color}%`);
        }
      });
    });
  }

  // Add variation filters (multiple variations)
  if (variationIds && variationIds.length > 0) {
    query = query.whereIn('byt_products.variation_id', variationIds);
  }

  if (status) {
    query = query.whereIn('byt_products.status', status);
  }

  // Add ordering - ensure consistent order for pagination
  query = query.orderBy('byt_products.created_at', 'desc').orderBy('byt_products.id', 'desc');

  // Add pagination
  const offset = (page - 1) * limit;
  query = query.limit(limit).offset(offset);

  return query;
}

// Get filter values for products
export async function getProductFilterValues(categoryIds = []) {
  try {
    // Base query conditions
    const baseConditions = (query) => {
      query.where('byt_products.deleted_at', null)
           .where('byt_products.status', 1);
      if (categoryIds && categoryIds.length > 0) {
        query.whereIn('byt_products.category_id', categoryIds);
      }
    };

    // Get distinct categories
    let categoriesQuery = knex('byt_products')
      .leftJoin('byt_categories', 'byt_products.category_id', 'byt_categories.id')
      .select('byt_categories.id', 'byt_categories.name')
      .where('byt_categories.is_active', true)
      .distinct()
      .orderBy('byt_categories.name');
    baseConditions(categoriesQuery);
    const categories = await categoriesQuery;

    // Get distinct brands
    let brandsQuery = knex('byt_products')
      .leftJoin('byt_brands', 'byt_products.brand_id', 'byt_brands.id')
      .select('byt_brands.id', 'byt_brands.name')
      .where('byt_brands.is_active', true)
      .distinct()
      .orderBy('byt_brands.name');
    baseConditions(brandsQuery);
    const brands = await brandsQuery;

    // Get distinct colors
    let colorsQuery = knex('byt_products')
      .select('color')
      .whereNotNull('color')
      .where('color', '!=', '')
      .distinct()
      .orderBy('color');
    baseConditions(colorsQuery);
    const colors = await colorsQuery;

    // Get distinct size dimensions
    let sizeDimensionsQuery = knex('byt_products')
      .select('size_dimension')
      .whereNotNull('size_dimension')
      .where('size_dimension', '!=', '')
      .distinct()
      .orderBy('size_dimension');
    baseConditions(sizeDimensionsQuery);
    const sizeDimensions = await sizeDimensionsQuery;

    // Get distinct variations
    let variationsQuery = knex('byt_products')
      .leftJoin('byt_variations', 'byt_products.variation_id', 'byt_variations.id')
      .select('byt_variations.id', 'byt_variations.label', 'byt_variations.value')
      .whereNotNull('byt_variations.id')
      .distinct()
      .orderBy('byt_variations.label');
    baseConditions(variationsQuery);
    const variations = await variationsQuery;

    // Get price range
    let priceRangeQuery = knex('byt_products')
      .select(
        knex.raw('MIN(price) as min_price'),
        knex.raw('MAX(price) as max_price')
      );
    baseConditions(priceRangeQuery);
    const priceRange = await priceRangeQuery.first();

    return {
      categories: categories.filter(cat => cat.id && cat.name),
      brands: brands.filter(brand => brand.id && brand.name),
      colors: colors.map(c => c.color).filter(color => color),
      sizeDimensions: sizeDimensions.map(s => s.size_dimension).filter(size => size),
      variations: variations.filter(v => v.id && v.label),
      priceRange: {
        min: priceRange?.min_price || 0,
        max: priceRange?.max_price || 0
      }
    };
  } catch (error) {
    console.error('Error in getProductFilterValues:', error);
    throw error;
  }
}

// Global search across products, categories, and brands
export async function getGlobalSearch({ search = '', limit = 10 } = {}) {
  if (!search || search.trim() === '') {
    return {
      products: [],
      categories: [],
      brands: []
    };
  }

  const searchTerm = `%${search.trim()}%`;

  // Search products
  const products = await knex('byt_products')
    .leftJoin('byt_categories as parent_categories', 'byt_products.category_id', 'parent_categories.id')
    .leftJoin('byt_categories as sub_categories', 'byt_products.subcategory_id', 'sub_categories.id')
    .leftJoin('byt_brands', 'byt_products.brand_id', 'byt_brands.id')
    .leftJoin('byt_variations', 'byt_products.variation_id', 'byt_variations.id')
    .select(
      'byt_products.id',
      'byt_products.name',
      'byt_products.sku_code',
      'byt_products.description',
      'byt_products.price',
      'byt_products.selling_price',
      'byt_products.gst',
      'byt_products.hsn_code',
      'byt_products.status',
      'byt_products.category_id',
      'byt_products.subcategory_id',
      'byt_products.brand_id',
      'byt_products.variation_id',
      'byt_products.product_type',
      'byt_products.parent_product_id',
      'byt_products.color',
      'byt_products.size_dimension',
      'byt_products.created_at',
      'byt_products.updated_at',
      'byt_products.deleted_at',
      knex.raw('byt_products.stock - COALESCE(byt_products.held_quantity, 0) as stock'),
      'parent_categories.name as category_name',
      'sub_categories.name as subcategory_name',
      'byt_brands.name as brand_name',
      'byt_variations.label as variation_label',
      'byt_variations.value as variation_value'
    )
    .where('byt_products.deleted_at', null)
    .where('byt_products.status', 1)
    .where('byt_products.name', 'ilike', searchTerm)
    .orderBy('byt_products.name')
    .limit(limit);

  // Search categories
  const categories = await knex('byt_categories')
    .select('id', 'name', 'description', 'image', 'parent_id')
    .where('is_active', true)
    .where('name', 'ilike', searchTerm)
    .orderBy('name')
    .limit(limit);

  // Search brands
  const brands = await knex('byt_brands')
    .select('id', 'name', 'description', 'image', 'is_active')
    .where('is_active', true)
    .where('name', 'ilike', searchTerm)
    .orderBy('name')
    .limit(limit);

  return {
    products,
    categories,
    brands
  };
}

// Get total count of products with filters
export async function getProductsCount({ search = '', categoryIds = [], brandIds = [], minPrice = null, maxPrice = null, sizeDimensions = [], colors = [], variationIds = [] } = {}) {
  let query = knex('byt_products')
    .where('byt_products.deleted_at', null)
    .count('* as count');

  // Add search functionality
  if (search) {
    query = query.where('byt_products.name', 'ilike', `%${search}%`);
  }

  // Add category filters (multiple categories)
  if (categoryIds && categoryIds.length > 0) {
    query = query.whereIn('byt_products.category_id', categoryIds);
  }

  // Add brand filters (multiple brands)
  if (brandIds && brandIds.length > 0) {
    query = query.whereIn('byt_products.brand_id', brandIds);
  }

  // Add price range filters
  if (minPrice !== null) {
    query = query.where('byt_products.price', '>=', minPrice);
  }

  if (maxPrice !== null) {
    query = query.where('byt_products.price', '<=', maxPrice);
  }

  // Add size dimension filters (multiple size dimensions)
  if (sizeDimensions && sizeDimensions.length > 0) {
    query = query.where(function() {
      sizeDimensions.forEach((size, index) => {
        if (index === 0) {
          this.where('byt_products.size_dimension', 'ilike', `%${size}%`);
        } else {
          this.orWhere('byt_products.size_dimension', 'ilike', `%${size}%`);
        }
      });
    });
  }

  // Add color filters (multiple colors)
  if (colors && colors.length > 0) {
    query = query.where(function() {
      colors.forEach((color, index) => {
        if (index === 0) {
          this.where('byt_products.color', 'ilike', `%${color}%`);
        } else {
          this.orWhere('byt_products.color', 'ilike', `%${color}%`);
        }
      });
    });
  }

  // Add variation filters (multiple variations)
  if (variationIds && variationIds.length > 0) {
    query = query.whereIn('byt_products.variation_id', variationIds);
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
    .leftJoin('byt_variations', 'byt_products.variation_id', 'byt_variations.id')
    .select(
      'byt_products.id',
      'byt_products.name',
      'byt_products.sku_code',
      'byt_products.description',
      'byt_products.price',
      'byt_products.selling_price',
      'byt_products.gst',
      'byt_products.hsn_code',
      'byt_products.status',
      'byt_products.category_id',
      'byt_products.subcategory_id',
      'byt_products.brand_id',
      'byt_products.variation_id',
      'byt_products.product_type',
      'byt_products.parent_product_id',
      'byt_products.color',
      'byt_products.size_dimension',
      'byt_products.created_at',
      'byt_products.updated_at',
      'byt_products.deleted_at',
      knex.raw('byt_products.stock - COALESCE(byt_products.held_quantity, 0) as stock'),
      'parent_categories.name as category_name',
      'sub_categories.name as subcategory_name',
      'byt_brands.name as brand_name',
      'byt_variations.label as variation_label',
      'byt_variations.value as variation_value'
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

  // Get related products
  const relatedProducts = await getRelatedProducts(id);

  return {
    ...product,
    images,
    variations,
    childProducts: childProducts || [],
    parentProduct: parentProduct || null,
    relatedProducts: relatedProducts || []
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
    .where({ id }).del();
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
  // First get the image record to get the path for FTP deletion
  const image = await knex('byt_product_images')
    .where({ id: imageId })
    .select('image_path')
    .first();

  if (image) {
    // Import FTP functions
    const { deleteFromFTP, extractPublicIdFromUrl } = await import('../../../config/ftp.js');

    try {
      // Extract public ID from URL and delete from FTP
      const publicId = extractPublicIdFromUrl(image.image_path);
      if (publicId) {
        await deleteFromFTP(publicId);
      }
    } catch (ftpError) {
      console.error('Failed to delete from FTP:', ftpError);
      // Continue with database deletion even if FTP deletion fails
    }
  }

  // Delete from database
  return knex('byt_product_images').where({ id: imageId }).del();
}

// Get product images by product ID
export async function getProductImages(productId) {
  return knex('byt_product_images')
    .where('product_id', productId)
    .orderBy('sort_order');
}

// Get product variations by product ID
export async function getProductVariations(productId) {
  return knex('byt_product_variations')
    .leftJoin('byt_variations', 'byt_product_variations.variation_id', 'byt_variations.id')
    .select(
      'byt_product_variations.*',
      'byt_variations.label as variation_label',
      'byt_variations.value as variation_value'
    )
    .where('byt_product_variations.product_id', productId);
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

// Add related products to a product
export async function addRelatedProducts(productId, relatedProductIds) {
  // First, remove all existing related product relationships for this product
  await knex('byt_product_related').where('product_id', productId).del();

  // Then add the new related product relationships
  if (relatedProductIds && relatedProductIds.length > 0) {
    const relationships = relatedProductIds.map(relatedId => ({
      product_id: productId,
      related_product_id: relatedId
    }));
    return knex('byt_product_related').insert(relationships);
  }

  return [];
}

// Get all related products for a product
export async function getRelatedProducts(productId) {
  return knex('byt_product_related as pr')
    .leftJoin('byt_products as related', 'pr.related_product_id', 'related.id')
    .select(
      'related.id',
      'related.name',
      'related.sku_code',
      'related.price',
      'related.stock'
    )
    .where('pr.product_id', productId)
    .where('related.deleted_at', null);
}

// Update related products for a product
export async function updateRelatedProducts(productId, relatedProductIds) {
  // Remove existing related products
  await knex('byt_product_related').where('product_id', productId).del();

  // Add new related products
  if (relatedProductIds && relatedProductIds.length > 0) {
    const relationships = relatedProductIds.map(relatedId => ({
      product_id: productId,
      related_product_id: relatedId
    }));
    return knex('byt_product_related').insert(relationships);
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

// Get new arrivals products (recently added products)
export async function getNewArrivalsProducts({ categoryIds = [], limit = 4 } = {}) {
  let query = knex('byt_products')
    .leftJoin('byt_categories as parent_categories', 'byt_products.category_id', 'parent_categories.id')
    .leftJoin('byt_categories as sub_categories', 'byt_products.subcategory_id', 'sub_categories.id')
    .leftJoin('byt_brands', 'byt_products.brand_id', 'byt_brands.id')
    .leftJoin('byt_variations', 'byt_products.variation_id', 'byt_variations.id')
    .select(
      'byt_products.id',
      'byt_products.name',
      'byt_products.sku_code',
      'byt_products.description',
      'byt_products.price',
      'byt_products.selling_price',
      'byt_products.gst',
      'byt_products.hsn_code',
      'byt_products.status',
      'byt_products.category_id',
      'byt_products.subcategory_id',
      'byt_products.brand_id',
      'byt_products.variation_id',
      'byt_products.product_type',
      'byt_products.parent_product_id',
      'byt_products.color',
      'byt_products.size_dimension',
      'byt_products.created_at',
      'byt_products.updated_at',
      'byt_products.deleted_at',
      knex.raw('byt_products.stock - COALESCE(byt_products.held_quantity, 0) as stock'),
      'parent_categories.name as category_name',
      'sub_categories.name as subcategory_name',
      'byt_brands.name as brand_name',
      'byt_variations.label as variation_label',
      'byt_variations.value as variation_value'
    )
    .where('byt_products.deleted_at', null)
    .where('byt_products.status', 1)
    .orderBy('byt_products.created_at', 'desc');

  // Add category filter (multiple categories)
  if (categoryIds && categoryIds.length > 0) {
    query = query.whereIn('byt_products.category_id', categoryIds);
  }

  // Add limit
  query = query.limit(limit);

  return query;
}

// Get top selling products (based on order history)
export async function getTopSellingProducts({ categoryIds = [], limit = 8 } = {}) {
  let query = knex('byt_products')
    .leftJoin('byt_order_items', 'byt_products.id', 'byt_order_items.product_id')
    .leftJoin('byt_orders', 'byt_order_items.order_id', 'byt_orders.id')
    .leftJoin('byt_categories as parent_categories', 'byt_products.category_id', 'parent_categories.id')
    .leftJoin('byt_categories as sub_categories', 'byt_products.subcategory_id', 'sub_categories.id')
    .leftJoin('byt_brands', 'byt_products.brand_id', 'byt_brands.id')
    .leftJoin('byt_variations', 'byt_products.variation_id', 'byt_variations.id')
    .select(
      'byt_products.id',
      'byt_products.name',
      'byt_products.sku_code',
      'byt_products.description',
      'byt_products.price',
      'byt_products.selling_price',
      'byt_products.gst',
      'byt_products.hsn_code',
      'byt_products.status',
      'byt_products.category_id',
      'byt_products.subcategory_id',
      'byt_products.brand_id',
      'byt_products.variation_id',
      'byt_products.product_type',
      'byt_products.parent_product_id',
      'byt_products.color',
      'byt_products.size_dimension',
      'byt_products.created_at',
      'byt_products.updated_at',
      'byt_products.deleted_at',
      knex.raw('byt_products.stock - COALESCE(byt_products.held_quantity, 0) as stock'),
      'parent_categories.name as category_name',
      'sub_categories.name as subcategory_name',
      'byt_brands.name as brand_name',
      'byt_variations.label as variation_label',
      'byt_variations.value as variation_value'
    )
    .sum('byt_order_items.quantity as total_sold')
    .where('byt_products.deleted_at', null)
    .where('byt_products.status', 1)
    .where('byt_orders.status', '!=', 'cancelled')
    .where('byt_orders.status', '!=', 'rejected')
    .groupBy(
      'byt_products.id',
      'parent_categories.name',
      'sub_categories.name',
      'byt_brands.name',
      'byt_variations.label',
      'byt_variations.value'
    )
    .orderBy('total_sold', 'desc');

  // Add category filter (multiple categories)
  if (categoryIds && categoryIds.length > 0) {
    query = query.whereIn('byt_products.category_id', categoryIds);
  }

  // Add limit
  query = query.limit(limit);

  const results = await query;

  // If no results (no orders), return random products as fallback
  if (results.length === 0) {
    return getRandomProducts({ categoryIds, limit });
  }

  return results;
}

// Get random products
export async function getRandomProducts({ categoryIds = [], limit = 10 } = {}) {
  let query = knex('byt_products')
    .leftJoin('byt_categories as parent_categories', 'byt_products.category_id', 'parent_categories.id')
    .leftJoin('byt_categories as sub_categories', 'byt_products.subcategory_id', 'sub_categories.id')
    .leftJoin('byt_brands', 'byt_products.brand_id', 'byt_brands.id')
    .leftJoin('byt_variations', 'byt_products.variation_id', 'byt_variations.id')
    .select(
      'byt_products.id',
      'byt_products.name',
      'byt_products.sku_code',
      'byt_products.description',
      'byt_products.price',
      'byt_products.selling_price',
      'byt_products.gst',
      'byt_products.hsn_code',
      'byt_products.status',
      'byt_products.category_id',
      'byt_products.subcategory_id',
      'byt_products.brand_id',
      'byt_products.variation_id',
      'byt_products.product_type',
      'byt_products.parent_product_id',
      'byt_products.color',
      'byt_products.size_dimension',
      'byt_products.created_at',
      'byt_products.updated_at',
      'byt_products.deleted_at',
      knex.raw('byt_products.stock - COALESCE(byt_products.held_quantity, 0) as stock'),
      'parent_categories.name as category_name',
      'sub_categories.name as subcategory_name',
      'byt_brands.name as brand_name',
      'byt_variations.label as variation_label',
      'byt_variations.value as variation_value'
    )
    .where('byt_products.deleted_at', null)
    .where('byt_products.status', 1)
    .orderByRaw('RANDOM()');

  // Add category filter (multiple categories)
  if (categoryIds && categoryIds.length > 0) {
    query = query.whereIn('byt_products.category_id', categoryIds);
  }

  // Add limit
  query = query.limit(limit);

  return query;
}

// Get products for dropdown (id and name only, with search)
export async function getProductsForDropdown({ search = '', limit = 50 } = {}) {
  let query = knex('byt_products')
    .select('id', 'name')
    .where('deleted_at', null)
    .where('status', 1)
    .whereRaw('stock > COALESCE(held_quantity, 0)');

  // Add search functionality
  if (search) {
    query = query.where('name', 'ilike', `%${search}%`);
  }

  // Add ordering and limit
  query = query.orderBy('name').limit(limit);

  return query;
}
