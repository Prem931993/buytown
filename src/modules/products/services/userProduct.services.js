import * as models from '../models/product.models.js';

export async function getUserProductsService({
  page = 1,
  limit = 10,
  search = '',
  categoryId = null,
  brandId = null,
  minPrice = null,
  maxPrice = null
} = {}) {
  try {
    // Get products with filters
    const products = await models.getAllProducts({
      page,
      limit,
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice
    });

    // Get total count for pagination
    const totalCount = await models.getProductsCount({
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice
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
