import * as services from '../services/userWishlist.services.js';

// Add item to wishlist
export async function addToWishlist(req, res) {
  try {
    const userId = req.user.id;
    const { product_id, variation_id } = req.body;

    // Validate required fields
    if (!product_id) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Product ID is required'
      });
    }

    const result = await services.addToWishlistService(userId, {
      product_id: parseInt(product_id),
      variation_id: variation_id ? parseInt(variation_id) : null
    });

    if (result.error) {
      return res.status(result.status).json({
        statusCode: result.status,
        error: result.error
      });
    }

    res.status(result.status).json({
      statusCode: result.status,
      message: result.message,
      data: result.wishlistItem
    });
  } catch (error) {
    console.error('Error in addToWishlist:', error);
    res.status(500).json({
      statusCode: 500,
      error: 'Internal server error'
    });
  }
}

// Get user wishlist items
export async function getWishlistItems(req, res) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await services.getWishlistItemsService(userId, { page, limit });

    if (result.error) {
      return res.status(result.status).json({
        statusCode: result.status,
        error: result.error
      });
    }

    res.status(result.status).json({
      statusCode: result.status,
      data: result.wishlistItems,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getWishlistItems:', error);
    res.status(500).json({
      statusCode: 500,
      error: 'Internal server error'
    });
  }
}

// Remove item from wishlist
export async function removeWishlistItem(req, res) {
  try {
    const userId = req.user.id;
    const { wishlist_item_id } = req.body;

    // Validate required fields
    if (!wishlist_item_id) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Wishlist item ID is required'
      });
    }

    const result = await services.removeWishlistItemService(userId, parseInt(wishlist_item_id));

    if (result.error) {
      return res.status(result.status).json({
        statusCode: result.status,
        error: result.error
      });
    }

    res.status(result.status).json({
      statusCode: result.status,
      message: result.message
    });
  } catch (error) {
    console.error('Error in removeWishlistItem:', error);
    res.status(500).json({
      statusCode: 500,
      error: 'Internal server error'
    });
  }
}

// Move wishlist item to cart
export async function moveWishlistItemToCart(req, res) {
  try {
    const userId = req.user.id;
    const { wishlist_item_id } = req.body;

    // Validate required fields
    if (!wishlist_item_id) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Wishlist item ID is required'
      });
    }

    const result = await services.moveWishlistItemToCartService(userId, parseInt(wishlist_item_id));

    if (result.error) {
      return res.status(result.status).json({
        statusCode: result.status,
        error: result.error
      });
    }

    res.status(result.status).json({
      statusCode: result.status,
      message: result.message,
      data: result.cartItem
    });
  } catch (error) {
    console.error('Error in moveWishlistItemToCart:', error);
    res.status(500).json({
      statusCode: 500,
      error: 'Internal server error'
    });
  }
}

// Toggle wishlist status for a product
export async function toggleWishlist(req, res) {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const result = await services.toggleWishlistService(userId, parseInt(productId));

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      message: result.message,
      is_wishlisted: result.is_wishlisted
    });
  } catch (error) {
    console.error('Error in toggleWishlist:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}
