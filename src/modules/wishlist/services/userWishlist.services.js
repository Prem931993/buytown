import * as models from '../models/wishlist.models.js';

// Add item to wishlist service
export async function addToWishlistService(userId, wishlistData) {
  try {
    const result = await models.addToWishlist(userId, wishlistData);
    return { status: 201, message: 'Item added to wishlist successfully', wishlistItem: result[0] };
  } catch (error) {
    console.error('Error in addToWishlistService:', error);
    return { error: error.message, status: 400 };
  }
}

// Get user wishlist items service
export async function getWishlistItemsService(userId, { page = 1, limit = 10 } = {}) {
  try {
    const result = await models.getUserWishlistItems(userId, { page, limit });
    return { status: 200, wishlistItems: result.items, pagination: result.pagination };
  } catch (error) {
    console.error('Error in getWishlistItemsService:', error);
    return { error: 'Failed to fetch wishlist items', status: 500 };
  }
}

// Remove wishlist item service
export async function removeWishlistItemService(userId, wishlistItemId) {
  try {
    await models.removeWishlistItem(userId, wishlistItemId);
    return { status: 200, message: 'Item removed from wishlist successfully' };
  } catch (error) {
    console.error('Error in removeWishlistItemService:', error);
    return { error: error.message, status: 400 };
  }
}

// Move wishlist item to cart service
export async function moveWishlistItemToCartService(userId, wishlistItemId) {
  try {
    const result = await models.moveWishlistItemToCart(userId, wishlistItemId);
    return { status: 200, message: 'Item moved to cart successfully', cartItem: result[0] };
  } catch (error) {
    console.error('Error in moveWishlistItemToCartService:', error);
    return { error: error.message, status: 400 };
  }
}

// Toggle wishlist status for a product
export async function toggleWishlistService(userId, productId) {
  try {
    // Check if product exists and is active
    const product = await models.getProductById(productId);
    if (!product || product.status !== 1) {
      return { error: 'Product not found or inactive', status: 404 };
    }

    // Check if item already exists in wishlist
    const existingItem = await models.getWishlistItemByUserAndProduct(userId, productId);

    if (existingItem) {
      // Remove from wishlist
      await models.removeWishlistItem(userId, existingItem.id);
      return {
        message: 'Product removed from wishlist',
        is_wishlisted: false,
        status: 200
      };
    } else {
      // Add to wishlist
      await models.addToWishlist(userId, { product_id: productId, variation_id: null });
      return {
        message: 'Product added to wishlist',
        is_wishlisted: true,
        status: 200
      };
    }
  } catch (error) {
    console.error('Error in toggleWishlistService:', error);
    return { error: 'Failed to toggle wishlist status', status: 500 };
  }
}