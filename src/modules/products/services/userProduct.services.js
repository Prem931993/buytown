import * as models from '../models/product.models.js';

export async function getUserProductsService({
  page = 1,
  limit = 10,
  search = '',
  categoryIds = [],
  brandIds = [],
  minPrice = null,
  maxPrice = null,
  sizeDimensions = [],
  colors = [],
  variationIds = []
} = {}) {
  try {
    // Get products with filters
    const products = await models.getAllProducts({
      page,
      limit,
      search,
      categoryIds,
      brandIds,
      minPrice,
      maxPrice,
      sizeDimensions,
      colors,
      variationIds
    });

    // Get total count for pagination
    const totalCount = await models.getProductsCount({
      search,
      categoryIds,
      brandIds,
      minPrice,
      maxPrice,
      sizeDimensions,
      colors,
      variationIds
    });


    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Process products to include images and other details
    const processedProducts = await Promise.all(products.map(async (product) => {
      // Get product images
      const images = await models.getProductImages(product.id);

      // Get product variations if any
      const variations = await models.getProductVariations(product.id);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        selling_price: product.selling_price,
        discount: product.discount,
        gst: product.gst,
        stock: product.stock,
        status: product.status,
        sku_code: product.sku_code,
        category_name: product.category_name,
        subcategory_name: product.subcategory_name,
        brand_name: product.brand_name,
        images: images.map(img => ({
          id: img.id,
          path: img.image_path,
          sort_order: img.sort_order,
          is_primary: img.is_primary
        })),
        variations: variations.map(variation => ({
          id: variation.id,
          variation_label: variation.variation_label,
          variation_value: variation.variation_value,
          price: variation.price,
          stock: variation.stock
        }))
      };
    }));

    return {
      products: processedProducts,
      pagination: {
        current_page: page,
        per_page: limit,
        total_count: totalCount,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      },
      status: 200
    };
  } catch (error) {
    console.error('Error in getUserProductsService:', error);
    return { error: 'Failed to fetch products', status: 500 };
  }
}

// Get product filter values service
export async function getProductFilterValuesService() {
  try {
    const filterValues = await models.getProductFilterValues();

    return {
      filters: filterValues,
      status: 200
    };
  } catch (error) {
    console.error('Error in getProductFilterValuesService:', error);
    return { error: 'Failed to fetch filter values', status: 500 };
  }
}

// Get single product by ID for users
export async function getUserProductByIdService(id) {
  try {
    // Get product by ID
    const product = await models.getProductById(id);

    if (!product) {
      return { error: 'Product not found', status: 404 };
    }

    // Check if product is active (status = 1)
    if (product.status !== 1) {
      return { error: 'Product not available', status: 404 };
    }

    // Get product images
    const images = await models.getProductImages(product.id);

    // Get product variations if any
    const variations = await models.getProductVariations(product.id);

    // Get related products
    const relatedProducts = await models.getRelatedProducts(product.id);

    // Process related products to include images
    const processedRelatedProducts = await Promise.all(relatedProducts.map(async (relatedProduct) => {
      const relatedImages = await models.getProductImages(relatedProduct.id);
      return {
        id: relatedProduct.id,
        name: relatedProduct.name,
        sku_code: relatedProduct.sku_code,
        price: relatedProduct.price,
        stock: relatedProduct.stock,
        images: relatedImages.map(img => ({
          id: img.id,
          path: img.image_path,
          sort_order: img.sort_order,
          is_primary: img.is_primary
        }))
      };
    }));

    // If this is a parent product, get child products
    let childProducts = [];
    if (product.product_type === 'parent') {
      childProducts = await models.getChildProducts(product.id);

      // Process child products to include images
      childProducts = await Promise.all(childProducts.map(async (childProduct) => {
        const childImages = await models.getProductImages(childProduct.id);
        return {
          id: childProduct.id,
          name: childProduct.name,
          sku_code: childProduct.sku_code,
          price: childProduct.price,
          stock: childProduct.stock,
          images: childImages.map(img => ({
            id: img.id,
            path: img.image_path,
            sort_order: img.sort_order,
            is_primary: img.is_primary
          }))
        };
      }));
    }

    // If this is a child product, get parent product
    let parentProduct = null;
    if (product.product_type === 'child' && product.parent_product_id) {
      parentProduct = await models.getParentProduct(product.id);
      if (parentProduct) {
        const parentImages = await models.getProductImages(parentProduct.id);
        parentProduct = {
          id: parentProduct.id,
          name: parentProduct.name,
          sku_code: parentProduct.sku_code,
          images: parentImages.map(img => ({
            id: img.id,
            path: img.image_path,
            sort_order: img.sort_order,
            is_primary: img.is_primary
          }))
        };
      }
    }

    // Return processed product data
    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        selling_price: product.selling_price,
        discount: product.discount,
        gst: product.gst,
        stock: product.stock,
        status: product.status,
        sku_code: product.sku_code,
        hsn_code: product.hsn_code,
        color: product.color,
        size_dimension: product.size_dimension,
        weight_kg: product.weight_kg,
        length_mm: product.length_mm,
        width_mm: product.width_mm,
        height_mm: product.height_mm,
        unit: product.unit,
        product_type: product.product_type,
        category_name: product.category_name,
        subcategory_name: product.subcategory_name,
        brand_name: product.brand_name,
        images: images.map(img => ({
          id: img.id,
          path: img.image_path,
          sort_order: img.sort_order,
          is_primary: img.is_primary
        })),
        variations: variations.map(variation => ({
          id: variation.id,
          variation_label: variation.variation_label,
          variation_value: variation.variation_value,
          price: variation.price,
          stock: variation.stock
        })),
        relatedProducts: processedRelatedProducts,
        childProducts: childProducts,
        parentProduct: parentProduct
      },
      status: 200
    };
  } catch (error) {
    console.error('Error in getUserProductByIdService:', error);
    return { error: 'Failed to fetch product', status: 500 };
  }
}

