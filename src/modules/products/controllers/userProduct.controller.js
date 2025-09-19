import * as services from '../services/userProduct.services.js';

export async function getUserProducts(req, res) {
  try {
    const page = parseInt(req.body?.page) || 1;
    const limit = parseInt(req.body?.limit) || 10;
    const search = req.body?.search || '';

    // Handle multiple filters as arrays
    const categoryIds = Array.isArray(req.body?.category_ids)
      ? req.body.category_ids.map(id => parseInt(id)).filter(id => !isNaN(id))
      : (req.body?.category_id ? [parseInt(req.body.category_id)] : []);

    const brandIds = Array.isArray(req.body?.brand_ids)
      ? req.body.brand_ids.map(id => parseInt(id)).filter(id => !isNaN(id))
      : (req.body?.brand_id ? [parseInt(req.body.brand_id)] : []);

    const minPrice = req.body?.min_price ? parseFloat(req.body.min_price) : null;
    const maxPrice = req.body?.max_price ? parseFloat(req.body.max_price) : null;

    const sizeDimensions = Array.isArray(req.body?.size_dimensions)
      ? req.body.size_dimensions.filter(dim => dim && dim.trim() !== '')
      : (req.body?.size_dimension ? [req.body.size_dimension] : []);

    const colors = Array.isArray(req.body?.colors)
      ? req.body.colors.filter(color => color && color.trim() !== '')
      : (req.body?.color ? [req.body.color] : []);

    const variationIds = Array.isArray(req.body?.variation_ids)
      ? req.body.variation_ids.map(id => parseInt(id)).filter(id => !isNaN(id))
      : (req.body?.variation_id ? [parseInt(req.body.variation_id)] : []);

    const result = await services.getUserProductsService({
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

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      products: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getUserProducts:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function getProductFilterValues(req, res) {
  try {
    const result = await services.getProductFilterValuesService();

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      filters: result.filters
    });
  } catch (error) {
    console.error('Error in getProductFilterValues:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function getNewArrivalsProducts(req, res) {
  try {
    const categoryIds = Array.isArray(req.body?.category_ids)
      ? req.body.category_ids.map(id => parseInt(id)).filter(id => !isNaN(id))
      : [];
    const limit = parseInt(req.body?.limit) || 4;

    const result = await services.getNewArrivalsProductsService({
      categoryIds,
      limit
    });

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      products: result.products
    });
  } catch (error) {
    console.error('Error in getNewArrivalsProducts:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function getTopSellingProducts(req, res) {
  try {
    const categoryIds = Array.isArray(req.body?.category_ids)
      ? req.body.category_ids.map(id => parseInt(id)).filter(id => !isNaN(id))
      : [];
    const limit = parseInt(req.body?.limit) || 8;

    const result = await services.getTopSellingProductsService({
      categoryIds,
      limit
    });

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      products: result.products
    });
  } catch (error) {
    console.error('Error in getTopSellingProducts:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function getRandomProducts(req, res) {
  try {
    const categoryIds = Array.isArray(req.body?.category_ids)
      ? req.body.category_ids.map(id => parseInt(id)).filter(id => !isNaN(id))
      : [];
    const limit = parseInt(req.body?.limit) || 10;

    const result = await services.getRandomProductsService({
      categoryIds,
      limit
    });

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      products: result.products
    });
  } catch (error) {
    console.error('Error in getRandomProducts:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function getGlobalSearch(req, res) {
  try {
    const search = req.body.search || '';
    const limit = parseInt(req.body.limit) || 10;

    const result = await services.getGlobalSearchService({
      search,
      limit
    });

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      products: result.products,
      categories: result.categories,
      brands: result.brands
    });
  } catch (error) {
    console.error('Error in getGlobalSearch:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get single product by ID for users
export async function getUserProductById(req, res) {
  try {
    const { id } = req.params;

    const result = await services.getUserProductByIdService(id);

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      product: result.product
    });
  } catch (error) {
    console.error('Error in getUserProductById:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}
