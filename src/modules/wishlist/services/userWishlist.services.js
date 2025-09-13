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
export async function getWishlistItemsService(userId) {
  try {
    const wishlistItems = await models.getUserWishlistItems(userId);
    return { status: 200, wishlistItems };
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