// Get new arrivals products service
export async function getNewArrivalsProductsService({ categoryIds = [], limit = 4 } = {}) {
  try {
    // Get new arrivals products
    const products = await models.getNewArrivalsProducts({ categoryIds, limit });

    // Process products to include images and other details
    const processedProducts = await Promise.all(products.map(async (product) => {
      // Get product images
      const images = await models.getProductImages(product.id);

      // Get product variations if any
      const variations = await models.getProductVariations(product.id);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        selling_price: product.selling_price,
        discount: product.discount,
        gst: product.gst,
        stock: product.stock,
        status: product.status,
        sku_code: product.sku_code,
        category_name: product.category_name,
        subcategory_name: product.subcategory_name,
        brand_name: product.brand_name,
        images: images.map(img => ({
          id: img.id,
          path: img.image_path,
          sort_order: img.sort_order,
          is_primary: img.is_primary
        })),
        variations: variations.map(variation => ({
          id: variation.id,
          variation_label: variation.variation_label,
          variation_value: variation.variation_value,
          price: variation.price,
          stock: variation.stock
        }))
      };
    }));

    return {
      products: processedProducts,
      status: 200
    };
  } catch (error) {
    console.error('Error in getNewArrivalsProductsService:', error);
    return { error: 'Failed to fetch new arrivals products', status: 500 };
  }
}

// Get top selling products service
export async function getTopSellingProductsService({ categoryIds = [], limit = 8 } = {}) {
  try {
    // Get top selling products
    const products = await models.getTopSellingProducts({ categoryIds, limit });

    // Process products to include images and other details
    const processedProducts = await Promise.all(products.map(async (product) => {
      // Get product images
      const images = await models.getProductImages(product.id);

      // Get product variations if any
      const variations = await models.getProductVariations(product.id);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        selling_price: product.selling_price,
        discount: product.discount,
        gst: product.gst,
        stock: product.stock,
        status: product.status,
        sku_code: product.sku_code,
        category_name: product.category_name,
        subcategory_name: product.subcategory_name,
        brand_name: product.brand_name,
        total_sold: product.total_sold || 0,
        images: images.map(img => ({
          id: img.id,
          path: img.image_path,
          sort_order: img.sort_order,
          is_primary: img.is_primary
        })),
        variations: variations.map(variation => ({
          id: variation.id,
          variation_label: variation.variation_label,
          variation_value: variation.variation_value,
          price: variation.price,
          stock: variation.stock
        }))
      };
    }));

    return {
      products: processedProducts,
      status: 200
    };
  } catch (error) {
    console.error('Error in getTopSellingProductsService:', error);
    return { error: 'Failed to fetch top selling products', status: 500 };
  }
}

// Get random products service
export async function getRandomProductsService({ categoryIds = [], limit = 10 } = {}) {
  try {
    // Get random products
    const products = await models.getRandomProducts({ categoryIds, limit });

    // Process products to include images and other details
    const processedProducts = await Promise.all(products.map(async (product) => {
      // Get product images
      const images = await models.getProductImages(product.id);

      // Get product variations if any
      const variations = await models.getProductVariations(product.id);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        selling_price: product.selling_price,
        discount: product.discount,
        gst: product.gst,
        stock: product.stock,
        status: product.status,
        sku_code: product.sku_code,
        category_name: product.category_name,
        subcategory_name: product.subcategory_name,
        brand_name: product.brand_name,
        images: images.map(img => ({
          id: img.id,
          path: img.image_path,
          sort_order: img.sort_order,
          is_primary: img.is_primary
        })),
        variations: variations.map(variation => ({
          id: variation.id,
          variation_label: variation.variation_label,
          variation_value: variation.variation_value,
          price: variation.price,
          stock: variation.stock
        }))
      };
    }));

    return {
      products: processedProducts,
      status: 200
    };
  } catch (error) {
    console.error('Error in getRandomProductsService:', error);
    return { error: 'Failed to fetch random products', status: 500 };
  }
}

// Global search service
export async function getGlobalSearchService({ search = '', limit = 10 } = {}) {
  try {
    const result = await models.getGlobalSearch({ search, limit });

    // Process products to include images and variations
    const processedProducts = await Promise.all(result.products.map(async (product) => {
      // Get product images
      const images = await models.getProductImages(product.id);

      // Get product variations if any
      const variations = await models.getProductVariations(product.id);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        selling_price: product.selling_price,
        discount: product.discount,
        gst: product.gst,
        stock: product.stock,
        status: product.status,
        sku_code: product.sku_code,
        category_name: product.category_name,
        subcategory_name: product.subcategory_name,
        brand_name: product.brand_name,
        images: images.map(img => ({
          id: img.id,
          path: img.image_path,
          sort_order: img.sort_order,
          is_primary: img.is_primary
        })),
        variations: variations.map(variation => ({
          id: variation.id,
          variation_label: variation.variation_label,
          variation_value: variation.variation_value,
          price: variation.price,
          stock: variation.stock
        }))
      };
    }));

    return {
      products: processedProducts,
      categories: result.categories,
      brands: result.brands,
      status: 200
    };
  } catch (error) {
    console.error('Error in getGlobalSearchService:', error);
    return { error: 'Failed to perform global search', status: 500 };
  }
}
